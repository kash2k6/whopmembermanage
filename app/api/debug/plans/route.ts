import { NextRequest, NextResponse } from "next/server";
import { fetchPlans } from "@/lib/whop/client";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const companyId = searchParams.get("companyId");
		const productId = searchParams.get("productId");

		if (!companyId || !productId) {
			return NextResponse.json(
				{ error: "companyId and productId are required" },
				{ status: 400 },
			);
		}

		// Fetch plans and get raw API response
		const API_BASE_URL = "https://api.whop.com/api/v1";
		const apiKey = process.env.WHOP_API_KEY;
		
		if (!apiKey) {
			return NextResponse.json(
				{ error: "WHOP_API_KEY not configured" },
				{ status: 500 },
			);
		}

		const url = new URL(`${API_BASE_URL}/plans`);
		url.searchParams.set("company_id", companyId);
		url.searchParams.append("product_ids[]", productId);

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			return NextResponse.json(
				{ error: `API Error: ${response.status}`, details: errorText },
				{ status: response.status },
			);
		}

		const rawData = await response.json();
		
		// Also fetch the processed plans
		const processedPlans = await fetchPlans(companyId, productId);

		return NextResponse.json({
			rawApiResponse: rawData,
			processedPlans: processedPlans,
			firstPlanRaw: rawData.data?.[0] || null,
			firstPlanProcessed: processedPlans[0] || null,
		});
	} catch (error) {
		console.error("Error in debug endpoint:", error);
		return NextResponse.json(
			{ 
				error: "Failed to debug plans",
				details: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 },
		);
	}
}
