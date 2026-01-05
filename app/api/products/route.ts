import { NextRequest, NextResponse } from "next/server";
import { fetchProducts } from "@/lib/whop/client";
import { fetchPlans } from "@/lib/whop/client";

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

		const products = await fetchProducts(companyId);

		// Fetch plan counts for each product
		const productsWithPlanCounts = await Promise.all(
			products.map(async (product) => {
				try {
					const plans = await fetchPlans(companyId, product.id);
					return {
						id: product.id,
						title: product.title,
						planCount: plans.length,
					};
				} catch (error) {
					console.error(`Error fetching plans for product ${product.id}:`, error);
					// Return product with 0 plan count if plans fail to fetch
					return {
						id: product.id,
						title: product.title,
						planCount: 0,
					};
				}
			}),
		);

		return NextResponse.json({ products: productsWithPlanCounts });
	} catch (error) {
		console.error("Error fetching products:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ 
				error: "Failed to fetch products",
				details: errorMessage,
			},
			{ status: 500 },
		);
	}
}
