-- Add export_date column to export_requests table
ALTER TABLE public.export_requests 
ADD COLUMN export_date DATE;