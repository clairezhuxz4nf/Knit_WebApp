
-- Add storage policies for storybooks path in family-gems bucket
CREATE POLICY "Family members can view storybooks files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'family-gems'
  AND (storage.foldername(name))[1] = 'storybooks'
);

CREATE POLICY "Family members can upload storybooks files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'family-gems'
  AND (storage.foldername(name))[1] = 'storybooks'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Family members can delete storybooks files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'family-gems'
  AND (storage.foldername(name))[1] = 'storybooks'
  AND auth.role() = 'authenticated'
);
