-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('job_seeker', 'recruiter', 'admin');

-- Create enum for application status
CREATE TYPE application_status AS ENUM ('applied', 'viewed', 'shortlisted', 'rejected', 'hired');

-- Create enum for job status
CREATE TYPE job_status AS ENUM ('open', 'closed', 'paused');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'job_seeker',
  phone TEXT,
  location TEXT,
  bio TEXT,
  company_name TEXT,
  resume_url TEXT,
  profile_image_url TEXT,
  skills TEXT[],
  experience_years INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  required_skills TEXT[] NOT NULL,
  experience_required INTEGER,
  status job_status NOT NULL DEFAULT 'open',
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'applied',
  cover_letter TEXT,
  resume_url TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

-- Create saved_jobs table
CREATE TABLE saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Jobs policies
CREATE POLICY "Anyone can view open jobs"
  ON jobs FOR SELECT
  USING (status = 'open' OR recruiter_id = auth.uid());

CREATE POLICY "Recruiters can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    recruiter_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'recruiter')
  );

CREATE POLICY "Recruiters can update own jobs"
  ON jobs FOR UPDATE
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can delete own jobs"
  ON jobs FOR DELETE
  USING (recruiter_id = auth.uid());

-- Applications policies
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (
    applicant_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
  );

CREATE POLICY "Job seekers can create applications"
  ON applications FOR INSERT
  WITH CHECK (
    applicant_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'job_seeker')
  );

CREATE POLICY "Recruiters can update application status"
  ON applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
  );

-- Saved jobs policies
CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can save jobs"
  ON saved_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave jobs"
  ON saved_jobs FOR DELETE
  USING (user_id = auth.uid());

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);