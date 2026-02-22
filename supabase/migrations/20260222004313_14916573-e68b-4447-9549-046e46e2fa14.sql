-- Allow any family member to delete events (not just creator/admin)
DROP POLICY "Creators and admins can delete events" ON public.events;

CREATE POLICY "Family members can delete events"
ON public.events FOR DELETE
TO authenticated
USING (
  is_family_member(auth.uid(), family_space_id)
);