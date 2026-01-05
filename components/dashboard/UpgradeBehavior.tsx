"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Plan {
	id: string;
	title: string;
	renewal_price: number;
	initial_price: number;
}

interface UpgradeBehaviorProps {
	plans: Plan[];
	enabled: boolean;
	advancedRules: {
		ignoreFreePlans: boolean;
		treatSamePriceAsUpgrade: boolean;
		allowDowngradeToCancel: boolean;
	};
	onChange: (enabled: boolean, advancedRules: {
		ignoreFreePlans: boolean;
		treatSamePriceAsUpgrade: boolean;
		allowDowngradeToCancel: boolean;
	}) => void;
}

export function UpgradeBehavior({
	plans,
	enabled: initialEnabled,
	advancedRules: initialAdvancedRules,
	onChange,
}: UpgradeBehaviorProps) {
	const [enabled, setEnabled] = useState(initialEnabled);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [advancedRules, setAdvancedRules] = useState({
		...initialAdvancedRules,
		// Default allowDowngradeToCancel to true if not set
		allowDowngradeToCancel: initialAdvancedRules.allowDowngradeToCancel ?? true,
	});

	// Update state when props change (when config is loaded)
	useEffect(() => {
		console.log("UpgradeBehavior: Props changed, updating state", {
			initialEnabled,
			initialAdvancedRules,
		});
		setEnabled(initialEnabled);
		setAdvancedRules({
			...initialAdvancedRules,
			allowDowngradeToCancel: initialAdvancedRules.allowDowngradeToCancel ?? true,
		});
	}, [initialEnabled, initialAdvancedRules]);

	const handleToggle = (newEnabled: boolean) => {
		setEnabled(newEnabled);
		onChange(newEnabled, advancedRules);
	};

	const handleAdvancedChange = (key: keyof typeof advancedRules, value: boolean) => {
		const newAdvanced = { ...advancedRules, [key]: value };
		setAdvancedRules(newAdvanced);
		onChange(enabled, newAdvanced);
	};

	if (plans.length === 0) {
		return (
			<div className="text-center py-12 text-text-muted">
				Select a product to configure upgrade behavior
			</div>
		);
	}

	return (
		<div className="bg-surface rounded-lg p-6 shadow-subtle">
			<div className="space-y-6">
				{/* Main Toggle */}
				<div className="space-y-3">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<h2 className="text-xl font-semibold text-text-primary mb-2">
								Upgrade Behavior
							</h2>
							<p className="text-sm text-text-muted leading-relaxed">
								If a member buys a more expensive plan than the one they currently have,
								automatically cancel the old plan.
							</p>
						</div>
					</div>

					<div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
						<div className="flex-1">
							<div className="font-medium text-text-primary mb-1">
								Automatically cancel lower-priced plans on upgrade
							</div>
							<div className="text-sm text-text-muted">
								When a member buys a more expensive plan, their old plan is canceled automatically.
								Downgrades (lower-priced plans) never cancel the old plan.
							</div>
						</div>
						<MainToggle checked={enabled} onChange={handleToggle} />
					</div>
				</div>

				{/* Plans Preview */}
				{enabled && (
					<div className="pt-4 border-t border-border">
						<div className="text-sm font-medium text-text-primary mb-3">
							Plans in this product ({plans.length})
						</div>
						<div className="space-y-2">
							{plans
								.sort((a, b) => {
									const priceA = a.renewal_price || a.initial_price || 0;
									const priceB = b.renewal_price || b.initial_price || 0;
									return priceB - priceA;
								})
								.map((plan) => {
									const price = plan.renewal_price || plan.initial_price || 0;
									const priceFormatted = price > 0 ? `$${(price / 100).toFixed(2)}/mo` : "Free";
									return (
										<div
											key={plan.id}
											className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
										>
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-text-primary truncate">
													{plan.title}
												</div>
											</div>
											<div className="text-sm text-text-muted ml-4">
												{priceFormatted}
											</div>
										</div>
									);
								})}
						</div>
					</div>
				)}

				{/* Advanced Rules Accordion */}
				<div className="pt-4 border-t border-border">
					<button
						type="button"
						onClick={() => setShowAdvanced(!showAdvanced)}
						className="flex items-center justify-between w-full text-left"
					>
						<span className="text-sm font-medium text-text-primary">
							Advanced rules
						</span>
						{showAdvanced ? (
							<ChevronUp className="w-4 h-4 text-text-muted" />
						) : (
							<ChevronDown className="w-4 h-4 text-text-muted" />
						)}
					</button>

					{showAdvanced && (
						<div className="mt-4 space-y-4">
							<div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
								<div className="flex-1">
									<div className="font-medium text-text-primary mb-1">
										Ignore free plans
									</div>
									<div className="text-sm text-text-muted">
										Don't cancel free plans when members upgrade to paid plans.
									</div>
								</div>
								<SimpleToggle
									checked={advancedRules.ignoreFreePlans}
									onChange={(checked) => handleAdvancedChange("ignoreFreePlans", checked)}
								/>
							</div>

							<div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
								<div className="flex-1">
									<div className="font-medium text-text-primary mb-1">
										Treat same-price plans as upgrades
									</div>
									<div className="text-sm text-text-muted">
										Cancel the old plan even if the new plan has the same price.
									</div>
								</div>
								<SimpleToggle
									checked={advancedRules.treatSamePriceAsUpgrade}
									onChange={(checked) => handleAdvancedChange("treatSamePriceAsUpgrade", checked)}
								/>
							</div>

							<div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
								<div className="flex-1">
									<div className="font-medium text-text-primary mb-1">
										Cancel old plan on downgrade
									</div>
									<div className="text-sm text-text-muted">
										When members switch to a lower-priced plan, cancel their old (higher-priced) plan to prevent double-charging.
									</div>
								</div>
								<SimpleToggle
									checked={advancedRules.allowDowngradeToCancel}
									onChange={(checked) => handleAdvancedChange("allowDowngradeToCancel", checked)}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function MainToggle({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(!checked)}
			className="relative w-14 h-7 rounded-full transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 pointer-events-auto cursor-pointer"
			aria-label={checked ? "Disable" : "Enable"}
		>
			<div
				className={`absolute inset-0 rounded-full transition-colors duration-fast pointer-events-none ${
					checked ? "bg-primary" : "bg-gray-300"
				}`}
			/>
			<div
				className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-fast pointer-events-none ${
					checked ? "translate-x-7" : "translate-x-0"
				}`}
			/>
		</button>
	);
}

function SimpleToggle({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(!checked)}
			className="relative w-11 h-6 rounded-full transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 pointer-events-auto cursor-pointer z-10"
			aria-label={checked ? "Disable" : "Enable"}
		>
			<div
				className={`absolute inset-0 rounded-full transition-colors duration-fast pointer-events-none ${
					checked ? "bg-primary" : "bg-gray-300"
				}`}
			/>
			<div
				className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-fast pointer-events-none ${
					checked ? "translate-x-5" : "translate-x-0"
				}`}
			/>
		</button>
	);
}
