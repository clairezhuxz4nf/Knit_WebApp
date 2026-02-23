
-- Create a junction table for per-user likes
CREATE TABLE public.story_bite_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_bite_id uuid NOT NULL REFERENCES public.story_bites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(story_bite_id, user_id)
);

ALTER TABLE public.story_bite_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view likes"
  ON public.story_bite_likes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM story_bites sb
    WHERE sb.id = story_bite_likes.story_bite_id
    AND sb.family_space_id IN (SELECT get_user_family_space_ids(auth.uid()))
  ));

CREATE POLICY "Users can insert their own likes"
  ON public.story_bite_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.story_bite_likes FOR DELETE
  USING (auth.uid() = user_id);
