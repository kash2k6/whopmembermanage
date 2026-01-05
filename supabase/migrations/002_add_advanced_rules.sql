-- Add advanced rules columns to product_configs table
ALTER TABLE product_configs
ADD COLUMN IF NOT EXISTS ignore_free_plans BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS treat_same_price_as_upgrade BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_downgrade_to_cancel BOOLEAN NOT NULL DEFAULT true;
