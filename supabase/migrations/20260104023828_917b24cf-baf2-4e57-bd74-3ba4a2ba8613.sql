-- Create storage bucket for project assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', false);

-- RLS policies for project-assets bucket

-- Allow users to view files in projects they're a contributor of
CREATE POLICY "Project contributors can view assets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-assets' 
  AND (
    EXISTS (
      SELECT 1 FROM project_contributors pc
      JOIN people p ON p.id = pc.person_id
      WHERE pc.project_id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
        AND pc.status = 'accepted'
    )
    OR EXISTS (
      SELECT 1 FROM projects proj
      WHERE proj.id::text = (storage.foldername(name))[1]
        AND proj.created_by = auth.uid()
    )
  )
);

-- Allow project contributors to upload files
CREATE POLICY "Project contributors can upload assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-assets' 
  AND (
    EXISTS (
      SELECT 1 FROM project_contributors pc
      JOIN people p ON p.id = pc.person_id
      WHERE pc.project_id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
        AND pc.status = 'accepted'
    )
    OR EXISTS (
      SELECT 1 FROM projects proj
      WHERE proj.id::text = (storage.foldername(name))[1]
        AND proj.created_by = auth.uid()
    )
  )
);

-- Allow project creators and admins to delete files
CREATE POLICY "Project admins can delete assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-assets' 
  AND EXISTS (
    SELECT 1 FROM projects proj
    WHERE proj.id::text = (storage.foldername(name))[1]
      AND (
        proj.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM family_members fm
          WHERE fm.family_space_id = proj.family_space_id
            AND fm.user_id = auth.uid()
            AND fm.is_admin = true
        )
      )
  )
);

-- Allow project contributors to update their own uploads
CREATE POLICY "Project contributors can update assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-assets' 
  AND (
    EXISTS (
      SELECT 1 FROM project_contributors pc
      JOIN people p ON p.id = pc.person_id
      WHERE pc.project_id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
        AND pc.status = 'accepted'
    )
    OR EXISTS (
      SELECT 1 FROM projects proj
      WHERE proj.id::text = (storage.foldername(name))[1]
        AND proj.created_by = auth.uid()
    )
  )
);