-- Create storage bucket for dental images
INSERT INTO storage.buckets (id, name, public)
VALUES ('dental-images', 'dental-images', false);

-- RLS policies for dental-images bucket
CREATE POLICY "Anyone can upload dental images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dental-images');

CREATE POLICY "Anyone can view their uploaded images"
ON storage.objects FOR SELECT
USING (bucket_id = 'dental-images');

CREATE POLICY "Anyone can update their uploaded images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'dental-images');

CREATE POLICY "Anyone can delete their uploaded images"
ON storage.objects FOR DELETE
USING (bucket_id = 'dental-images');