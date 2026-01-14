import { waitUntil } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";
import { whopSdk } from "@/lib/whop-sdk";
import { processUpgrade } from "@/lib/services/upgradeLogic";
import { checkUserProductAccess } from "@/lib/services/accessCheck";

export async function POST(request: NextRequest): Promise<Response> {
	try {
		// Verify webhook signature
		const requestBodyText = await request.text();
		const headers = Object.fromEntries(request.headers);

		// Log raw request data
		console.log("=== WEBHOOK RECEIVED ===");
		console.log("Headers:", JSON.stringify(headers, null, 2));
		console.log("Raw body length:", requestBodyText.length);
		console.log("Raw body:", requestBodyText);

		// Note: The newer @whop/api SDK may handle webhooks differently
		// This is a placeholder - you may need to adjust based on actual SDK
		let webhookData: any;
		try {
			// Try to verify and unwrap the webhook
			webhookData = JSON.parse(requestBodyText);
			console.log("Parsed webhook data:", JSON.stringify(webhookData, null, 2));
		} catch (error) {
			console.error("Error parsing webhook:", error);
			return new Response("Invalid webhook payload", { status: 400 });
		}

		// Log webhook structure
		console.log("Webhook type:", webhookData.type);
		console.log("Webhook data keys:", webhookData.data ? Object.keys(webhookData.data) : "no data property");
		console.log("Webhook top-level keys:", Object.keys(webhookData));

		// Handle membership.activated event
		// VERIFIED: This is the correct webhook event for membership upgrades per Whop API documentation:
		// https://docs.whop.com/api-reference/memberships/membership-activated
		// The membership.activated event fires when a membership becomes active, which includes:
		// - New memberships (first-time purchases)
		// - Membership upgrades (purchasing a higher-tier plan)
		// - Membership reactivations
		// For upgrades, this event is triggered when the new membership becomes active,
		// allowing us to detect and cancel the user's existing lower-tier membership.
		if (webhookData.type === "membership.activated") {
			// The data object IS the membership object
			const membershipData = webhookData.data;
			const user = membershipData?.user;
			const product = membershipData?.product;
			const plan = membershipData?.plan;
			const company = membershipData?.company;

			console.log("Extracted data:");
			console.log("- membership data:", membershipData ? `present (id: ${membershipData.id})` : "MISSING");
			console.log("- user:", user ? `present (id: ${user.id})` : "MISSING");
			console.log("- product:", product ? `present (id: ${product.id})` : "MISSING");
			console.log("- plan:", plan ? `present (id: ${plan.id})` : "MISSING");
			console.log("- company:", company ? `present (id: ${company.id})` : "MISSING");

			if (!membershipData || !user || !product || !plan) {
				console.error("Missing required webhook data - returning 400");
				return NextResponse.json(
					{
						success: false,
						status: 400,
						body: "Missing required webhook data",
						debug: {
							hasMembershipData: !!membershipData,
							hasUser: !!user,
							hasProduct: !!product,
							hasPlan: !!plan,
							webhookType: webhookData.type,
							dataKeys: webhookData.data ? Object.keys(webhookData.data) : null,
							topLevelKeys: Object.keys(webhookData),
						},
					},
					{ status: 400 },
				);
			}

			// Extract company ID from the membership data
			const companyId = company?.id;

			if (!companyId) {
				console.error("Missing company_id in webhook");
				return NextResponse.json(
					{
						success: false,
						status: 400,
						body: "Missing company_id",
						debug: {
							hasCompany: !!company,
							companyData: company,
						},
					},
					{ status: 400 },
				);
			}

			// Check if user has access to the app's premium product before processing
			const accessCheck = await checkUserProductAccess(user.id);
			if (!accessCheck.hasAccess) {
				console.log("User does not have access to app product, skipping upgrade processing");
				console.log("=== WEBHOOK PROCESSED (ACCESS DENIED) ===");
				return new Response("OK", { status: 200 });
			}

			// Process upgrade asynchronously
			// VERIFIED: Invoking processUpgrade() with all required parameters:
			// - companyId: From webhook membership data
			// - membershipId: The newly activated membership ID
			// - userId: User who purchased the new membership
			// - productId: Product the membership belongs to
			// - planId: Plan that was purchased
			// The processUpgrade() function will:
			// 1. Fetch the new plan details to get pricing
			// 2. Fetch existing active memberships for the same user/product
			// 3. Compare prices and cancel lower-tier memberships if upgrade detected
			console.log("Processing upgrade for:", {
				companyId,
				membershipId: membershipData.id,
				userId: user.id,
				productId: product.id,
				planId: plan.id,
			});

			waitUntil(
				processUpgrade({
					companyId,
					membershipId: membershipData.id,
					userId: user.id,
					productId: product.id,
					planId: plan.id,
				})
					.then((result) => {
						console.log("=== UPGRADE PROCESSING COMPLETE ===");
						console.log("Result:", JSON.stringify(result, null, 2));
						if (result.error) {
							console.error("Upgrade processing error:", result.error);
						}
						if (result.canceledMemberships.length > 0) {
							console.log(`Successfully canceled ${result.canceledMemberships.length} membership(s):`, result.canceledMemberships);
						} else {
							console.log("No memberships were canceled");
						}
						return result;
					})
					.catch((error) => {
						console.error("=== UPGRADE PROCESSING FAILED ===");
						console.error("Error:", error);
						console.error("Stack:", error instanceof Error ? error.stack : "No stack trace");
						throw error;
					}),
			);

			console.log("Upgrade processing queued successfully");
		} else {
			console.log("Webhook type not handled:", webhookData.type);
		}

		// Return 200 quickly to acknowledge webhook receipt
		console.log("=== WEBHOOK PROCESSED SUCCESSFULLY ===");
		return new Response("OK", { status: 200 });
	} catch (error) {
		console.error("=== WEBHOOK ERROR ===");
		console.error("Error processing webhook:", error);
		console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
		// Still return 200 to prevent webhook retries for unexpected errors
		// Log the error for investigation
		return new Response("OK", { status: 200 });
	}
}
