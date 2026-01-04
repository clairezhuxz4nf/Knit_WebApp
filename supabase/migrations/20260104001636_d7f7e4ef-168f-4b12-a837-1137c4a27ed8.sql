-- Add event_id column to projects table to associate projects with events
ALTER TABLE public.projects 
ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_projects_event_id ON public.projects(event_id);