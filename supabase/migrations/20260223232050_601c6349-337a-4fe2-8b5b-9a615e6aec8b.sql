-- Allow any family member to update placeholder people in their family space
CREATE POLICY "Family members can update placeholders"
ON public.people
FOR UPDATE
USING (
  is_family_member(auth.uid(), family_space_id)
  AND user_id IS NULL
  AND status IN ('placeholder', 'invited')
)
WITH CHECK (
  is_family_member(auth.uid(), family_space_id)
  AND user_id IS NULL
);