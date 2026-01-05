"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { PricingCard } from "./PricingCard";

interface AccessWarningBannerProps {
	onPurchaseSuccess?: () => void;
}

export function AccessWarningBanner({
	onPurchaseSuccess,
}: AccessWarningBannerProps) {
	const [showPricing, setShowPricing] = useState(false);

	console.log("AccessWarningBanner rendered - showing banner");

	return (
		<>
			<div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-primary rounded-lg p-4 mb-6">
				<div className="flex items-start">
					<AlertTriangle className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
					<div className="flex-1">
						<h3 className="text-sm font-semibold text-text-primary mb-1">
							Premium Subscription Required
						</h3>
						<p className="text-sm text-text-muted mb-3">
							This app requires a premium subscription to function. Upgrade
							features and webhook processing will be disabled until you
							subscribe.
						</p>
						<button
							onClick={() => setShowPricing(true)}
							className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors duration-fast"
						>
							Subscribe Now
						</button>
					</div>
				</div>
			</div>

			{showPricing && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
					<div className="bg-surface rounded-lg shadow-subtle border border-border max-w-md w-full relative pointer-events-auto">
						<button
							onClick={() => setShowPricing(false)}
							className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary transition-colors duration-fast"
							aria-label="Close"
						>
							<X className="w-5 h-5" />
						</button>

						<div className="p-6">
							<div className="text-center mb-6">
								<h2 className="text-2xl font-semibold text-text-primary mb-2">
									Subscribe to Premium
								</h2>
								<p className="text-text-muted">
									Get full access to Member Upgrade Management features.
								</p>
							</div>

							<PricingCard onPurchaseSuccess={onPurchaseSuccess} />
						</div>
					</div>
				</div>
			)}
		</>
	);
}
