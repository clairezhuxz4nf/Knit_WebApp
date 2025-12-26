-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their family spaces" ON public.family_members;
DROP POLICY IF EXISTS "Admins can update family members" ON public.family_members;
DROP POLICY IF EXISTS "Admins can remove family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can view family spaces they belong to" ON public.family_spaces;
DROP POLICY IF EXISTS "Admins can update family spaces" ON public.family_spaces;
DROP POLICY IF EXISTS "Admins can delete family spaces" ON public.family_spaces;

-- Create a security definer function to check family membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_family_member(_user_id uuid, _family_space_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE user_id = _user_id
      AND family_space_id = _family_space_id
  )
$$;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_family_admin(_user_id uuid, _family_space_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE user_id = _user_id
      AND family_space_id = _family_space_id
      AND is_admin = true
  )
$$;

-- Create a security definer function to get user's family space ids
CREATE OR REPLACE FUNCTION public.get_user_family_space_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_space_id
  FROM public.family_members
  WHERE user_id = _user_id
$$;

-- Recreate family_members policies using security definer functions
CREATE POLICY "Users can view members of their family spaces"
ON public.family_members
FOR SELECT
USING (family_space_id IN (SELECT public.get_user_family_space_ids(auth.uid())));

CREATE POLICY "Admins can update family members"
ON public.family_members
FOR UPDATE
USING (public.is_family_admin(auth.uid(), family_space_id));

CREATE POLICY "Admins can remove family members"
ON public.family_members
FOR DELETE
USING (public.is_family_admin(auth.uid(), family_space_id) OR auth.uid() = user_id);

-- Recreate family_spaces policies using security definer functions
CREATE POLICY "Users can view family spaces they belong to"
ON public.family_spaces
FOR SELECT
USING (id IN (SELECT public.get_user_family_space_ids(auth.uid())));

CREATE POLICY "Admins can update family spaces"
ON public.family_spaces
FOR UPDATE
USING (public.is_family_admin(auth.uid(), id));

CREATE POLICY "Admins can delete family spaces"
ON public.family_spaces
FOR DELETE
USING (public.is_family_admin(auth.uid(), id));