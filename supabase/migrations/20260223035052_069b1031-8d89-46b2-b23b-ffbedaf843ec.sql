
-- Junction table linking story_bites to family_photos
CREATE TABLE public.story_bite_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_bite_id UUID NOT NULL REFERENCES public.story_bites(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.family_photos(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_bite_id, photo_id)
);

ALTER TABLE public.story_bite_photos ENABLE ROW LEVEL SECURITY;

-- Family members can view photos linked to story bites in their family
CREATE POLICY "Family members can view story bite photos"
ON public.story_bite_photos FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.story_bites sb
  WHERE sb.id = story_bite_id
  AND sb.family_space_id IN (SELECT get_user_family_space_ids(auth.uid()))
));

-- Creators and admins can insert links
CREATE POLICY "Creators and admins can link photos"
ON public.story_bite_photos FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.story_bites sb
  WHERE sb.id = story_bite_id
  AND (sb.created_by = auth.uid() OR is_family_admin(auth.uid(), sb.family_space_id))
));

-- Creators and admins can delete links
CREATE POLICY "Creators and admins can unlink photos"
ON public.story_bite_photos FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.story_bites sb
  WHERE sb.id = story_bite_id
  AND (sb.created_by = auth.uid() OR is_family_admin(auth.uid(), sb.family_space_id))
));
