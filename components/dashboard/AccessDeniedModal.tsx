"use client";

import { PricingCard } from "./PricingCard";
import { X } from "lucide-react";

interface AccessDeniedModalProps {
	onClose?: () => void;
	onPurchaseSuccess?: () => void;
}

export function AccessDeniedModal({
	onClose,
	onPurchaseSuccess,
}: AccessDeniedModalProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
			<div className="bg-surface rounded-lg shadow-subtle border border-border max-w-md w-full relative pointer-events-auto">
				{onClose && (
					<button
						onClick={onClose}
						className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary transition-colors duration-fast"
						aria-label="Close"
					>
						<X className="w-5 h-5" />
					</button>
				)}

				<div className="p-6">
					<div className="text-center mb-6">
						<h2 className="text-2xl font-semibold text-text-primary mb-2">
							Access Required
						</h2>
						<p className="text-text-muted">
							You need a premium subscription to use Member Upgrade
							Management. Subscribe below to get started.
						</p>
					</div>

					<PricingCard onPurchaseSuccess={onPurchaseSuccess} />
				</div>
			</div>
		</div>
	);
}
