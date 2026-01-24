-- Fix Security Issues: Privilege Escalation & Broken Storage Policy

-- =====================================================
-- Issue 1: Fix privilege escalation on people table
-- Users should not be able to change their own is_admin status
-- =====================================================

-- Drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own person record" ON public.people;

-- Create separate granular policies for better security

-- Regular users can update their profile fields (but NOT is_admin)
CREATE POLICY "Users can update their own profile"
ON public.people FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND is_admin = (SELECT p.is_admin FROM public.people p WHERE p.id = people.id)
);

-- Users can edit connected placeholder nodes
CREATE POLICY "Users can edit connected placeholders"
ON public.people FOR UPDATE
USING (can_edit_placeholder(auth.uid(), id));

-- Family admins can update any record in their family space (including is_admin)
CREATE POLICY "Admins can update people records"
ON public.people FOR UPDATE
USING (is_family_admin(auth.uid(), family_space_id));

-- =====================================================
-- Issue 2: Fix project-assets storage DELETE policy
-- The old policy referenced the dropped family_members table
-- =====================================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Project admins can delete assets" ON storage.objects;

-- Create new policy using helper functions instead of dropped table
CREATE POLICY "Project admins can delete assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-assets' 
  AND EXISTS (
    SELECT 1 FROM public.projects proj
    WHERE proj.id::text = (storage.foldername(name))[1]
      AND (
        proj.created_by = auth.uid()
        OR is_family_admin(auth.uid(), proj.family_space_id)
      )
  )
);