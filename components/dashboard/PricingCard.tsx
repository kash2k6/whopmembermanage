"use client";

import { useState, useEffect } from "react";
import { useIframeSdk } from "@whop/react";
import { APP_PLAN_ID, APP_COMPANY_ID, APP_PRODUCT_ID } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface PlanDetails {
	id: string;
	title: string;
	renewal_price: number;
	initial_price: number;
	plan_type: string;
}

interface PricingCardProps {
	onPurchaseSuccess?: () => void;
}

export function PricingCard({ onPurchaseSuccess }: PricingCardProps) {
	const iframeSdk = useIframeSdk();
	const [loading, setLoading] = useState(false);
	const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [fetchingPlan, setFetchingPlan] = useState(true);

	// Fetch plan details
	useEffect(() => {
		async function fetchPlan() {
			try {
				const response = await fetch(
					`/api/plans?companyId=${APP_COMPANY_ID}&productId=${APP_PRODUCT_ID}`,
				);
				if (!response.ok) throw new Error("Failed to fetch plan");
				const data = await response.json();
				const plan = data.plans?.find(
					(p: PlanDetails) => p.id === APP_PLAN_ID,
				);
				if (plan) {
					setPlanDetails(plan);
				} else {
					// Fallback: create plan details from ID
					setPlanDetails({
						id: APP_PLAN_ID,
						title: "Premium Access",
						renewal_price: 0,
						initial_price: 0,
						plan_type: "renewal",
					});
				}
			} catch (err) {
				console.error("Error fetching plan:", err);
				// Fallback plan details
				setPlanDetails({
					id: APP_PLAN_ID,
					title: "Premium Access",
					renewal_price: 0,
					initial_price: 0,
					plan_type: "renewal",
				});
			} finally {
				setFetchingPlan(false);
			}
		}
		fetchPlan();
	}, []);

	const handlePurchase = async () => {
		if (!iframeSdk) {
			setError("Payment system not available");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Create checkout configuration
			const checkoutResponse = await fetch("/api/checkout/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					companyId: APP_COMPANY_ID,
					planId: APP_PLAN_ID,
				}),
			});

			if (!checkoutResponse.ok) {
				const errorData = await checkoutResponse.json();
				throw new Error(
					errorData.error || "Failed to create checkout configuration",
				);
			}

			const checkoutData = await checkoutResponse.json();
			const { id: checkoutConfigId, planId } = checkoutData;

			// Open in-app purchase modal
			const result = await iframeSdk.inAppPurchase({
				planId: planId || APP_PLAN_ID,
				id: checkoutConfigId,
			});

			if (result.status === "ok") {
				// Purchase successful
				if (onPurchaseSuccess) {
					onPurchaseSuccess();
				} else {
					// Refresh page after a short delay
					setTimeout(() => {
						window.location.reload();
					}, 1500);
				}
			} else {
				setError(
					result.error || "Purchase was cancelled or failed. Please try again.",
				);
			}
		} catch (err) {
			console.error("Purchase error:", err);
			setError(
				err instanceof Error
					? err.message
					: "An error occurred during purchase. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	const price =
		planDetails?.renewal_price || planDetails?.initial_price || 0;
	const priceFormatted =
		price > 0 ? `$${(price / 100).toFixed(2)}` : "Free";
	const isSubscription = planDetails?.plan_type === "renewal";

	if (fetchingPlan) {
		return (
			<div className="bg-surface rounded-lg p-8 shadow-subtle border border-border">
				<div className="flex items-center justify-center py-8">
					<Loader2 className="w-6 h-6 animate-spin text-primary" />
				</div>
			</div>
		);
	}

	return (
		<div className="bg-surface rounded-lg p-8 shadow-subtle border border-border">
			<div className="text-center">
				<h3 className="text-2xl font-semibold text-text-primary mb-2">
					{planDetails?.title || "Premium Access"}
				</h3>
				<div className="mb-6">
					<span className="text-4xl font-bold text-text-primary">
						{priceFormatted}
					</span>
					{isSubscription && (
						<span className="text-text-muted ml-2">/month</span>
					)}
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
						{error}
					</div>
				)}

				<button
					onClick={handlePurchase}
					disabled={loading}
					className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 active:bg-primary-700 transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{loading ? (
						<>
							<Loader2 className="w-5 h-5 animate-spin" />
							Processing...
						</>
					) : (
						"Subscribe Now"
					)}
				</button>

				<p className="mt-4 text-sm text-text-muted">
					Unlock full access to Member Upgrade Management
				</p>
			</div>
		</div>
	);
}
