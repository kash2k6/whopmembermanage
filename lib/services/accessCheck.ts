import { APP_PRODUCT_ID, APP_COMPANY_ID } from "@/lib/constants";

const API_BASE_URL = "https://api.whop.com/api/v1";

function getApiKey(): string {
	const apiKey = process.env.WHOP_API_KEY;
	if (!apiKey || apiKey === "fallback") {
		throw new Error("WHOP_API_KEY is not set");
	}
	return apiKey;
}

/**
 * Check if a user has access to the app's premium product
 * Uses memberships API to check for active memberships to the specific product
 * Reference: https://docs.whop.com/api-reference/memberships/list-memberships
 */
export async function checkUserProductAccess(
	userId: string,
): Promise<{ hasAccess: boolean; accessLevel: string | null }> {
	console.log("=== CHECKING USER PRODUCT ACCESS ===");
	console.log("UserId:", userId);
	console.log("ProductId:", APP_PRODUCT_ID);
	console.log("CompanyId:", APP_COMPANY_ID);
	console.log("API Base URL:", API_BASE_URL);
	
	try {
		// Use memberships API to check for active memberships to the specific product
		// Reference: https://docs.whop.com/api-reference/memberships/list-memberships
		const url = new URL(`${API_BASE_URL}/memberships`);
		url.searchParams.set("company_id", APP_COMPANY_ID);
		url.searchParams.append("user_ids[]", userId); // API expects array format
		url.searchParams.append("product_ids[]", APP_PRODUCT_ID); // API expects array format
		url.searchParams.append("statuses[]", "active");
		url.searchParams.append("statuses[]", "trialing");

		console.log("=== API REQUEST ===");
		console.log("Full URL:", url.toString());
		console.log("Method: GET");
		console.log("Query params:", {
			company_id: APP_COMPANY_ID,
			user_ids: [userId],
			product_ids: [APP_PRODUCT_ID],
			statuses: ["active", "trialing"],
		});
		console.log("Headers:", {
			Authorization: `Bearer ${getApiKey().substring(0, 20)}...`,
			"Content-Type": "application/json",
		});

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				"Content-Type": "application/json",
			},
		});

		console.log("=== API RESPONSE ===");
		console.log("Status:", response.status);
		console.log("Status Text:", response.statusText);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("=== API ERROR ===");
			console.error("Status:", response.status);
			console.error("Error Response:", errorText);
			// If API fails, default to no access
			return {
				hasAccess: false,
				accessLevel: null,
			};
		}

		const data = await response.json();
		
		console.log("=== API RESPONSE BODY ===");
		console.log("Raw response:", JSON.stringify(data, null, 2));
		
		const memberships = data.data || [];
		console.log(`Found ${memberships.length} membership(s) for product ${APP_PRODUCT_ID}`);

		// Filter out canceled memberships
		const activeMemberships = memberships.filter((m: any) => {
			const status = m.status || "";
			const isActive = status === "active" || status === "trialing";
			const notCanceled = !m.canceled_at;
			const matchesProduct = (m.product?.id || m.product_id) === APP_PRODUCT_ID;
			return isActive && notCanceled && matchesProduct;
		});
		
		console.log(`After filtering, ${activeMemberships.length} active membership(s)`);
		if (activeMemberships.length > 0) {
			console.log("Active membership details:", activeMemberships.map((m: any) => ({
				id: m.id,
				status: m.status,
				product_id: m.product?.id || m.product_id,
				canceled_at: m.canceled_at,
			})));
		}

		// User has access if they have at least one active/trialing membership to the product
		const hasAccess = activeMemberships.length > 0;
		const accessLevel = hasAccess ? "customer" : null;

		console.log("=== FINAL RESULT ===");
		console.log("hasAccess:", hasAccess);
		console.log("accessLevel:", accessLevel);
		console.log("Active memberships count:", activeMemberships.length);
		console.log("================================");

		return {
			hasAccess,
			accessLevel,
		};
	} catch (error) {
		console.error("=== EXCEPTION CAUGHT ===");
		console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
		console.error("Error message:", error instanceof Error ? error.message : String(error));
		console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
		// Return false on error - fail closed
		return {
			hasAccess: false,
			accessLevel: null,
		};
	}
}
