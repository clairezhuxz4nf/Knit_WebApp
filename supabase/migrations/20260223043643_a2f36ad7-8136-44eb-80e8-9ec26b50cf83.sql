
-- Create comments table for story bites
CREATE TABLE public.story_bite_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_bite_id UUID NOT NULL REFERENCES public.story_bites(id) ON DELETE CASCADE,
  family_space_id UUID NOT NULL REFERENCES public.family_spaces(id),
  created_by UUID NOT NULL,
  text TEXT,
  is_audio BOOLEAN NOT NULL DEFAULT false,
  audio_url TEXT,
  audio_transcript TEXT,
  audio_duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_bite_comments ENABLE ROW LEVEL SECURITY;

-- Family members can view comments
CREATE POLICY "Family members can view comments"
ON public.story_bite_comments
FOR SELECT
USING (family_space_id IN (SELECT get_user_family_space_ids(auth.uid())));

-- Family members can create comments
CREATE POLICY "Family members can create comments"
ON public.story_bite_comments
FOR INSERT
WITH CHECK (is_family_member(auth.uid(), family_space_id) AND created_by = auth.uid());

-- Creators can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.story_bite_comments
FOR DELETE
USING (created_by = auth.uid() OR is_family_admin(auth.uid(), family_space_id));

-- Index for fast lookups
CREATE INDEX idx_story_bite_comments_story_bite_id ON public.story_bite_comments(story_bite_id);
