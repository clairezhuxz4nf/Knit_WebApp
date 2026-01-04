-- Add emoji column to projects table
ALTER TABLE public.projects ADD COLUMN emoji text DEFAULT '📁';