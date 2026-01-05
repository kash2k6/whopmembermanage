import {
	cancelMembership,
	fetchActiveMemberships,
	fetchPlan,
	type WhopMembership,
	type WhopPlan,
} from "@/lib/whop/client";
import { supabaseAdmin } from "@/lib/db/client";

interface ProcessUpgradeParams {
	companyId: string;
	membershipId: string;
	userId: string;
	productId: string;
	planId: string;
}

interface UpgradeResult {
	success: boolean;
	canceledMemberships: string[];
	error?: string;
}

/**
 * Process membership upgrade: check for existing memberships and cancel lower-tier ones
 */
export async function processUpgrade(
	params: ProcessUpgradeParams,
): Promise<UpgradeResult> {
	const { companyId, membershipId, userId, productId, planId } = params;

	console.log("=== STARTING UPGRADE PROCESSING ===");
	console.log("Params:", { companyId, membershipId, userId, productId, planId });

	try {
		// Fetch the new plan details
		console.log(`Fetching new plan details for planId: ${planId}`);
		const newPlan = await fetchPlan(companyId, planId);
		if (!newPlan) {
			console.error("Failed to fetch new plan details");
			return {
				success: false,
				canceledMemberships: [],
				error: "Failed to fetch new plan details",
			};
		}
		console.log("New plan fetched:", {
			id: newPlan.id,
			title: newPlan.title,
			type: newPlan.plan_type,
			renewalPrice: newPlan.renewal_price,
			initialPrice: newPlan.initial_price,
		});

		// Only process renewal plans
		if (newPlan.plan_type !== "renewal") {
			console.log(`Skipping: Plan type is ${newPlan.plan_type}, not renewal`);
			return {
				success: true,
				canceledMemberships: [],
			};
		}

		// Fetch active memberships for the same user and product
		console.log(`Fetching active memberships for user ${userId} and product ${productId}`);
		const activeMemberships = await fetchActiveMemberships(
			companyId,
			userId,
			productId,
		);
		console.log(`Found ${activeMemberships.length} active membership(s):`, activeMemberships.map(m => ({ id: m.id, planId: m.plan_id, status: m.status })));

		// Filter out the new membership itself
		const existingMemberships = activeMemberships.filter(
			(m) => m.id !== membershipId,
		);
		console.log(`After filtering out new membership, ${existingMemberships.length} existing membership(s) to check`);

		if (existingMemberships.length === 0) {
			console.log("No existing memberships found, nothing to cancel");
			// Log that no action was needed
			await logActivity({
				companyId,
				userId,
				productId,
				oldPlanId: null,
				newPlanId: planId,
				oldPlanName: null,
				newPlanName: newPlan.title,
				status: "skipped",
				errorMessage: "No existing memberships to cancel",
			});
			return {
				success: true,
				canceledMemberships: [],
			};
		}

		// Fetch product config to check if enabled
		if (!supabaseAdmin) {
			return {
				success: false,
				canceledMemberships: [],
				error: "Database not configured",
			};
		}

		const { data: config } = await supabaseAdmin
			.from("product_configs")
			.select("*")
			.eq("company_id", companyId)
			.eq("product_id", productId)
			.single();

		if (!config || !config.enabled) {
			// Product not configured or disabled, skip processing
			console.log("Product not configured or disabled, skipping upgrade processing");
			await logActivity({
				companyId,
				userId,
				productId,
				oldPlanId: null,
				newPlanId: planId,
				oldPlanName: null,
				newPlanName: newPlan.title,
				status: "skipped",
				errorMessage: config ? "Upgrade protection disabled" : "Product not configured",
			});
			return {
				success: true,
				canceledMemberships: [],
			};
		}

		// Compare plans and determine which to cancel
		const membershipsToCancel: string[] = [];
		const cancellationTiming = config.cancellation_timing === "immediate";

		// Get new plan price
		const newPlanPrice = newPlan.renewal_price || newPlan.initial_price || 0;
		
		console.log("Processing upgrade check:", {
			newPlanId: planId,
			newPlanPrice,
			existingMembershipsCount: existingMemberships.length,
			config: {
				enabled: config.enabled,
				ignoreFreePlans: config.ignore_free_plans,
				treatSamePriceAsUpgrade: config.treat_same_price_as_upgrade,
				allowDowngradeToCancel: config.allow_downgrade_to_cancel,
			},
		});

		for (const membership of existingMemberships) {
			const existingPlan = await fetchPlan(companyId, membership.plan_id);
			if (!existingPlan || existingPlan.plan_type !== "renewal") {
				console.log(`Skipping membership ${membership.id}: plan not found or not renewal type`);
				continue;
			}

			// Get existing plan price
			const existingPlanPrice = existingPlan.renewal_price || existingPlan.initial_price || 0;

			// Check if we should ignore free plans
			if (config.ignore_free_plans && existingPlanPrice === 0) {
				console.log(`Skipping free plan ${membership.plan_id} (ignore_free_plans enabled)`);
				continue;
			}

			// Determine if this is an upgrade, downgrade, or same price
			const isDowngrade = newPlanPrice < existingPlanPrice;
			const isSamePrice = newPlanPrice === existingPlanPrice;

			console.log(`Comparing plans:`, {
				existingPlanId: membership.plan_id,
				existingPlanPrice,
				newPlanPrice,
				isDowngrade,
				isSamePrice,
			});

			// Handle upgrades (new price > old price) - always cancel old plan
			if (!isDowngrade && !isSamePrice) {
				// This is an upgrade - cancel the old plan
				console.log(`Upgrade detected: ${existingPlanPrice} -> ${newPlanPrice}, will cancel ${membership.id}`);
				membershipsToCancel.push(membership.id);
			}
			// Handle same price (if configured to treat as upgrade)
			else if (isSamePrice && config.treat_same_price_as_upgrade) {
				console.log(`Same price treated as upgrade, will cancel ${membership.id}`);
				membershipsToCancel.push(membership.id);
			}
			// Handle downgrades (new price < old price)
			else if (isDowngrade) {
				// Only cancel on downgrade if explicitly allowed
				// By default, downgrades NEVER cancel the old plan
				if (config.allow_downgrade_to_cancel) {
					console.log(`Downgrade with cancel enabled: ${existingPlanPrice} -> ${newPlanPrice}, will cancel ${membership.id}`);
					membershipsToCancel.push(membership.id);
				} else {
					console.log(`Downgrade detected but cancel disabled: ${existingPlanPrice} -> ${newPlanPrice}, keeping ${membership.id} active`);
				}
				// Otherwise, do nothing (keep old plan active - default behavior)
			}
		}

		// Cancel the memberships
		const canceledIds: string[] = [];
		
		if (membershipsToCancel.length === 0) {
			console.log("No memberships to cancel based on upgrade rules");
			await logActivity({
				companyId,
				userId,
				productId,
				oldPlanId: existingMemberships[0]?.plan_id || null,
				newPlanId: planId,
				oldPlanName: null,
				newPlanName: newPlan.title,
				status: "skipped",
				errorMessage: "No memberships matched cancellation criteria",
			});
		} else {
			console.log(`Canceling ${membershipsToCancel.length} membership(s)`);
		}
		
		for (const membershipIdToCancel of membershipsToCancel) {
			const membershipToCancel = existingMemberships.find(
				(m) => m.id === membershipIdToCancel,
			);
			if (!membershipToCancel) {
				console.error(`Membership ${membershipIdToCancel} not found in existing memberships`);
				continue;
			}

			// Fetch old plan details for logging
			const oldPlan = await fetchPlan(companyId, membershipToCancel.plan_id);

			console.log(`Attempting to cancel membership ${membershipIdToCancel} (plan: ${oldPlan?.title || membershipToCancel.plan_id})`);
			const success = await cancelMembership(
				companyId,
				membershipIdToCancel,
				cancellationTiming,
			);
			if (success) {
				canceledIds.push(membershipIdToCancel);
				console.log(`Successfully canceled membership ${membershipIdToCancel}`);

				// Log the activity
				await logActivity({
					companyId,
					userId,
					productId,
					oldPlanId: membershipToCancel.plan_id,
					newPlanId: planId,
					oldPlanName: oldPlan?.title || null,
					newPlanName: newPlan.title,
					status: "canceled",
				});
			} else {
				console.error(`Failed to cancel membership ${membershipIdToCancel}`);
				await logActivity({
					companyId,
					userId,
					productId,
					oldPlanId: membershipToCancel.plan_id,
					newPlanId: planId,
					oldPlanName: oldPlan?.title || null,
					newPlanName: newPlan.title,
					status: "error",
					errorMessage: `Failed to cancel membership ${membershipIdToCancel}`,
				});
			}
		}

		return {
			success: true,
			canceledMemberships: canceledIds,
		};
	} catch (error) {
		console.error("Error processing upgrade:", error);
		return {
			success: false,
			canceledMemberships: [],
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Check if new plan is an upgrade compared to existing plan based on price
 */
function checkIfUpgrade(
	existingPrice: number,
	newPrice: number,
	treatSamePriceAsUpgrade: boolean,
): boolean {
	if (treatSamePriceAsUpgrade) {
		// Treat same price as upgrade
		return newPrice >= existingPrice;
	}
	// Default: only treat higher price as upgrade
	return newPrice > existingPrice;
}

/**
 * Log upgrade activity to database
 */
async function logActivity(params: {
	companyId: string;
	userId: string;
	productId: string;
	oldPlanId: string | null;
	newPlanId: string;
	oldPlanName: string | null;
	newPlanName: string;
	status: "canceled" | "skipped" | "error";
	errorMessage?: string | null;
}): Promise<void> {
	try {
		if (!supabaseAdmin) {
			console.error("Cannot log activity: supabaseAdmin not configured");
			return;
		}
		
		console.log("Logging activity:", {
			status: params.status,
			oldPlan: params.oldPlanName || params.oldPlanId,
			newPlan: params.newPlanName,
			userId: params.userId,
		});
		
		const { data, error } = await supabaseAdmin.from("activity_logs").insert({
			company_id: params.companyId,
			user_id: params.userId,
			product_id: params.productId,
			old_plan_id: params.oldPlanId,
			new_plan_id: params.newPlanId,
			old_plan_name: params.oldPlanName,
			new_plan_name: params.newPlanName,
			status: params.status,
			error_message: params.errorMessage || null,
		}).select();
		
		if (error) {
			console.error("Error inserting activity log:", error);
		} else {
			console.log("Activity logged successfully:", data);
		}
	} catch (error) {
		console.error("Error logging activity:", error);
	}
}
