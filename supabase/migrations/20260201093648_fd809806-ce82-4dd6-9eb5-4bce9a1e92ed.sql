-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'tutor', 'student');

-- Create user_roles table (security best practice - roles separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    city TEXT,
    date_of_birth DATE,
    gender TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create tutors table
CREATE TABLE public.tutors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    education_level TEXT NOT NULL,
    university TEXT NOT NULL,
    degree TEXT NOT NULL,
    graduation_year INTEGER NOT NULL,
    years_of_experience INTEGER DEFAULT 0,
    primary_subject TEXT NOT NULL,
    secondary_subject TEXT,
    additional_subjects TEXT[],
    teaching_levels TEXT[] NOT NULL,
    hourly_rate_pkr INTEGER NOT NULL,
    total_students_taught INTEGER DEFAULT 0,
    active_students INTEGER DEFAULT 0,
    total_hours_taught INTEGER DEFAULT 0,
    average_rating DECIMAL(2,1) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    profile_complete BOOLEAN DEFAULT false,
    languages TEXT[] DEFAULT ARRAY['English', 'Urdu'],
    availability_days TEXT[],
    preferred_time_slot TEXT,
    bio_summary TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tutors_user_id ON public.tutors(user_id);
CREATE INDEX idx_tutors_primary_subject ON public.tutors(primary_subject);
CREATE INDEX idx_tutors_status ON public.tutors(status);
CREATE INDEX idx_tutors_verified ON public.tutors(verified);
CREATE INDEX idx_tutors_rating ON public.tutors(average_rating DESC);

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    parent_email TEXT,
    parent_phone TEXT,
    school_name TEXT,
    current_class TEXT,
    education_board TEXT,
    primary_subject TEXT NOT NULL,
    secondary_subject TEXT,
    additional_subjects TEXT[],
    assigned_tutor_id UUID REFERENCES public.tutors(id) ON DELETE SET NULL,
    sessions_per_week INTEGER DEFAULT 0,
    total_sessions_completed INTEGER DEFAULT 0,
    total_hours_completed DECIMAL(6,1) DEFAULT 0.0,
    current_grade_average DECIMAL(4,1),
    progress_status TEXT DEFAULT 'New',
    last_session_date DATE,
    next_session_date DATE,
    payment_status TEXT DEFAULT 'Pending',
    package_type TEXT,
    parent_satisfaction DECIMAL(2,1),
    status TEXT DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_tutor ON public.students(assigned_tutor_id);
CREATE INDEX idx_students_status ON public.students(status);

-- Create sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status TEXT DEFAULT 'Scheduled',
    zoom_meeting_id TEXT,
    zoom_join_url TEXT,
    recording_url TEXT,
    session_notes TEXT,
    tutor_rating INTEGER CHECK (tutor_rating >= 1 AND tutor_rating <= 5),
    tutor_feedback TEXT,
    student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
    student_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sessions_student ON public.sessions(student_id);
CREATE INDEX idx_sessions_tutor ON public.sessions(tutor_id);
CREATE INDEX idx_sessions_date ON public.sessions(scheduled_date);
CREATE INDEX idx_sessions_status ON public.sessions(status);

-- Create payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
    amount_pkr DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    payment_status TEXT DEFAULT 'Pending',
    payment_date TIMESTAMPTZ,
    session_ids UUID[],
    package_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payments_student ON public.payments(student_id);
CREATE INDEX idx_payments_tutor ON public.payments(tutor_id);
CREATE INDEX idx_payments_status ON public.payments(payment_status);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reviews_tutor ON public.reviews(tutor_id);
CREATE INDEX idx_reviews_student ON public.reviews(student_id);

-- Create chat_history table for AI chatbot
CREATE TABLE public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    ai_model TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_chat_user ON public.chat_history(user_id);
CREATE INDEX idx_chat_session ON public.chat_history(session_id);

-- Create subjects reference table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    icon TEXT,
    tutor_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Insert default subjects
INSERT INTO public.subjects (name, category, icon) VALUES
('Physics', 'Sciences', 'atom'),
('Chemistry', 'Sciences', 'flask'),
('Biology', 'Sciences', 'dna'),
('Mathematics', 'Sciences', 'calculator'),
('Statistics', 'Sciences', 'bar-chart'),
('ICT', 'Sciences', 'laptop'),
('Psychology', 'Sciences', 'brain'),
('English', 'Languages', 'book-open'),
('Urdu', 'Languages', 'pen-tool'),
('Arabic', 'Languages', 'scroll'),
('Chinese', 'Languages', 'languages'),
('French', 'Languages', 'flag'),
('Economics', 'Business', 'trending-up'),
('Business Studies', 'Business', 'briefcase'),
('Accounting', 'Business', 'calculator'),
('History', 'Humanities', 'landmark'),
('Islamiyat', 'Humanities', 'book'),
('Pakistan Studies', 'Humanities', 'map'),
('Sociology', 'Humanities', 'users'),
('Law', 'Humanities', 'scale'),
('Quran Recitation', 'Humanities', 'book-open');

-- RLS Policies

-- User roles: users can read their own roles, admins can manage all
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tutors policies
CREATE POLICY "Anyone can view verified tutors" ON public.tutors
    FOR SELECT USING (verified = true OR auth.uid() = user_id);

CREATE POLICY "Tutors can update own profile" ON public.tutors
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Tutors can insert own profile" ON public.tutors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Students policies
CREATE POLICY "Students can view own profile" ON public.students
    FOR SELECT USING (auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.tutors WHERE tutors.id = students.assigned_tutor_id AND tutors.user_id = auth.uid()));

CREATE POLICY "Students can update own profile" ON public.students
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile" ON public.students
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = sessions.student_id AND students.user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.tutors WHERE tutors.id = sessions.tutor_id AND tutors.user_id = auth.uid())
    );

CREATE POLICY "Students can create sessions" ON public.sessions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = sessions.student_id AND students.user_id = auth.uid())
    );

CREATE POLICY "Participants can update sessions" ON public.sessions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = sessions.student_id AND students.user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.tutors WHERE tutors.id = sessions.tutor_id AND tutors.user_id = auth.uid())
    );

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = payments.student_id AND students.user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.tutors WHERE tutors.id = payments.tutor_id AND tutors.user_id = auth.uid())
    );

CREATE POLICY "Students can create payments" ON public.payments
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = payments.student_id AND students.user_id = auth.uid())
    );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Students can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = reviews.student_id AND students.user_id = auth.uid())
    );

CREATE POLICY "Students can update own reviews" ON public.reviews
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = reviews.student_id AND students.user_id = auth.uid())
    );

-- Chat history policies
CREATE POLICY "Users can view own chat history" ON public.chat_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON public.chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subjects are publicly readable
CREATE POLICY "Anyone can view subjects" ON public.subjects
    FOR SELECT USING (true);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutors_updated_at
    BEFORE UPDATE ON public.tutors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update tutor rating when review is added
CREATE OR REPLACE FUNCTION public.update_tutor_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(2,1);
    review_count INTEGER;
BEGIN
    SELECT AVG(rating)::DECIMAL(2,1), COUNT(*) 
    INTO avg_rating, review_count
    FROM public.reviews 
    WHERE tutor_id = NEW.tutor_id;
    
    UPDATE public.tutors 
    SET average_rating = avg_rating, total_reviews = review_count
    WHERE id = NEW.tutor_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_review_added
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_tutor_rating();