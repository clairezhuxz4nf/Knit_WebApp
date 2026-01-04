-- Allow family members to update cover_photo_url
CREATE POLICY "Family members can update cover photo"
ON public.family_spaces
FOR UPDATE
USING (is_family_member(auth.uid(), id))
WITH CHECK (is_family_member(auth.uid(), id));