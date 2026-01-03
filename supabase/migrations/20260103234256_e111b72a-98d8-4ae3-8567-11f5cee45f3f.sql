-- Create table for user event settings
CREATE TABLE public.user_event_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  show_birthdays BOOLEAN NOT NULL DEFAULT true,
  western_festivals JSONB NOT NULL DEFAULT '[
    {"id": "christmas", "name": "Christmas", "month": 11, "day": 25, "icon": "🎄", "enabled": true},
    {"id": "thanksgiving", "name": "Thanksgiving", "month": 10, "day": 28, "icon": "🦃", "enabled": true},
    {"id": "easter", "name": "Easter", "month": 3, "day": 20, "icon": "🐣", "enabled": true},
    {"id": "halloween", "name": "Halloween", "month": 9, "day": 31, "icon": "🎃", "enabled": true},
    {"id": "valentines", "name": "Valentine''s Day", "month": 1, "day": 14, "icon": "💝", "enabled": true}
  ]'::jsonb,
  anniversaries JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_event_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own settings"
ON public.user_event_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_event_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_event_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_event_settings_updated_at
BEFORE UPDATE ON public.user_event_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();