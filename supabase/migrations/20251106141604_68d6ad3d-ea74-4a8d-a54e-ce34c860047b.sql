-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false);

-- Create policies for resume uploads
CREATE POLICY "Users can upload their own resume"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own resume"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own resume"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own resume"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Recruiters can view applicant resumes"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resumes' 
  AND EXISTS (
    SELECT 1 
    FROM applications 
    JOIN jobs ON applications.job_id = jobs.id 
    WHERE jobs.recruiter_id = auth.uid()
    AND applications.applicant_id::text = (storage.foldername(storage.objects.name))[1]
  )
);