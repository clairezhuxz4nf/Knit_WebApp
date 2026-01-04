-- Create project_contributors table to track who can work on a project
CREATE TABLE public.project_contributors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by uuid NOT NULL,
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  UNIQUE(project_id, person_id)
);

-- Enable RLS
ALTER TABLE public.project_contributors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view contributors for projects in their family spaces
CREATE POLICY "Users can view project contributors"
ON public.project_contributors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.family_members fm ON fm.family_space_id = p.family_space_id
    WHERE p.id = project_contributors.project_id
    AND fm.user_id = auth.uid()
  )
);

-- Project creators and admins can invite contributors
CREATE POLICY "Project creators can invite contributors"
ON public.project_contributors
FOR INSERT
WITH CHECK (
  invited_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_contributors.project_id
    AND (p.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_space_id = p.family_space_id
      AND fm.user_id = auth.uid()
      AND fm.is_admin = true
    ))
  )
);

-- Users can update their own invitations (to accept/decline)
CREATE POLICY "Users can respond to their invitations"
ON public.project_contributors
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.people per
    WHERE per.id = project_contributors.person_id
    AND per.user_id = auth.uid()
  )
);

-- Project creators and admins can delete contributors
CREATE POLICY "Project creators can remove contributors"
ON public.project_contributors
FOR DELETE
USING (
  invited_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_contributors.project_id
    AND (p.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_space_id = p.family_space_id
      AND fm.user_id = auth.uid()
      AND fm.is_admin = true
    ))
  )
);