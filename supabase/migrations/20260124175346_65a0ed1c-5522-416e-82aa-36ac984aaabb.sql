-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can find family spaces by code" ON public.family_spaces;

-- Create a secure function to look up family space by code (returns only id and name)
CREATE OR REPLACE FUNCTION public.lookup_family_space_by_code(_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fs.id, fs.name
  FROM public.family_spaces fs
  WHERE fs.family_code = upper(_code)
  LIMIT 1
$$;