"use client";

interface StickyFooterProps {
	onSave: () => void;
	onReset: () => void;
	saving?: boolean;
	hasChanges?: boolean;
}

export function StickyFooter({
	onSave,
	onReset,
	saving = false,
	hasChanges = false,
}: StickyFooterProps) {
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
			<div className="max-w-7xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					<p className="text-sm text-text-muted">
						Changes apply immediately to new upgrades.
					</p>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={onReset}
							disabled={saving || !hasChanges}
							className="px-4 py-2 text-sm font-medium text-text-primary hover:text-text-muted transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Reset
						</button>
						<button
							type="button"
							onClick={onSave}
							disabled={saving || !hasChanges}
							className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{saving ? "Saving..." : "Save Configuration"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
