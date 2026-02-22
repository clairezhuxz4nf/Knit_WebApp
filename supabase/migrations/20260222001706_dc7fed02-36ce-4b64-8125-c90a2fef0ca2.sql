-- Drop and recreate the INSERT policy to also allow photos/ path
DROP POLICY "Authenticated family members can upload family gems" ON storage.objects;

CREATE POLICY "Authenticated family members can upload family gems"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'family-gems' AND (
    -- Personal uploads: folder = user's auth uid
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Cover photos: covers/{family_space_id}
    (
      (storage.foldername(name))[1] = 'covers'
      AND EXISTS (
        SELECT 1 FROM public.people
        WHERE people.user_id = auth.uid()
        AND people.family_space_id::text = (storage.foldername(name))[2]
      )
    )
    OR
    -- Shared photo repository: photos/{family_space_id}
    (
      (storage.foldername(name))[1] = 'photos'
      AND EXISTS (
        SELECT 1 FROM public.people
        WHERE people.user_id = auth.uid()
        AND people.family_space_id::text = (storage.foldername(name))[2]
      )
    )
  )
);

-- Also update SELECT policy to allow viewing photos/ path
DROP POLICY "Authenticated family members can view family gems" ON storage.objects;

CREATE POLICY "Authenticated family members can view family gems"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'family-gems' AND (
    -- Personal uploads
    EXISTS (
      SELECT 1 FROM people p1 JOIN people p2 ON p1.family_space_id = p2.family_space_id
      WHERE p1.user_id = auth.uid()
      AND p2.user_id::text = (storage.foldername(name))[1]
    )
    OR
    -- Cover photos
    (
      (storage.foldername(name))[1] = 'covers'
      AND EXISTS (
        SELECT 1 FROM public.people
        WHERE people.user_id = auth.uid()
        AND people.family_space_id::text = (storage.foldername(name))[2]
      )
    )
    OR
    -- Shared photo repository
    (
      (storage.foldername(name))[1] = 'photos'
      AND EXISTS (
        SELECT 1 FROM public.people
        WHERE people.user_id = auth.uid()
        AND people.family_space_id::text = (storage.foldername(name))[2]
      )
    )
  )
);