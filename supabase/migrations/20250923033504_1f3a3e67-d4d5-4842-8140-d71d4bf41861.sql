-- Create storage bucket for vehicle documents
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-documents', 'vehicle-documents', false);

-- Create RLS policies for vehicle documents bucket
CREATE POLICY "Users can upload vehicle documents for their companies" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'vehicle-documents' 
  AND EXISTS (
    SELECT 1 
    FROM user_companies uc
    JOIN users u ON u.id = uc.user_id
    WHERE u.auth_user_id = auth.uid() 
    AND uc.is_active = true
    AND (storage.foldername(name))[1] = uc.company_id::text
  )
);

CREATE POLICY "Users can view vehicle documents from their companies" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'vehicle-documents' 
  AND EXISTS (
    SELECT 1 
    FROM user_companies uc
    JOIN users u ON u.id = uc.user_id
    WHERE u.auth_user_id = auth.uid() 
    AND uc.is_active = true
    AND (storage.foldername(name))[1] = uc.company_id::text
  )
);

CREATE POLICY "Users can update vehicle documents from their companies" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'vehicle-documents' 
  AND EXISTS (
    SELECT 1 
    FROM user_companies uc
    JOIN users u ON u.id = uc.user_id
    WHERE u.auth_user_id = auth.uid() 
    AND uc.is_active = true
    AND (storage.foldername(name))[1] = uc.company_id::text
  )
);

CREATE POLICY "Users can delete vehicle documents from their companies" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'vehicle-documents' 
  AND EXISTS (
    SELECT 1 
    FROM user_companies uc
    JOIN users u ON u.id = uc.user_id
    WHERE u.auth_user_id = auth.uid() 
    AND uc.is_active = true
    AND (storage.foldername(name))[1] = uc.company_id::text
  )
);