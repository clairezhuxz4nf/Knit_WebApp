-- Make the family-gems bucket private
UPDATE storage.buckets SET public = false WHERE id = 'family-gems';

-- Drop existing overly permissive storage policies for family-gems
DROP POLICY IF EXISTS "Family members can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Family members can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Family members can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Family members can delete photos" ON storage.objects;

-- Create secure storage policies that require authentication and verify family membership

-- SELECT: Only authenticated family members can view photos in family-gems bucket
CREATE POLICY "Authenticated family members can view family gems"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'family-gems'
  AND (
    -- User photos: check if uploader is in same family space as authenticated user
    EXISTS (
      SELECT 1 FROM public.people p1
      JOIN public.people p2 ON p1.family_space_id = p2.family_space_id
      WHERE p1.user_id = auth.uid()
      AND p2.user_id::text = (storage.foldername(name))[1]
    )
    -- Cover photos: user must be in the family space
    OR (
      (storage.foldername(name))[1] = 'covers'
      AND EXISTS (
        SELECT 1 FROM public.people
        WHERE user_id = auth.uid()
        AND family_space_id::text = (storage.foldername(name))[2]
      )
    )
  )
);

-- INSERT: Only authenticated family members can upload photos
CREATE POLICY "Authenticated family members can upload family gems"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'family-gems'
  AND (
    -- Regular photos: upload to own folder only
    (storage.foldername(name))[1] = auth.uid()::text
    -- Cover photos: must be a family member of that family space
    OR (
      (storage.foldername(name))[1] = 'covers'
      AND EXISTS (
        SELECT 1 FROM public.people 
        WHERE user_id = auth.uid() 
        AND family_space_id::text = (storage.foldername(name))[2]
      )
    )
  )
);

-- UPDATE: Only file owners or family members for covers can update
CREATE POLICY "Owners can update family gems"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'family-gems'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'covers'
      AND EXISTS (
        SELECT 1 FROM public.people 
        WHERE user_id = auth.uid() 
        AND family_space_id::text = (storage.foldername(name))[2]
      )
    )
  )
);

-- DELETE: Only file owners or family admins can delete
CREATE POLICY "Owners and admins can delete family gems"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'family-gems'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'covers'
      AND EXISTS (
        SELECT 1 FROM public.people 
        WHERE user_id = auth.uid() 
        AND family_space_id::text = (storage.foldername(name))[2]
        AND is_admin = true
      )
    )
  )
);