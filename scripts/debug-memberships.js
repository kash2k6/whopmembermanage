require("dotenv").config({ path: ".env.local" });

const API_BASE_URL = "https://api.whop.com/api/v1";
const API_KEY = process.env.WHOP_API_KEY;

async function debugMemberships() {
	const companyId = process.argv[2];
	const userId = process.argv[3];
	const productId = process.argv[4];

	if (!companyId || !userId || !productId) {
		console.error("Usage: node scripts/debug-memberships.js <companyId> <userId> <productId>");
		console.error("Example: node scripts/debug-memberships.js biz_nULEeITGXYHdQ2 user_ojPhs9dIhFQ9C prod_LvXZETvMgbYbI");
		process.exit(1);
	}

	if (!API_KEY || API_KEY === "fallback") {
		console.error("WHOP_API_KEY is not set in .env.local");
		process.exit(1);
	}

	try {
		console.log("=== DEBUGGING MEMBERSHIPS ===");
		console.log("Company ID:", companyId);
		console.log("User ID:", userId);
		console.log("Product ID:", productId);
		console.log("");

		// Fetch all memberships for the user
		const url = new URL(`${API_BASE_URL}/memberships`);
		url.searchParams.set("user_id", userId);
		url.searchParams.set("company_id", companyId);
		url.searchParams.append("statuses[]", "active");
		url.searchParams.append("statuses[]", "trialing");
		url.searchParams.append("statuses[]", "past_due");

		console.log("Fetching from:", url.toString());
		console.log("");

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("API Error:", response.status, errorText);
			process.exit(1);
		}

		const data = await response.json();
		const memberships = data.data || data.memberships || (Array.isArray(data) ? data : []);

		console.log(`Found ${memberships.length} total membership(s) for user`);
		console.log("");

		// Filter by product
		const productMemberships = memberships.filter(
			(m) => m.product?.id === productId || m.product_id === productId,
		);

		console.log(`Found ${productMemberships.length} membership(s) for product ${productId}:`);
		console.log("");

		productMemberships.forEach((m, i) => {
			console.log(`Membership ${i + 1}:`);
			console.log("  ID:", m.id);
			console.log("  Status:", m.status);
			console.log("  Plan ID:", m.plan?.id || m.plan_id);
			console.log("  Product ID:", m.product?.id || m.product_id);
			console.log("  Created:", m.created_at);
			console.log("  Updated:", m.updated_at);
			console.log("  Canceled at:", m.canceled_at || "Not canceled");
			console.log("");
		});

		// Also check without status filter
		console.log("=== Checking without status filter ===");
		const urlAll = new URL(`${API_BASE_URL}/memberships`);
		urlAll.searchParams.set("user_id", userId);
		urlAll.searchParams.set("company_id", companyId);

		const responseAll = await fetch(urlAll.toString(), {
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				"Content-Type": "application/json",
			},
		});

		if (responseAll.ok) {
			const dataAll = await responseAll.json();
			const allMemberships = dataAll.data || dataAll.memberships || (Array.isArray(dataAll) ? dataAll : []);
			const productMembershipsAll = allMemberships.filter(
				(m) => m.product?.id === productId || m.product_id === productId,
			);

			console.log(`Found ${productMembershipsAll.length} membership(s) for product (all statuses):`);
			productMembershipsAll.forEach((m, i) => {
				console.log(`  ${i + 1}. ${m.id} - Status: ${m.status} - Plan: ${m.plan?.id || m.plan_id}`);
			});
		}
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

debugMemberships();
