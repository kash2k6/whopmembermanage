"use client";

interface ActivityLog {
	id: string;
	user_id: string;
	old_plan_name: string | null;
	new_plan_name: string;
	status: string;
	created_at: string;
}

interface ActivityPreviewProps {
	activities: ActivityLog[];
	loading?: boolean;
}

export function ActivityPreview({ activities, loading = false }: ActivityPreviewProps) {
	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const shortenUserId = (userId: string): string => {
		return `${userId.slice(0, 8)}...`;
	};

	if (loading) {
		return (
			<div className="bg-surface rounded-lg p-6 shadow-subtle">
				<h2 className="text-xl font-semibold text-text-primary mb-4">
					Recent Upgrade Actions
				</h2>
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-16 bg-background rounded-lg animate-pulse" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="bg-surface rounded-lg p-6 shadow-subtle pointer-events-auto">
			<h2 className="text-xl font-semibold text-text-primary mb-4">
				Recent Upgrade Actions
			</h2>
			{activities.length === 0 ? (
				<div className="text-center py-8 text-text-muted">
					No upgrade actions yet. Actions will appear here when members upgrade.
				</div>
			) : (
				<div className="space-y-3">
					{activities.slice(0, 5).map((activity) => (
						<div
							key={activity.id}
							className="flex items-center justify-between p-4 bg-background rounded-lg border border-border pointer-events-auto"
						>
							<div className="flex-1">
								<div className="text-sm font-medium text-text-primary">
									{shortenUserId(activity.user_id)}
								</div>
								<div className="text-sm text-text-muted">
									{activity.old_plan_name || "No previous plan"} →{" "}
									{activity.new_plan_name || "New plan"}
								</div>
							</div>
							<div className="text-right">
								<div className="text-xs font-medium text-green-600 mb-1">
									Canceled automatically
								</div>
								<div className="text-xs text-text-muted">
									{formatDate(activity.created_at)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
