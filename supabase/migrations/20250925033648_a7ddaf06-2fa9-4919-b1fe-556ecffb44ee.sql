-- Add Jusho code column to export_requests table
ALTER TABLE public.export_requests 
ADD COLUMN jusho_code character varying;