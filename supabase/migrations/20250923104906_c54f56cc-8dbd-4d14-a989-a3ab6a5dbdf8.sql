-- Fix the merged_pdf_url field size constraint that's causing silent failures
ALTER TABLE export_requests 
ALTER COLUMN merged_pdf_url TYPE TEXT;

-- Also ensure generated_pdf_url field can handle larger URLs if needed
ALTER TABLE export_requests 
ALTER COLUMN generated_pdf_url TYPE TEXT;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_export_requests_status ON export_requests(status);

-- Add index for better performance on company queries
CREATE INDEX IF NOT EXISTS idx_export_requests_company_id ON export_requests(company_id);