-- Enable RLS on tables that currently have policies but no RLS enabled
-- Check which tables need RLS enabled by looking at the warnings

-- First, let's check what tables exist and their RLS status
-- We'll enable RLS on the main tables we know should have it

-- Enable RLS on export_requests table (should already be enabled, but ensuring)
ALTER TABLE export_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on companies table (should already be enabled, but ensuring)  
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table (should already be enabled, but ensuring)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_companies table (should already be enabled, but ensuring)
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on generated_pdfs table (should already be enabled, but ensuring)
ALTER TABLE generated_pdfs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on merged_pdfs table (should already be enabled, but ensuring)
ALTER TABLE merged_pdfs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_logs table (should already be enabled, but ensuring)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on pdf_templates table (should already be enabled, but ensuring)
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;