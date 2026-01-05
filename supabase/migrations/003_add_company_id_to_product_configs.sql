-- Add company_id to product_configs table
-- First, add the column as nullable
ALTER TABLE product_configs
ADD COLUMN IF NOT EXISTS company_id TEXT;

-- Drop the old unique constraint on product_id only (if it exists)
ALTER TABLE product_configs
DROP CONSTRAINT IF EXISTS product_configs_product_id_key;

-- Delete any existing rows without company_id (they're invalid)
-- This is safe because we're just starting out
DELETE FROM product_configs WHERE company_id IS NULL;

-- Now make company_id NOT NULL
ALTER TABLE product_configs
ALTER COLUMN company_id SET NOT NULL;

-- Add unique constraint on (company_id, product_id) so each company can have configs per product
-- This allows one config per product per company
ALTER TABLE product_configs
DROP CONSTRAINT IF EXISTS product_configs_company_product_unique;
ALTER TABLE product_configs
ADD CONSTRAINT product_configs_company_product_unique UNIQUE (company_id, product_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_configs_company_id ON product_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_product_configs_company_product ON product_configs(company_id, product_id);
