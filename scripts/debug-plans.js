/**
 * Debug script to inspect Whop API plan response structure
 * Run with: node scripts/debug-plans.js
 */

// Load environment variables from .env.local
const { readFileSync } = require('fs');
const { join } = require('path');

try {
	const envPath = join(__dirname, '..', '.env.local');
	const envFile = readFileSync(envPath, 'utf-8');
	envFile.split('\n').forEach(line => {
		const trimmed = line.trim();
		if (trimmed && !trimmed.startsWith('#')) {
			const [key, ...valueParts] = trimmed.split('=');
			if (key && valueParts.length > 0) {
				const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
				if (!process.env[key.trim()]) {
					process.env[key.trim()] = value;
				}
			}
		}
	});
} catch (error) {
	// .env.local might not exist, that's okay
	console.log("Note: Could not load .env.local, using environment variables");
}

const API_BASE_URL = "https://api.whop.com/api/v1";

async function debugPlans() {
	const apiKey = process.env.WHOP_API_KEY;
	const companyId = process.argv[2] || process.env.WHOP_COMPANY_ID;
	const productId = process.argv[3] || process.env.WHOP_PRODUCT_ID;

	if (!apiKey || !companyId || !productId) {
		console.error("Usage: WHOP_API_KEY=xxx WHOP_COMPANY_ID=xxx WHOP_PRODUCT_ID=xxx node scripts/debug-plans.js");
		console.error("Or: node scripts/debug-plans.js <companyId> <productId>");
		process.exit(1);
	}

	try {
		const url = new URL(`${API_BASE_URL}/plans`);
		url.searchParams.set("company_id", companyId);
		url.searchParams.append("product_ids[]", productId);

		console.log(`Fetching plans from: ${url.toString()}`);

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Error: ${response.status} ${errorText}`);
			process.exit(1);
		}

		const data = await response.json();
		console.log("\n=== Full API Response ===");
		console.log(JSON.stringify(data, null, 2));

		if (data.data && data.data.length > 0) {
			console.log("\n=== First Plan Structure ===");
			console.log(JSON.stringify(data.data[0], null, 2));

			console.log("\n=== Plan Fields ===");
			const firstPlan = data.data[0];
			console.log("ID:", firstPlan.id);
			console.log("Title:", firstPlan.title);
			console.log("Name:", firstPlan.name);
			console.log("Description:", firstPlan.description);
			console.log("Initial Price:", firstPlan.initial_price);
			console.log("Renewal Price:", firstPlan.renewal_price);
			console.log("Product ID:", firstPlan.product_id);
			console.log("Access Pass ID:", firstPlan.access_pass_id);
			console.log("Plan Type:", firstPlan.plan_type);
			console.log("Access Pass Object:", firstPlan.access_pass);
		}
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

debugPlans();
