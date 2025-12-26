-- Create profiles table for user profile data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  birthday DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create family_spaces table
CREATE TABLE public.family_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  family_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on family_spaces
ALTER TABLE public.family_spaces ENABLE ROW LEVEL SECURITY;

-- Create family_members table (links users to family spaces)
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  birthday DATE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_space_id, user_id)
);

-- Enable RLS on family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Family spaces policies
CREATE POLICY "Users can view family spaces they belong to"
ON public.family_spaces FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_members.family_space_id = family_spaces.id 
    AND family_members.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create family spaces"
ON public.family_spaces FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update family spaces"
ON public.family_spaces FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_members.family_space_id = family_spaces.id 
    AND family_members.user_id = auth.uid()
    AND family_members.is_admin = true
  )
);

CREATE POLICY "Admins can delete family spaces"
ON public.family_spaces FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_members.family_space_id = family_spaces.id 
    AND family_members.user_id = auth.uid()
    AND family_members.is_admin = true
  )
);

-- Family members policies
CREATE POLICY "Users can view members of their family spaces"
ON public.family_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members AS fm
    WHERE fm.family_space_id = family_members.family_space_id 
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join family spaces"
ON public.family_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update family members"
ON public.family_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members AS fm
    WHERE fm.family_space_id = family_members.family_space_id 
    AND fm.user_id = auth.uid()
    AND fm.is_admin = true
  )
);

CREATE POLICY "Admins can remove family members"
ON public.family_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members AS fm
    WHERE fm.family_space_id = family_members.family_space_id 
    AND fm.user_id = auth.uid()
    AND fm.is_admin = true
  )
  OR auth.uid() = user_id
);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate 6-digit family code
CREATE OR REPLACE FUNCTION public.generate_family_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.family_spaces WHERE family_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_spaces_updated_at
  BEFORE UPDATE ON public.family_spaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();