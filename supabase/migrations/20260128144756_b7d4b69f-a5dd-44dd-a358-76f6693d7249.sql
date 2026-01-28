-- Create storage bucket for templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow reading templates (for the edge function via service role)
CREATE POLICY "Allow authenticated users to read templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates');

-- Policy to allow uploading templates (admin only - we'll handle this manually)
CREATE POLICY "Allow authenticated users to upload templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'templates');