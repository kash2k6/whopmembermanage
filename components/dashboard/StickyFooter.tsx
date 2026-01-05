"use client";

interface StickyFooterProps {
	onSave: () => void;
	onReset: () => void;
	saving?: boolean;
	hasChanges?: boolean;
	saveSuccess?: boolean;
}

export function StickyFooter({
	onSave,
	onReset,
	saving = false,
	hasChanges = false,
	saveSuccess = false,
}: StickyFooterProps) {
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 pointer-events-auto">
			<div className="max-w-7xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					{saveSuccess ? (
						<div className="flex items-center gap-2 text-sm text-green-600 font-medium">
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
							Configuration saved successfully
						</div>
					) : (
						<p className="text-sm text-text-muted">
							Changes apply immediately to new upgrades.
						</p>
					)}
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={onReset}
							disabled={saving || !hasChanges}
							className="px-4 py-2 text-sm font-medium text-text-primary hover:text-text-muted transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
						>
							Reset
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								console.log("Button clicked, calling onSave");
								onSave();
							}}
							disabled={saving}
							className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 active:bg-primary-700 transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto cursor-pointer"
						>
							{saving ? "Saving..." : "Save Configuration"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
