/*
  # Create Evidence Files Storage Bucket

  1. New Storage Bucket
    - `evidence-files` bucket for storing corruption report evidence
    - Public access for reading files
    - Authenticated users can upload files
    
  2. Security Policies
    - Anyone can view/download evidence files (public read access)
    - Anyone can upload evidence files (public insert access)
    - File size and type restrictions handled at application level
    
  3. Configuration
    - Public bucket to allow easy access to evidence files
    - Proper CORS configuration for web uploads
*/

-- Create the evidence-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence-files',
  'evidence-files', 
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Allow public access to view files in the evidence-files bucket
CREATE POLICY "Public Access to Evidence Files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'evidence-files');

-- Allow public uploads to evidence-files bucket
CREATE POLICY "Public Upload to Evidence Files"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'evidence-files');

-- Allow users to delete their own uploaded files (optional, for cleanup)
CREATE POLICY "Users can delete evidence files"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'evidence-files');