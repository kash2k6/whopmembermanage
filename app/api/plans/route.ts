import { NextRequest, NextResponse } from "next/server";
import { fetchPlans } from "@/lib/whop/client";
import { fetchProducts } from "@/lib/whop/client";

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

		const [plans, products] = await Promise.all([
			fetchPlans(companyId, productId),
			fetchProducts(companyId),
		]);
		
		// Get product title to enhance plan names
		const product = products.find(p => p.id === productId);
		const productTitle = product?.title || "";
		
		// Enhance plan titles with product name and price
		// Plans in Whop use internal_notes as the plan name (e.g., "Scale", "Growth", "Starter")
		// We'll combine it with the product name and price for a full display name
		const enhancedPlans = plans.map(plan => {
			const price = plan.renewal_price || plan.initial_price || 0;
			const priceFormatted = price > 0 ? `$${(price / 100).toFixed(2)}/mo` : "Free";
			
			// If title is from internal_notes (like "Scale", "Growth"), enhance it
			// Format: "Product Name - Plan Name - $X.XX/mo" or "Plan Name - $X.XX/mo"
			if (plan.title && !plan.title.includes("$") && !plan.title.includes("/mo")) {
				// Title is likely from internal_notes (e.g., "Scale", "Growth")
				if (productTitle) {
					plan.title = `${productTitle} - ${plan.title} - ${priceFormatted}`;
				} else {
					plan.title = `${plan.title} - ${priceFormatted}`;
				}
			} else if (plan.title && (plan.title.startsWith("$") || plan.title.endsWith("/mo"))) {
				// Title is just a price, enhance with product name
				if (productTitle) {
					plan.title = `${productTitle} - ${plan.title}`;
				}
			} else if (!plan.title || plan.title.startsWith("Plan ")) {
				// No title or generic, create descriptive one
				if (productTitle) {
					plan.title = `${productTitle} - ${priceFormatted}`;
				} else {
					plan.title = priceFormatted;
				}
			}
			
			return plan;
		});

		return NextResponse.json({ plans: enhancedPlans });
	} catch (error) {
		console.error("Error fetching plans:", error);
		return NextResponse.json(
			{ error: "Failed to fetch plans", details: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 },
		);
	}
}
