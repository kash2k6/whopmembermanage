import { waitUntil } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";
import { whopSdk } from "@/lib/whop-sdk";
import { processUpgrade } from "@/lib/services/upgradeLogic";

export async function POST(request: NextRequest): Promise<Response> {
	try {
		// Verify webhook signature
		const requestBodyText = await request.text();
		const headers = Object.fromEntries(request.headers);

		// Note: The newer @whop/api SDK may handle webhooks differently
		// This is a placeholder - you may need to adjust based on actual SDK
		let webhookData: any;
		try {
			// Try to verify and unwrap the webhook
			webhookData = JSON.parse(requestBodyText);
		} catch (error) {
			console.error("Error parsing webhook:", error);
			return new Response("Invalid webhook payload", { status: 400 });
		}

		// Handle membership.activated event
		if (webhookData.type === "membership.activated") {
			const { membership, user, product, plan } = webhookData.data;

			if (!membership || !user || !product || !plan) {
				return new Response("Missing required webhook data", { status: 400 });
			}

			// Extract company ID from the webhook context or membership
			const companyId = webhookData.company_id || membership.company_id;

			if (!companyId) {
				console.error("Missing company_id in webhook");
				return new Response("Missing company_id", { status: 400 });
			}

			// Process upgrade asynchronously
			waitUntil(
				processUpgrade({
					companyId,
					membershipId: membership.id,
					userId: user.id,
					productId: product.id,
					planId: plan.id,
				}),
			);
		}

		// Return 200 quickly to acknowledge webhook receipt
		return new Response("OK", { status: 200 });
	} catch (error) {
		console.error("Error processing webhook:", error);
		// Still return 200 to prevent webhook retries for unexpected errors
		// Log the error for investigation
		return new Response("OK", { status: 200 });
	}
}
