-- Add cover photo field to family_spaces
ALTER TABLE public.family_spaces 
ADD COLUMN cover_photo_url TEXT;