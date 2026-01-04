-- Step 1: Add new columns to people table
ALTER TABLE public.people
ADD COLUMN is_admin boolean NOT NULL DEFAULT false,
ADD COLUMN joined_at timestamp with time zone NOT NULL DEFAULT now();

-- Step 2: Create or replace the is_family_member function to use people table
CREATE OR REPLACE FUNCTION public.is_family_member(_user_id uuid, _family_space_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.people
    WHERE user_id = _user_id
      AND family_space_id = _family_space_id
  )
$function$;

-- Step 3: Create or replace the is_family_admin function to use people table
CREATE OR REPLACE FUNCTION public.is_family_admin(_user_id uuid, _family_space_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.people
    WHERE user_id = _user_id
      AND family_space_id = _family_space_id
      AND is_admin = true
  )
$function$;

-- Step 4: Create or replace get_user_family_space_ids to use people table
CREATE OR REPLACE FUNCTION public.get_user_family_space_ids(_user_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT family_space_id
  FROM public.people
  WHERE user_id = _user_id
$function$;

-- Step 5: Drop the old family_members table (this will cascade delete foreign key references)
DROP TABLE IF EXISTS public.family_members CASCADE;