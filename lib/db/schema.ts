// Database schema types for TypeScript

export interface UpgradeRule {
	id: string;
	product_id: string;
	plan_id: string;
	is_upgrade: boolean;
	is_downgrade_allowed: boolean;
	created_at: string;
	updated_at: string;
}

export interface ProductConfig {
	id: string;
	company_id: string;
	product_id: string;
	cancellation_timing: "immediate" | "period_end";
	enabled: boolean;
	ignore_free_plans: boolean;
	treat_same_price_as_upgrade: boolean;
	allow_downgrade_to_cancel: boolean;
	created_at: string;
	updated_at: string;
}

export interface ActivityLog {
	id: string;
	company_id: string;
	user_id: string;
	product_id: string;
	old_plan_id: string | null;
	new_plan_id: string;
	old_plan_name: string | null;
	new_plan_name: string;
	status: "canceled" | "skipped" | "error";
	error_message: string | null;
	created_at: string;
}
