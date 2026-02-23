-- Make title nullable and set a default so it's no longer required on insert
ALTER TABLE public.projects ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN title SET DEFAULT NULL;