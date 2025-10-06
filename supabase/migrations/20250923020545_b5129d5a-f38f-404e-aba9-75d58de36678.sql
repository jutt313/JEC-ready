-- JEC Platform Complete Database Schema

-- 1. Users Table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'company_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Companies Table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_english VARCHAR(255) NOT NULL,
  name_katakana VARCHAR(255) NOT NULL,
  name_kanji VARCHAR(255) NOT NULL,
  address_japanese TEXT,
  address_english TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  license_number VARCHAR(100),
  business_type VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. User Company Relations Table
CREATE TABLE public.user_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- 4. Export Requests Table
CREATE TABLE public.export_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  company_id UUID REFERENCES public.companies(id),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Vehicle Information
  plate_number VARCHAR(50),
  vin VARCHAR(50),
  chassis_number VARCHAR(50),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  vehicle_color VARCHAR(50),
  engine_number VARCHAR(100),
  
  -- Owner Information
  owner_name_japanese VARCHAR(255),
  owner_name_english VARCHAR(255),
  owner_address_japanese TEXT,
  owner_address_english TEXT,
  owner_phone VARCHAR(50),
  
  -- Processing Data
  ocr_raw_text TEXT,
  ai_extracted_data JSONB,
  processing_errors JSONB,
  
  -- File Storage
  original_image_url VARCHAR(500),
  generated_pdf_url VARCHAR(500),
  merged_pdf_url VARCHAR(500),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. PDF Templates Table
CREATE TABLE public.pdf_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('export_form_1', 'export_form_2', 'export_form_3')),
  file_path VARCHAR(500) NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  field_mapping JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Generated PDFs Table
CREATE TABLE public.generated_pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  export_request_id UUID REFERENCES public.export_requests(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.pdf_templates(id),
  template_type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  generation_status VARCHAR(50) DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Merged PDFs Table
CREATE TABLE public.merged_pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  export_request_id UUID REFERENCES public.export_requests(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  template_ids UUID[] NOT NULL,
  merge_status VARCHAR(50) DEFAULT 'pending' CHECK (merge_status IN ('pending', 'merging', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Audit Logs Table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merged_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- RLS Policies for Companies
CREATE POLICY "Users can view companies they belong to" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE u.auth_user_id = auth.uid()
      AND uc.company_id = companies.id
      AND uc.is_active = true
    )
  );

CREATE POLICY "Company owners can update their companies" ON public.companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE u.auth_user_id = auth.uid()
      AND uc.company_id = companies.id
      AND uc.role IN ('owner', 'admin')
      AND uc.is_active = true
    )
  );

CREATE POLICY "Authenticated users can create companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for User Companies
CREATE POLICY "Users can view their company relationships" ON public.user_companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.id = user_companies.user_id
    )
  );

-- RLS Policies for Export Requests
CREATE POLICY "Users can view export requests from their companies" ON public.export_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE u.auth_user_id = auth.uid()
      AND uc.company_id = export_requests.company_id
      AND uc.is_active = true
    )
  );

CREATE POLICY "Users can create export requests for their companies" ON public.export_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE u.auth_user_id = auth.uid()
      AND uc.company_id = export_requests.company_id
      AND uc.is_active = true
    )
  );

CREATE POLICY "Users can update export requests from their companies" ON public.export_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE u.auth_user_id = auth.uid()
      AND uc.company_id = export_requests.company_id
      AND uc.is_active = true
    )
  );

-- RLS Policies for PDF Templates (public read, admin write)
CREATE POLICY "Anyone can view active PDF templates" ON public.pdf_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage PDF templates" ON public.pdf_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- RLS Policies for Generated PDFs
CREATE POLICY "Users can view PDFs from their export requests" ON public.generated_pdfs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.export_requests er
      JOIN public.user_companies uc ON uc.company_id = er.company_id
      JOIN public.users u ON u.id = uc.user_id
      WHERE u.auth_user_id = auth.uid()
      AND er.id = generated_pdfs.export_request_id
      AND uc.is_active = true
    )
  );

-- RLS Policies for Merged PDFs
CREATE POLICY "Users can view merged PDFs from their export requests" ON public.merged_pdfs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.export_requests er
      JOIN public.user_companies uc ON uc.company_id = er.company_id
      JOIN public.users u ON u.id = uc.user_id
      WHERE u.auth_user_id = auth.uid()
      AND er.id = merged_pdfs.export_request_id
      AND uc.is_active = true
    )
  );

-- RLS Policies for Audit Logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.id = audit_logs.user_id
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_user_companies_user_id ON public.user_companies(user_id);
CREATE INDEX idx_user_companies_company_id ON public.user_companies(company_id);
CREATE INDEX idx_export_requests_company_id ON public.export_requests(company_id);
CREATE INDEX idx_export_requests_user_id ON public.export_requests(user_id);
CREATE INDEX idx_export_requests_status ON public.export_requests(status);
CREATE INDEX idx_generated_pdfs_export_request_id ON public.generated_pdfs(export_request_id);
CREATE INDEX idx_merged_pdfs_export_request_id ON public.merged_pdfs(export_request_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_export_requests_updated_at
  BEFORE UPDATE ON public.export_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdf_templates_updated_at
  BEFORE UPDATE ON public.pdf_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-generate request numbers
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := 'JEC-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('export_request_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create sequence for request numbers
CREATE SEQUENCE IF NOT EXISTS export_request_seq START 1;

-- Create trigger for auto-generating request numbers
CREATE TRIGGER generate_export_request_number
  BEFORE INSERT ON public.export_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_request_number();

-- Insert default PDF templates
INSERT INTO public.pdf_templates (template_name, template_type, file_path, field_mapping) VALUES
('Export Form Type 1', 'export_form_1', '/templates/export_form_1.pdf', '{"plate_number": "field_1", "vin": "field_2", "vehicle_make": "field_3"}'),
('Export Form Type 2', 'export_form_2', '/templates/export_form_2.pdf', '{"plate_number": "field_a", "vin": "field_b", "vehicle_model": "field_c"}'),
('Export Form Type 3', 'export_form_3', '/templates/export_form_3.pdf', '{"chassis_number": "field_x", "owner_name": "field_y", "vehicle_year": "field_z"}');