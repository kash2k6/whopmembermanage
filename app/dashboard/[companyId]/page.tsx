import { headers } from "next/headers";
import { whopSdk } from "@/lib/whop-sdk";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

	// Verify user access
	try {
		const { userId } = await whopSdk.verifyUserToken(await headers());
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

	return <DashboardClient companyId={companyId} />;
}
