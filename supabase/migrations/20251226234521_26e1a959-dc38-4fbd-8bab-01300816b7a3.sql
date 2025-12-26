-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'general' CHECK (event_type IN ('birthday', 'anniversary', 'holiday', 'milestone', 'general')),
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
CREATE POLICY "Users can view projects in their family spaces"
ON public.projects FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_members
  WHERE family_members.family_space_id = projects.family_space_id
  AND family_members.user_id = auth.uid()
));

CREATE POLICY "Family members can create projects"
ON public.projects FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM family_members
  WHERE family_members.family_space_id = projects.family_space_id
  AND family_members.user_id = auth.uid()
));

CREATE POLICY "Project creators and admins can update projects"
ON public.projects FOR UPDATE
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM family_members
    WHERE family_members.family_space_id = projects.family_space_id
    AND family_members.user_id = auth.uid()
    AND family_members.is_admin = true
  )
);

CREATE POLICY "Project creators and admins can delete projects"
ON public.projects FOR DELETE
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM family_members
    WHERE family_members.family_space_id = projects.family_space_id
    AND family_members.user_id = auth.uid()
    AND family_members.is_admin = true
  )
);

-- Events RLS policies
CREATE POLICY "Users can view events in their family spaces"
ON public.events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_members
  WHERE family_members.family_space_id = events.family_space_id
  AND family_members.user_id = auth.uid()
));

CREATE POLICY "Family members can create events"
ON public.events FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM family_members
  WHERE family_members.family_space_id = events.family_space_id
  AND family_members.user_id = auth.uid()
));

CREATE POLICY "Event creators and admins can update events"
ON public.events FOR UPDATE
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM family_members
    WHERE family_members.family_space_id = events.family_space_id
    AND family_members.user_id = auth.uid()
    AND family_members.is_admin = true
  )
);

CREATE POLICY "Event creators and admins can delete events"
ON public.events FOR DELETE
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM family_members
    WHERE family_members.family_space_id = events.family_space_id
    AND family_members.user_id = auth.uid()
    AND family_members.is_admin = true
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();