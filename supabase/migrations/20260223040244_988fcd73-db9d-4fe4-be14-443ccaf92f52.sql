
-- Create storybooks table linking story bites to storybook files
CREATE TABLE public.storybooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_bite_id UUID NOT NULL REFERENCES public.story_bites(id) ON DELETE CASCADE,
  family_space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storybooks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Family members can view storybooks"
ON public.storybooks FOR SELECT
USING (family_space_id IN (SELECT get_user_family_space_ids(auth.uid())));

CREATE POLICY "Family members can create storybooks"
ON public.storybooks FOR INSERT
WITH CHECK (is_family_member(auth.uid(), family_space_id) AND created_by = auth.uid());

CREATE POLICY "Creators and admins can delete storybooks"
ON public.storybooks FOR DELETE
USING (created_by = auth.uid() OR is_family_admin(auth.uid(), family_space_id));

CREATE POLICY "Creators and admins can update storybooks"
ON public.storybooks FOR UPDATE
USING (created_by = auth.uid() OR is_family_admin(auth.uid(), family_space_id));
