-- Create function to seed default festival events for a family space
CREATE OR REPLACE FUNCTION public.seed_default_festivals(
  _family_space_id uuid,
  _created_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  festival_count int;
BEGIN
  -- Check if festivals already exist for this family space
  SELECT COUNT(*) INTO festival_count
  FROM public.events
  WHERE family_space_id = _family_space_id
    AND event_category = 'festival';

  -- Only seed if no festivals exist
  IF festival_count = 0 THEN
    INSERT INTO public.events (
      family_space_id,
      created_by,
      title,
      event_date,
      event_type,
      event_category,
      icon,
      is_recurring
    ) VALUES
      (_family_space_id, _created_by, 'Christmas', '2024-12-25', 'festival', 'festival', '🎄', true),
      (_family_space_id, _created_by, 'Thanksgiving', '2024-11-28', 'festival', 'festival', '🦃', true),
      (_family_space_id, _created_by, 'Easter', '2024-04-20', 'festival', 'festival', '🐣', true),
      (_family_space_id, _created_by, 'Halloween', '2024-10-31', 'festival', 'festival', '🎃', true),
      (_family_space_id, _created_by, 'Valentine''s Day', '2024-02-14', 'festival', 'festival', '💝', true);
  END IF;
END;
$$;