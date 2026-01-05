import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";

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
			// Return empty array if database is not configured (graceful degradation)
			return NextResponse.json({ activities: [] });
		}

		const { data: activities, error } = await supabaseAdmin
			.from("activity_logs")
			.select("*")
			.eq("company_id", companyId)
			.order("created_at", { ascending: false })
			.limit(5);

		if (error) {
			console.error("Error fetching activities:", error);
			// Return empty array on error (graceful degradation)
			return NextResponse.json({ activities: [] });
		}

		return NextResponse.json({ activities: activities || [] });
	} catch (error) {
		console.error("Error fetching activities:", error);
		return NextResponse.json(
			{ error: "Failed to fetch activities" },
			{ status: 500 },
		);
	}
}
