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

	try {
		// Fetch the new plan details
		const newPlan = await fetchPlan(companyId, planId);
		if (!newPlan) {
			return {
				success: false,
				canceledMemberships: [],
				error: "Failed to fetch new plan details",
			};
		}

		// Only process renewal plans
		if (newPlan.plan_type !== "renewal") {
			return {
				success: true,
				canceledMemberships: [],
			};
		}

		// Fetch active memberships for the same user and product
		const activeMemberships = await fetchActiveMemberships(
			companyId,
			userId,
			productId,
		);

		// Filter out the new membership itself
		const existingMemberships = activeMemberships.filter(
			(m) => m.id !== membershipId,
		);

		if (existingMemberships.length === 0) {
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

		for (const membership of existingMemberships) {
			const existingPlan = await fetchPlan(companyId, membership.plan_id);
			if (!existingPlan || existingPlan.plan_type !== "renewal") {
				continue;
			}

			// Get existing plan price
			const existingPlanPrice = existingPlan.renewal_price || existingPlan.initial_price || 0;

			// Check if we should ignore free plans
			if (config.ignore_free_plans && existingPlanPrice === 0) {
				continue;
			}

			// Determine if this is an upgrade, downgrade, or same price
			const isDowngrade = newPlanPrice < existingPlanPrice;
			const isSamePrice = newPlanPrice === existingPlanPrice;

			// Handle upgrades (new price > old price) - always cancel old plan
			if (!isDowngrade && !isSamePrice) {
				// This is an upgrade - cancel the old plan
				membershipsToCancel.push(membership.id);
			}
			// Handle same price (if configured to treat as upgrade)
			else if (isSamePrice && config.treat_same_price_as_upgrade) {
				membershipsToCancel.push(membership.id);
			}
			// Handle downgrades (new price < old price)
			else if (isDowngrade) {
				// Only cancel on downgrade if explicitly allowed
				// By default, downgrades NEVER cancel the old plan
				if (config.allow_downgrade_to_cancel) {
					membershipsToCancel.push(membership.id);
				}
				// Otherwise, do nothing (keep old plan active - default behavior)
			}
		}

		// Cancel the memberships
		const canceledIds: string[] = [];
		for (const membershipIdToCancel of membershipsToCancel) {
			const membershipToCancel = existingMemberships.find(
				(m) => m.id === membershipIdToCancel,
			);
			if (!membershipToCancel) continue;

			// Fetch old plan details for logging
			const oldPlan = await fetchPlan(companyId, membershipToCancel.plan_id);

			const success = await cancelMembership(
				companyId,
				membershipIdToCancel,
				cancellationTiming,
			);
			if (success) {
				canceledIds.push(membershipIdToCancel);

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
		await supabaseAdmin?.from("activity_logs").insert({
			company_id: params.companyId,
			user_id: params.userId,
			product_id: params.productId,
			old_plan_id: params.oldPlanId,
			new_plan_id: params.newPlanId,
			old_plan_name: params.oldPlanName,
			new_plan_name: params.newPlanName,
			status: params.status,
			error_message: params.errorMessage || null,
		});
	} catch (error) {
		console.error("Error logging activity:", error);
	}
}
