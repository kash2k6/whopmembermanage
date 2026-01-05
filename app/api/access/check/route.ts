import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopSdk } from "@/lib/whop-sdk";
import { checkUserProductAccess } from "@/lib/services/accessCheck";

export async function GET(request: NextRequest) {
	try {
		// Get userId from token
		const { userId } = await whopSdk.verifyUserToken(await headers());

		// Check access to app product
		const access = await checkUserProductAccess(userId);

		return NextResponse.json({
			hasAccess: access.hasAccess,
			accessLevel: access.accessLevel,
		});
	} catch (error) {
		console.error("Error checking access:", error);
		return NextResponse.json(
			{
				hasAccess: false,
				accessLevel: null,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
