-- Fix RLS security issues by ensuring all public tables have RLS enabled

-- Enable RLS on export_requests table (if not already enabled)
ALTER TABLE public.export_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on companies table (if not already enabled)  
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_companies table (if not already enabled)
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_logs table (if not already enabled)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on pdf_templates table (if not already enabled)
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on generated_pdfs table (if not already enabled)
ALTER TABLE public.generated_pdfs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on merged_pdfs table (if not already enabled)
ALTER TABLE public.merged_pdfs ENABLE ROW LEVEL SECURITY;