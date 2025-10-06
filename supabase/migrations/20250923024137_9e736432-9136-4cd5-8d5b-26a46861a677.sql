-- Fix RLS policy for user_companies table to allow INSERT
-- This allows users to create user-company relationships when creating companies

CREATE POLICY "Users can create their own user-company relationships" 
ON public.user_companies 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users u 
    WHERE u.auth_user_id = auth.uid() 
    AND u.id = user_companies.user_id
  )
);