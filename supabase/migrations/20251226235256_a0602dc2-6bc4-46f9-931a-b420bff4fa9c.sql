-- Allow any authenticated user to find family spaces by code (for joining)
CREATE POLICY "Anyone can find family spaces by code"
ON public.family_spaces
FOR SELECT
USING (true);