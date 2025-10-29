-- Fix RLS policy for users table to allow INSERT for authenticated users
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can insert their own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = auth_user_id);

-- Update companies table to rename zip_code to juso_code with proper constraint
ALTER TABLE public.companies 
DROP COLUMN IF EXISTS zip_code,
ADD COLUMN IF NOT EXISTS juso_code VARCHAR(5);

-- Add constraint for 5-digit JUSO code
ALTER TABLE public.companies 
ADD CONSTRAINT juso_code_format CHECK (juso_code ~ '^\d{5}$');