"use client";

import { useState, useEffect } from "react";

interface Plan {
	id: string;
	title: string;
	renewal_price: number;
	initial_price: number;
}

interface UpgradeRule {
	planId: string;
	isUpgrade: boolean;
}

interface DowngradeRule {
	planId: string;
	allowDowngrade: boolean;
}

interface RulesPanelsProps {
	plans: Plan[];
	existingUpgradeRules: UpgradeRule[];
	existingDowngradeRules: DowngradeRule[];
	onRulesChange: (upgradeRules: UpgradeRule[], downgradeRules: DowngradeRule[]) => void;
}

export function RulesPanels({
	plans,
	existingUpgradeRules,
	existingDowngradeRules,
	onRulesChange,
}: RulesPanelsProps) {
	const [upgradeRules, setUpgradeRules] = useState<UpgradeRule[]>(existingUpgradeRules);
	const [downgradeRules, setDowngradeRules] = useState<DowngradeRule[]>(existingDowngradeRules);

	// Initialize rules based on plan prices (default: higher price = upgrade)
	useEffect(() => {
		if (plans.length > 0 && existingUpgradeRules.length === 0 && existingDowngradeRules.length === 0) {
			const sortedPlans = [...plans].sort(
				(a, b) => (b.renewal_price || b.initial_price) - (a.renewal_price || a.initial_price),
			);
			const cheapestPrice = sortedPlans[sortedPlans.length - 1]?.renewal_price || sortedPlans[sortedPlans.length - 1]?.initial_price || 0;
			
			const newUpgradeRules: UpgradeRule[] = plans.map((plan) => {
				const price = plan.renewal_price || plan.initial_price;
				// Default: plan is an upgrade if it's more expensive than the cheapest plan
				const isUpgrade = price > cheapestPrice;
				return { planId: plan.id, isUpgrade };
			});
			setUpgradeRules(newUpgradeRules);

			const newDowngradeRules: DowngradeRule[] = plans.map((plan) => ({
				planId: plan.id,
				allowDowngrade: false, // Default: never allow downgrade
			}));
			setDowngradeRules(newDowngradeRules);
		} else if (existingUpgradeRules.length > 0 || existingDowngradeRules.length > 0) {
			// Use existing rules if provided
			setUpgradeRules(existingUpgradeRules);
			setDowngradeRules(existingDowngradeRules);
		}
	}, [plans, existingUpgradeRules, existingDowngradeRules]);

	// Notify parent of changes
	useEffect(() => {
		onRulesChange(upgradeRules, downgradeRules);
	}, [upgradeRules, downgradeRules, onRulesChange]);

	const toggleUpgradeRule = (planId: string) => {
		setUpgradeRules((prev) =>
			prev.map((rule) =>
				rule.planId === planId ? { ...rule, isUpgrade: !rule.isUpgrade } : rule,
			),
		);
	};

	const toggleDowngradeRule = (planId: string) => {
		setDowngradeRules((prev) =>
			prev.map((rule) =>
				rule.planId === planId
					? { ...rule, allowDowngrade: !rule.allowDowngrade }
					: rule,
			),
		);
	};

	const getPlanPrice = (plan: Plan): number => {
		return plan.renewal_price || plan.initial_price;
	};

	const formatPrice = (price: number): string => {
		return `$${(price / 100).toFixed(2)}/mo`;
	};

	if (plans.length === 0) {
		return (
			<div className="text-center py-12 text-text-muted">
				Select a product to configure rules
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			{/* Upgrade Rules Panel */}
			<div className="bg-surface rounded-lg p-6 shadow-subtle">
				<h2 className="text-xl font-semibold text-text-primary mb-2">
					What counts as an upgrade?
				</h2>
				<p className="text-sm text-text-muted mb-6">
					If a member purchases one of these plans, their previous plan will be
					canceled automatically.
				</p>
				<div className="space-y-3">
					{plans.map((plan) => {
						const rule = upgradeRules.find((r) => r.planId === plan.id);
						const isUpgrade = rule?.isUpgrade ?? false;
						return (
							<div
								key={plan.id}
								className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
							>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-text-primary truncate">
										{plan.title || `Plan ${plan.id.slice(-8)}`}
									</div>
									<div className="text-sm text-text-muted">
										{formatPrice(getPlanPrice(plan))}
									</div>
								</div>
								<Toggle
									checked={isUpgrade}
									onChange={() => toggleUpgradeRule(plan.id)}
									label="Higher than"
								/>
							</div>
						);
					})}
				</div>
			</div>

			{/* Downgrade Rules Panel */}
			<div className="bg-surface rounded-lg p-6 shadow-subtle">
				<h2 className="text-xl font-semibold text-text-primary mb-2">
					What counts as a downgrade?
				</h2>
				<p className="text-sm text-text-muted mb-6">
					If a member switches to a lower plan, keep the current plan active.
				</p>
				<div className="space-y-3">
					{plans.map((plan) => {
						const rule = downgradeRules.find((r) => r.planId === plan.id);
						const allowDowngrade = rule?.allowDowngrade ?? false;
						return (
							<div
								key={plan.id}
								className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
							>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-text-primary truncate">
										{plan.title || `Plan ${plan.id.slice(-8)}`}
									</div>
									<div className="text-sm text-text-muted">
										{formatPrice(getPlanPrice(plan))}
									</div>
								</div>
								<Toggle
									checked={allowDowngrade}
									onChange={() => toggleDowngradeRule(plan.id)}
									label="Allow downgrade without cancel"
								/>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function Toggle({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: () => void;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onChange}
			className="flex items-center gap-2"
			aria-label={label}
		>
			<span className="text-sm text-text-muted">{label}</span>
			<div
				className={`relative w-11 h-6 rounded-full transition-colors duration-fast ${
					checked ? "bg-primary" : "bg-gray-300"
				}`}
			>
				<div
					className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-fast ${
						checked ? "translate-x-5" : "translate-x-0"
					}`}
				/>
			</div>
		</button>
	);
}
