-- Update companies table structure to match requirements
ALTER TABLE public.companies 
DROP COLUMN IF EXISTS address_english,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS license_number,
DROP COLUMN IF EXISTS business_type;

-- Add zip_code field and phone_type
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS phone_type VARCHAR(20) DEFAULT 'company';

-- Update constraints
ALTER TABLE public.companies 
ALTER COLUMN address_japanese SET NOT NULL,
ALTER COLUMN name_kanji SET NOT NULL;