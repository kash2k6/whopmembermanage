import { headers } from "next/headers";
import { whopSdk } from "@/lib/whop-sdk";
import { DashboardClient } from "./dashboard-client";
import { checkUserProductAccess } from "@/lib/services/accessCheck";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

	// Verify user access
	try {
		const { userId } = await whopSdk.verifyUserToken(await headers());
		
		// Check company admin access
		const { accessLevel } = await whopSdk.access.checkIfUserHasAccessToCompany({
			companyId,
			userId,
		});

		if (accessLevel !== "admin") {
			return (
				<div className="flex items-center justify-center h-96">
					<div className="text-center">
						<h3 className="text-lg font-medium mb-2 text-text-primary">
							Access Restricted
						</h3>
						<p className="text-text-muted">
							You must be an admin to access this dashboard.
						</p>
					</div>
				</div>
			);
		}

		// Check product access (app premium product)
		console.log("Checking product access for userId:", userId);
		let productAccess;
		try {
			productAccess = await checkUserProductAccess(userId);
			console.log("Product access result:", productAccess);
			console.log("Will pass hasAppAccess:", productAccess?.hasAccess === true);
		} catch (error) {
			console.error("Failed to check product access:", error);
			// Default to no access if check fails
			productAccess = { hasAccess: false, accessLevel: null };
		}
		
		// Pass access status to client component
		// Explicitly check for true - default to false
		const hasAppAccess = productAccess?.hasAccess === true;
		console.log("Final hasAppAccess value being passed:", hasAppAccess);
		
		return (
			<DashboardClient
				companyId={companyId}
				hasAppAccess={hasAppAccess}
			/>
		);
	} catch (error) {
		return (
			<div className="flex items-center justify-center h-96">
				<div className="text-center">
					<h3 className="text-lg font-medium mb-2 text-text-primary">
						Authentication Error
					</h3>
					<p className="text-text-muted">
						Unable to verify your access. Please try again.
					</p>
				</div>
			</div>
		);
	}
}
