"use client";

interface HeroSectionProps {
	hasRules: boolean;
}

export function HeroSection({ hasRules }: HeroSectionProps) {
	return (
		<div className="w-full bg-surface rounded-lg p-8 shadow-subtle">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h1 className="text-3xl font-bold text-text-primary mb-3">
						Automatic Membership{" "}
						<span className="relative">
							<span className="relative z-10">Upgrade</span>
							<span className="absolute bottom-0 left-0 right-0 h-2 bg-primary-300 opacity-40 -z-0" />
						</span>{" "}
						Protection
					</h1>
					<p className="text-base text-text-muted leading-relaxed">
						Prevent double-charging when members upgrade plans.
						<br />
						When a higher plan is purchased, the lower plan is automatically
						canceled.
					</p>
				</div>
				<div className="ml-6">
					<StatusBadge active={hasRules} />
				</div>
			</div>
		</div>
	);
}

function StatusBadge({ active }: { active: boolean }) {
	return (
		<div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border border-border">
			<div
				className={`w-2 h-2 rounded-full ${
					active ? "bg-green-500" : "bg-gray-400"
				}`}
			/>
			<span className="text-sm font-medium text-text-primary">
				{active ? "Active & Monitoring" : "Setup Required"}
			</span>
		</div>
	);
}
