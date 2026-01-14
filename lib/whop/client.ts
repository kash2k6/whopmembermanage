const API_BASE_URL = "https://api.whop.com/api/v1";

function getApiKey(): string {
	const apiKey = process.env.WHOP_API_KEY;
	if (!apiKey) {
		throw new Error("WHOP_API_KEY is not set");
	}
	return apiKey;
}

export interface WhopProduct {
	id: string;
	title: string;
	company_id: string;
}

export interface WhopPlan {
	id: string;
	title: string;
	product_id: string;
	initial_price: number;
	renewal_price: number;
	plan_type: "renewal" | "one-time";
}

export interface WhopMembership {
	id: string;
	user_id: string;
	product_id: string;
	plan_id: string;
	status: string;
}

/**
 * Fetch all products for a company using v1 REST API
 */
export async function fetchProducts(companyId: string): Promise<WhopProduct[]> {
	const products: WhopProduct[] = [];
	let after: string | null = null;
	
	try {
		// Check API key first
		const apiKey = getApiKey();
		if (!apiKey || apiKey === "fallback") {
			throw new Error("WHOP_API_KEY is not properly configured. Please set it in your environment variables.");
		}
		
		do {
			const url = new URL(`${API_BASE_URL}/products`);
			url.searchParams.set("company_id", companyId);
			// Filter to only include regular products - exclude app, experience_upsell, api_only
			// Per Whop API docs: https://docs.whop.com/api-reference/products/list-products
			url.searchParams.append("product_types[]", "regular");
			if (after) {
				url.searchParams.set("after", after);
			}
			
			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				let errorMessage = `Failed to fetch products: ${response.status}`;
				try {
					const errorJson = JSON.parse(errorText);
					errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
				} catch {
					errorMessage += ` - ${errorText}`;
				}
				throw new Error(errorMessage);
			}
			
			const data = await response.json();
			// Handle different response formats
			const items = data.data || data.products || (Array.isArray(data) ? data : []);
			products.push(...items);
			
			// Check for pagination
			const pageInfo = data.page_info || data.pagination;
			after = pageInfo?.end_cursor || pageInfo?.next_cursor || null;
			
			// Break if no more pages
			if (!pageInfo?.has_next_page && !after) {
				break;
			}
		} while (after);
	} catch (error) {
		console.error("Error fetching products:", error);
		throw error;
	}
	
	return products;
}

/**
 * Fetch all plans for a product using v1 REST API
 */
export async function fetchPlans(
	companyId: string,
	productId: string,
): Promise<WhopPlan[]> {
	const plans: WhopPlan[] = [];
	let after: string | null = null;
	
	try {
		do {
			const url = new URL(`${API_BASE_URL}/plans`);
			url.searchParams.set("company_id", companyId);
			url.searchParams.append("product_ids[]", productId);
			if (after) {
				url.searchParams.set("after", after);
			}
			
			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${getApiKey()}`,
					"Content-Type": "application/json",
				},
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to fetch plans: ${response.status} ${errorText}`);
			}
			
			const data = await response.json();
			const items = data.data || (Array.isArray(data) ? data : []);
			
			// Map API response to our interface
			const mappedPlans: WhopPlan[] = items.map((plan: any) => {
				// Plans in Whop API have:
				// - title: null (plans don't have titles)
				// - product.title: "Ai Voice Agent Support" (product name)
				// - internal_notes: "Scale", "Growth", "Starter" (plan tier/name)
				// - renewal_price: 149.95 (in dollars, not cents!)
				// - product.id: product ID
				
				// Use internal_notes as plan name if available (e.g., "Scale", "Growth", "Starter")
				let title = plan.internal_notes || 
					plan.title || 
					plan.name || 
					plan.description ||
					null;
				
				// Get prices - Whop API returns prices in DOLLARS (not cents!)
				// Example: renewal_price: 149.95 means $149.95
				let initialPrice = plan.initial_price ?? plan.initialPrice ?? 0;
				let renewalPrice = plan.renewal_price ?? plan.renewalPrice ?? 0;
				
				// Convert to cents (multiply by 100)
				initialPrice = Math.round(Number(initialPrice) * 100) || 0;
				renewalPrice = Math.round(Number(renewalPrice) * 100) || 0;
				
				// Get product ID from nested product object
				const productId = plan.product?.id || plan.product_id || plan.access_pass_id || "";
				
				// If no title from internal_notes, create one from price
				// This will be enhanced later with product name in the API route
				if (!title) {
					const displayPrice = renewalPrice || initialPrice;
					const priceFormatted = displayPrice > 0 ? `$${(displayPrice / 100).toFixed(2)}` : "Free";
					title = `${priceFormatted}/mo`;
				}
				
				return {
					id: plan.id || "",
					title: title,
					product_id: productId,
					initial_price: initialPrice,
					renewal_price: renewalPrice,
					plan_type: (plan.plan_type || plan.type || plan.planType || "renewal") as "renewal" | "one-time",
				};
			});
			
			plans.push(...mappedPlans);
			
			// Check for pagination
			const pageInfo = data.page_info || data.pagination;
			after = pageInfo?.end_cursor || pageInfo?.next_cursor || null;
			
			// Break if no more pages
			if (!pageInfo?.has_next_page && !after) {
				break;
			}
		} while (after);
	} catch (error) {
		console.error("Error fetching plans:", error);
		throw error;
	}
	
	return plans;
}

/**
 * Fetch a single plan by ID using v1 REST API
 */
export async function fetchPlan(
	companyId: string,
	planId: string,
): Promise<WhopPlan | null> {
	try {
		const url = `${API_BASE_URL}/plans/${planId}`;
		
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				"Content-Type": "application/json",
			},
		});
		
		if (!response.ok) {
			console.error(`Failed to fetch plan: ${response.status}`);
			return null;
		}
		
		const plan = await response.json();
		
		// Extract plan name from internal_notes (same logic as fetchPlans)
		const planName = plan.internal_notes || plan.title || plan.name || null;
		
		// Get prices - Whop API returns prices in dollars (e.g., 149.95)
		let initialPrice = (plan.initial_price ?? plan.initialPrice ?? 0);
		let renewalPrice = (plan.renewal_price ?? plan.renewalPrice ?? 0);
		
		// Convert to cents (integer)
		initialPrice = Math.round(Number(initialPrice) * 100) || 0;
		renewalPrice = Math.round(Number(renewalPrice) * 100) || 0;
		
		// Format price for display
		const price = renewalPrice || initialPrice;
		const priceFormatted = price > 0 ? `$${(price / 100).toFixed(2)}/mo` : "Free";
		
		// Get product title from nested product object
		const productTitle = plan.product?.title || "";
		
		// Build title using same enhancement logic as plans API route
		let title: string;
		if (planName && !planName.includes("$") && !planName.includes("/mo")) {
			// Title is from internal_notes (e.g., "Scale", "Growth")
			if (productTitle) {
				title = `${productTitle} - ${planName} - ${priceFormatted}`;
			} else {
				title = `${planName} - ${priceFormatted}`;
			}
		} else if (planName && (planName.startsWith("$") || planName.endsWith("/mo"))) {
			// Title is just a price, enhance with product name
			if (productTitle) {
				title = `${productTitle} - ${planName}`;
			} else {
				title = planName;
			}
		} else if (!planName || planName.startsWith("Plan ")) {
			// No title or generic, create descriptive one
			if (productTitle) {
				title = `${productTitle} - ${priceFormatted}`;
			} else {
				title = priceFormatted;
			}
		} else {
			title = planName;
		}
		
		console.log(`Fetched plan ${planId}:`, {
			title,
			initialPrice,
			renewalPrice,
			type: plan.plan_type || plan.type,
			planName,
			productTitle,
		});
		
		return {
			id: plan.id || planId,
			title: title,
			product_id: plan.product?.id || plan.product_id || "",
			initial_price: initialPrice,
			renewal_price: renewalPrice,
			plan_type: (plan.plan_type || plan.type || "renewal") as "renewal" | "one-time",
		};
	} catch (error) {
		console.error("Error fetching plan:", error);
		return null;
	}
}

/**
 * Fetch active memberships for a user and product using v1 REST API
 */
export async function fetchActiveMemberships(
	companyId: string,
	userId: string,
	productId: string,
): Promise<WhopMembership[]> {
	const memberships: WhopMembership[] = [];
	let after: string | null = null;
	
	try {
		do {
			const url = new URL(`${API_BASE_URL}/memberships`);
			url.searchParams.set("company_id", companyId);
			url.searchParams.set("user_id", userId); // Use singular user_id, not array
			url.searchParams.set("product_id", productId); // Use singular product_id, not array
			// Include both active and trialing memberships
			// Trialing memberships are still active and should be considered
			url.searchParams.append("statuses[]", "active");
			url.searchParams.append("statuses[]", "trialing");
			if (after) {
				url.searchParams.set("after", after);
			}
			
			console.log("Fetching memberships from:", url.toString());
			
			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${getApiKey()}`,
					"Content-Type": "application/json",
				},
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to fetch memberships: ${response.status} ${errorText}`);
			}
			
			const data = await response.json();
			const items = data.data || data.memberships || (Array.isArray(data) ? data : []);
			console.log(`Fetched ${items.length} membership(s) from API (page)`);
			
			// Map API response to our interface
			const mappedMemberships: WhopMembership[] = items.map((membership: any) => {
				// Extract plan_id from nested plan object or direct property
				const planId = membership.plan?.id || membership.plan_id || "";
				const productId = membership.product?.id || membership.product_id || "";
				const userId = membership.user?.id || membership.user_id || "";
				
				return {
					id: membership.id || "",
					user_id: userId,
					product_id: productId,
					plan_id: planId,
					status: membership.status || "unknown",
				};
			});
			
			console.log("Mapped memberships:", mappedMemberships.map(m => ({ id: m.id, planId: m.plan_id, status: m.status })));
			memberships.push(...mappedMemberships);
			
			after = data.page_info?.end_cursor || null;
		} while (after);
	} catch (error) {
		console.error("Error fetching memberships:", error);
		throw error;
	}
	
	return memberships;
}

/**
 * Cancel a membership using v1 REST API
 */
export async function cancelMembership(
	companyId: string,
	membershipId: string,
	immediate = false,
): Promise<boolean> {
	try {
		const url = new URL(`${API_BASE_URL}/memberships/${membershipId}/cancel`);
		if (immediate) {
			url.searchParams.set("immediate", "true");
		}
		
		const response = await fetch(url.toString(), {
			method: "POST",
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				"Content-Type": "application/json",
			},
		});
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Failed to cancel membership: ${response.status} ${errorText}`);
			return false;
		}
		
		return true;
	} catch (error) {
		console.error("Error canceling membership:", error);
		return false;
	}
}
