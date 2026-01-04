-- Add new columns to events table for consolidated event types
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_category text NOT NULL DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.people(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS icon text DEFAULT '📅',
ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_person_id ON public.events(person_id);
CREATE INDEX IF NOT EXISTS idx_events_family_space ON public.events(family_space_id);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS policies for events table
CREATE POLICY "Users can view events in their family spaces"
ON public.events
FOR SELECT
USING (family_space_id IN (SELECT get_user_family_space_ids(auth.uid())));

CREATE POLICY "Family members can create events"
ON public.events
FOR INSERT
WITH CHECK (is_family_member(auth.uid(), family_space_id) AND created_by = auth.uid());

CREATE POLICY "Creators and admins can update events"
ON public.events
FOR UPDATE
USING (created_by = auth.uid() OR is_family_admin(auth.uid(), family_space_id));

CREATE POLICY "Creators and admins can delete events"
ON public.events
FOR DELETE
USING (created_by = auth.uid() OR is_family_admin(auth.uid(), family_space_id));

-- Function to sync birthday events when a person's birth_date changes
CREATE OR REPLACE FUNCTION public.sync_birthday_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing birthday event for this person if birth_date is removed
  IF NEW.birth_date IS NULL THEN
    DELETE FROM public.events 
    WHERE person_id = NEW.id 
    AND event_category = 'birthday';
    RETURN NEW;
  END IF;

  -- Upsert birthday event
  INSERT INTO public.events (
    family_space_id,
    created_by,
    title,
    event_date,
    event_type,
    event_category,
    person_id,
    icon,
    is_recurring
  ) VALUES (
    NEW.family_space_id,
    COALESCE(NEW.user_id, NEW.created_by),
    COALESCE(NEW.first_name, 'Family Member') || '''s Birthday',
    NEW.birth_date,
    'birthday',
    'birthday',
    NEW.id,
    '🎂',
    true
  )
  ON CONFLICT (person_id, event_category) 
  WHERE event_category = 'birthday'
  DO UPDATE SET
    title = EXCLUDED.title,
    event_date = EXCLUDED.event_date,
    family_space_id = EXCLUDED.family_space_id;

  RETURN NEW;
END;
$$;

-- Create unique partial index to support upsert for birthday events
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_birthday_person 
ON public.events (person_id, event_category) 
WHERE event_category = 'birthday';

-- Create trigger for birthday sync
DROP TRIGGER IF EXISTS sync_birthday_event_trigger ON public.people;
CREATE TRIGGER sync_birthday_event_trigger
AFTER INSERT OR UPDATE OF birth_date, first_name ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.sync_birthday_event();

-- Migrate existing birthdays: create birthday events for all people with birth_date
INSERT INTO public.events (
  family_space_id,
  created_by,
  title,
  event_date,
  event_type,
  event_category,
  person_id,
  icon,
  is_recurring
)
SELECT 
  p.family_space_id,
  COALESCE(p.user_id, p.created_by),
  COALESCE(p.first_name, 'Family Member') || '''s Birthday',
  p.birth_date,
  'birthday',
  'birthday',
  p.id,
  '🎂',
  true
FROM public.people p
WHERE p.birth_date IS NOT NULL
ON CONFLICT (person_id, event_category) WHERE event_category = 'birthday'
DO NOTHING;