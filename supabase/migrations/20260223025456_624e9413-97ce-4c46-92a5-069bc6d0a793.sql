
CREATE TABLE public.story_bites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_space_id uuid NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  audio_url text,
  person_name text,
  avatar_url text,
  content_type text NOT NULL DEFAULT 'stories',
  likes integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.story_bites ENABLE ROW LEVEL SECURITY;

-- Only family members can view their family's story bites
CREATE POLICY "Family members can view story bites"
  ON public.story_bites FOR SELECT
  USING (family_space_id IN (SELECT get_user_family_space_ids(auth.uid())));

-- Family members can create story bites in their family
CREATE POLICY "Family members can create story bites"
  ON public.story_bites FOR INSERT
  WITH CHECK (is_family_member(auth.uid(), family_space_id) AND created_by = auth.uid());

-- Creators and admins can update story bites
CREATE POLICY "Creators and admins can update story bites"
  ON public.story_bites FOR UPDATE
  USING (created_by = auth.uid() OR is_family_admin(auth.uid(), family_space_id));

-- Creators and admins can delete story bites
CREATE POLICY "Creators and admins can delete story bites"
  ON public.story_bites FOR DELETE
  USING (created_by = auth.uid() OR is_family_admin(auth.uid(), family_space_id));

-- Trigger for updated_at
CREATE TRIGGER update_story_bites_updated_at
  BEFORE UPDATE ON public.story_bites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
