
-- =============================================
-- FIX 1: Broken RLS policies on project_contributors
-- =============================================

-- Drop the broken policies that reference dropped family_members table
DROP POLICY IF EXISTS "Users can view project contributors" ON public.project_contributors;
DROP POLICY IF EXISTS "Project creators can invite contributors" ON public.project_contributors;
DROP POLICY IF EXISTS "Project creators can remove contributors" ON public.project_contributors;

-- Recreate SELECT policy using helper functions
CREATE POLICY "Users can view project contributors"
ON public.project_contributors FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_contributors.project_id
    AND is_family_member(auth.uid(), p.family_space_id)
  )
);

-- Recreate INSERT policy
CREATE POLICY "Project creators can invite contributors"
ON public.project_contributors FOR INSERT
TO authenticated
WITH CHECK (
  invited_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_contributors.project_id
    AND (p.created_by = auth.uid() OR is_family_admin(auth.uid(), p.family_space_id))
  )
);

-- Recreate DELETE policy
CREATE POLICY "Project creators can remove contributors"
ON public.project_contributors FOR DELETE
TO authenticated
USING (
  invited_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_contributors.project_id
    AND (p.created_by = auth.uid() OR is_family_admin(auth.uid(), p.family_space_id))
  )
);

-- =============================================
-- FIX 2: Storybooks storage policies - add family verification
-- =============================================

-- Drop overpermissive policies
DROP POLICY IF EXISTS "Family members can view storybooks files" ON storage.objects;
DROP POLICY IF EXISTS "Family members can upload storybooks files" ON storage.objects;
DROP POLICY IF EXISTS "Family members can delete storybooks files" ON storage.objects;

-- Secure SELECT: only family members can view storybook files
CREATE POLICY "Family members can view storybooks files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'family-gems'
  AND (storage.foldername(name))[1] = 'storybooks'
  AND EXISTS (
    SELECT 1 FROM public.storybooks sb
    JOIN public.people p ON p.family_space_id = sb.family_space_id
    WHERE sb.file_path = name
      AND p.user_id = auth.uid()
  )
);

-- Secure INSERT: only authenticated family members can upload
CREATE POLICY "Family members can upload storybooks files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'family-gems'
  AND (storage.foldername(name))[1] = 'storybooks'
  AND EXISTS (
    SELECT 1 FROM public.people
    WHERE user_id = auth.uid()
  )
);

-- Secure DELETE: only creator or admin can delete
CREATE POLICY "Family members can delete storybooks files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'family-gems'
  AND (storage.foldername(name))[1] = 'storybooks'
  AND EXISTS (
    SELECT 1 FROM public.storybooks sb
    WHERE sb.file_path = name
      AND (
        sb.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.people p
          WHERE p.family_space_id = sb.family_space_id
            AND p.user_id = auth.uid()
            AND p.is_admin = true
        )
      )
  )
);
