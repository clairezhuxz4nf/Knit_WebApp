-- Create RLS policies for the projects table
-- Family members can view projects in their family spaces
CREATE POLICY "Family members can view projects"
ON public.projects
FOR SELECT
USING (family_space_id IN (SELECT get_user_family_space_ids(auth.uid())));

-- Family members can create projects in their family spaces
CREATE POLICY "Family members can create projects"
ON public.projects
FOR INSERT
WITH CHECK (
  is_family_member(auth.uid(), family_space_id) 
  AND created_by = auth.uid()
);

-- Project creators and admins can update projects
CREATE POLICY "Creators and admins can update projects"
ON public.projects
FOR UPDATE
USING (
  created_by = auth.uid() 
  OR is_family_admin(auth.uid(), family_space_id)
);

-- Project creators and admins can delete projects
CREATE POLICY "Creators and admins can delete projects"
ON public.projects
FOR DELETE
USING (
  created_by = auth.uid() 
  OR is_family_admin(auth.uid(), family_space_id)
);