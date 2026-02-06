
-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can update their own profile" ON public.people;

-- Recreate without the self-referencing subquery
-- Instead, use a trigger to prevent is_admin escalation
CREATE POLICY "Users can update their own profile"
ON public.people
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create a trigger to prevent is_admin privilege escalation
CREATE OR REPLACE FUNCTION public.prevent_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent non-admins from changing is_admin
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Only allow if the user is already an admin of this family space
    IF NOT is_family_admin(auth.uid(), OLD.family_space_id) THEN
      RAISE EXCEPTION 'Cannot change admin status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_admin_escalation_trigger
BEFORE UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.prevent_admin_escalation();
