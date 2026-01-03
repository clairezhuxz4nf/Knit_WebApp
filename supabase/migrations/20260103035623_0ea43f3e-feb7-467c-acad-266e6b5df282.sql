-- Create enum for person status
CREATE TYPE public.person_status AS ENUM ('active', 'invited', 'placeholder', 'deceased');

-- Create enum for relationship types
CREATE TYPE public.relationship_type AS ENUM ('parent_child', 'partnership');

-- Create people table (nodes in the family tree)
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  avatar_url TEXT,
  birth_date DATE,
  status public.person_status NOT NULL DEFAULT 'placeholder',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create relationships table (edges connecting people)
CREATE TABLE public.relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  relationship_type public.relationship_type NOT NULL,
  person_a_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  person_b_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_people CHECK (person_a_id != person_b_id),
  CONSTRAINT unique_relationship UNIQUE (person_a_id, person_b_id, relationship_type)
);

-- Create invites table for invitation codes
CREATE TABLE public.family_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  target_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is person owner
CREATE OR REPLACE FUNCTION public.is_person_owner(_user_id UUID, _person_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.people
    WHERE id = _person_id
      AND user_id = _user_id
  )
$$;

-- Create security definer function to check if person is unclaimed and connected
CREATE OR REPLACE FUNCTION public.can_edit_placeholder(_user_id UUID, _person_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.people p
    WHERE p.id = _person_id
      AND p.user_id IS NULL
      AND p.status IN ('placeholder', 'invited')
      AND EXISTS (
        -- Check if there's a direct relationship to a node the user owns
        SELECT 1
        FROM public.relationships r
        JOIN public.people owned ON owned.user_id = _user_id
        WHERE (r.person_a_id = _person_id AND r.person_b_id = owned.id)
           OR (r.person_b_id = _person_id AND r.person_a_id = owned.id)
      )
  )
$$;

-- Function to generate unique 6-character invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := '';
    FOR i IN 1..6 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.family_invites WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- RLS Policies for people table
CREATE POLICY "Users can view people in their family spaces"
ON public.people FOR SELECT
USING (family_space_id IN (SELECT get_user_family_space_ids(auth.uid())));

CREATE POLICY "Family members can create people"
ON public.people FOR INSERT
WITH CHECK (
  is_family_member(auth.uid(), family_space_id)
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update their own person record"
ON public.people FOR UPDATE
USING (
  user_id = auth.uid()
  OR can_edit_placeholder(auth.uid(), id)
  OR is_family_admin(auth.uid(), family_space_id)
);

CREATE POLICY "Admins can delete placeholder people"
ON public.people FOR DELETE
USING (
  is_family_admin(auth.uid(), family_space_id)
  AND user_id IS NULL
);

-- RLS Policies for relationships table
CREATE POLICY "Users can view relationships in their family spaces"
ON public.relationships FOR SELECT
USING (family_space_id IN (SELECT get_user_family_space_ids(auth.uid())));

CREATE POLICY "Family members can create relationships"
ON public.relationships FOR INSERT
WITH CHECK (is_family_member(auth.uid(), family_space_id));

CREATE POLICY "Admins can delete relationships"
ON public.relationships FOR DELETE
USING (is_family_admin(auth.uid(), family_space_id));

-- RLS Policies for family_invites table
CREATE POLICY "Users can view invites in their family spaces"
ON public.family_invites FOR SELECT
USING (
  family_space_id IN (SELECT get_user_family_space_ids(auth.uid()))
  OR (invite_code IS NOT NULL AND claimed_at IS NULL AND expires_at > now())
);

CREATE POLICY "Family members can create invites"
ON public.family_invites FOR INSERT
WITH CHECK (
  is_family_member(auth.uid(), family_space_id)
  AND invited_by = auth.uid()
);

CREATE POLICY "Invites can be claimed by authenticated users"
ON public.family_invites FOR UPDATE
USING (claimed_at IS NULL AND expires_at > now());

-- Create indexes for performance
CREATE INDEX idx_people_family_space ON public.people(family_space_id);
CREATE INDEX idx_people_user ON public.people(user_id);
CREATE INDEX idx_relationships_family_space ON public.relationships(family_space_id);
CREATE INDEX idx_relationships_person_a ON public.relationships(person_a_id);
CREATE INDEX idx_relationships_person_b ON public.relationships(person_b_id);
CREATE INDEX idx_invites_code ON public.family_invites(invite_code);
CREATE INDEX idx_invites_target ON public.family_invites(target_person_id);

-- Trigger for updated_at
CREATE TRIGGER update_people_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();