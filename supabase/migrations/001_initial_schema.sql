-- Create upgrade_rules table
CREATE TABLE IF NOT EXISTS upgrade_rules (
	id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
	product_id TEXT NOT NULL,
	plan_id TEXT NOT NULL,
	is_upgrade BOOLEAN NOT NULL DEFAULT false,
	is_downgrade_allowed BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(product_id, plan_id)
);

-- Create product_configs table
CREATE TABLE IF NOT EXISTS product_configs (
	id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
	product_id TEXT NOT NULL UNIQUE,
	cancellation_timing TEXT NOT NULL DEFAULT 'period_end' CHECK (cancellation_timing IN ('immediate', 'period_end')),
	enabled BOOLEAN NOT NULL DEFAULT true,
	ignore_free_plans BOOLEAN NOT NULL DEFAULT false,
	treat_same_price_as_upgrade BOOLEAN NOT NULL DEFAULT false,
	allow_downgrade_to_cancel BOOLEAN NOT NULL DEFAULT true,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
	id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
	company_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	product_id TEXT NOT NULL,
	old_plan_id TEXT,
	new_plan_id TEXT NOT NULL,
	old_plan_name TEXT,
	new_plan_name TEXT NOT NULL,
	status TEXT NOT NULL CHECK (status IN ('canceled', 'skipped', 'error')),
	error_message TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_upgrade_rules_product_id ON upgrade_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_rules_plan_id ON upgrade_rules(plan_id);
CREATE INDEX IF NOT EXISTS idx_product_configs_product_id ON product_configs(product_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_upgrade_rules_updated_at BEFORE UPDATE ON upgrade_rules
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_configs_updated_at BEFORE UPDATE ON product_configs
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
