-- Create storage bucket for family gems
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-gems', 'family-gems', true)
ON CONFLICT (id) DO NOTHING;

-- Create table to track family photos
CREATE TABLE public.family_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_photos ENABLE ROW LEVEL SECURITY;

-- Family members can view photos in their family spaces
CREATE POLICY "Family members can view photos"
ON public.family_photos
FOR SELECT
USING (family_space_id IN (SELECT get_user_family_space_ids(auth.uid())));

-- Family members can upload photos
CREATE POLICY "Family members can upload photos"
ON public.family_photos
FOR INSERT
WITH CHECK (
  is_family_member(auth.uid(), family_space_id) 
  AND uploaded_by = auth.uid()
);

-- Uploaders and admins can delete photos
CREATE POLICY "Uploaders and admins can delete photos"
ON public.family_photos
FOR DELETE
USING (
  uploaded_by = auth.uid() 
  OR is_family_admin(auth.uid(), family_space_id)
);

-- Storage policies for family-gems bucket
CREATE POLICY "Family members can view photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'family-gems');

CREATE POLICY "Family members can upload photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'family-gems' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'family-gems' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);