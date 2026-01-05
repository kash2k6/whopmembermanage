import { NextRequest, NextResponse } from "next/server";
import { APP_PLAN_ID } from "@/lib/constants";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { companyId, planId } = body;

		// Use provided planId or fall back to constant
		const targetPlanId = planId || APP_PLAN_ID;

		if (!process.env.WHOP_API_KEY || process.env.WHOP_API_KEY === "fallback") {
			return NextResponse.json(
				{ error: "WHOP_API_KEY is not configured" },
				{ status: 500 },
			);
		}

		// Create checkout configuration using plan_id (simpler approach)
		// Reference: Based on checkoutflow implementation
		// When using plan_id, do NOT include company_id - the plan already belongs to a company
		const checkoutConfigResponse = await fetch(
			"https://api.whop.com/api/v1/checkout_configurations",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					plan_id: targetPlanId,
					metadata: {
						app: "member-upgrade-management",
						source: "in_app_purchase",
					},
				}),
			},
		);

		if (!checkoutConfigResponse.ok) {
			const errorData = await checkoutConfigResponse.json();
			console.error("Failed to create checkout configuration:", {
				status: checkoutConfigResponse.status,
				error: errorData,
			});
			return NextResponse.json(
				{
					error: "Failed to create checkout configuration",
					details: errorData.error?.message || errorData.message || "Unknown error",
				},
				{ status: checkoutConfigResponse.status },
			);
		}

		const checkoutConfig = await checkoutConfigResponse.json();
		console.log("Checkout configuration created:", {
			id: checkoutConfig.id,
			planId: targetPlanId,
		});

		return NextResponse.json({
			id: checkoutConfig.id,
			planId: targetPlanId,
		});
	} catch (error) {
		console.error("Error creating checkout configuration:", error);
		return NextResponse.json(
			{
				error: "Failed to create checkout configuration",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
