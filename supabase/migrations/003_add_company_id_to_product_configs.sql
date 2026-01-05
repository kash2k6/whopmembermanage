-- Add company_id to product_configs table
ALTER TABLE product_configs
ADD COLUMN IF NOT EXISTS company_id TEXT;

-- Update existing rows (if any) - you may need to set this manually for existing data
-- For now, we'll allow NULL temporarily, but new inserts should always include company_id

-- Drop the old unique constraint on product_id only
ALTER TABLE product_configs
DROP CONSTRAINT IF EXISTS product_configs_product_id_key;

-- Add unique constraint on (company_id, product_id) so each company can have configs per product
ALTER TABLE product_configs
ADD CONSTRAINT product_configs_company_product_unique UNIQUE (company_id, product_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_configs_company_id ON product_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_product_configs_company_product ON product_configs(company_id, product_id);
