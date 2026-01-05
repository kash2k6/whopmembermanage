import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";

/**
 * GET /api/configs?companyId=xxx
 * Returns list of product IDs that have saved configurations
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const companyId = searchParams.get("companyId");

		if (!companyId) {
			return NextResponse.json(
				{ error: "companyId is required" },
				{ status: 400 },
			);
		}

		if (!supabaseAdmin) {
			return NextResponse.json(
				{ error: "Database not configured" },
				{ status: 500 },
			);
		}

		// Fetch all product configs for this company
		const { data: configs, error } = await supabaseAdmin
			.from("product_configs")
			.select("product_id")
			.eq("company_id", companyId);

		if (error) {
			console.error("Error fetching configs:", error);
			return NextResponse.json(
				{ error: "Failed to fetch configurations" },
				{ status: 500 },
			);
		}

		// Return array of product IDs that have configs
		const configuredProductIds = (configs || []).map((c) => c.product_id);

		return NextResponse.json({
			configuredProductIds,
		});
	} catch (error) {
		console.error("Error fetching configs:", error);
		return NextResponse.json(
			{ error: "Failed to fetch configurations" },
			{ status: 500 },
		);
	}
}
