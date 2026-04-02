-- Create enrollment_requests table
CREATE TABLE public.enrollment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL,
  tutor_id UUID NOT NULL,
  subject TEXT NOT NULL,
  current_class TEXT,
  education_board TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

-- Students can create enrollment requests
CREATE POLICY "Students can create enrollment requests"
ON public.enrollment_requests
FOR INSERT
WITH CHECK (auth.uid() = student_user_id);

-- Students can view their own enrollment requests
CREATE POLICY "Students can view own enrollment requests"
ON public.enrollment_requests
FOR SELECT
USING (auth.uid() = student_user_id);

-- Tutors can view enrollment requests sent to them
CREATE POLICY "Tutors can view their enrollment requests"
ON public.enrollment_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tutors
    WHERE tutors.id = enrollment_requests.tutor_id
    AND tutors.user_id = auth.uid()
  )
);

-- Tutors can update enrollment requests sent to them
CREATE POLICY "Tutors can update their enrollment requests"
ON public.enrollment_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tutors
    WHERE tutors.id = enrollment_requests.tutor_id
    AND tutors.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_enrollment_requests_updated_at
BEFORE UPDATE ON public.enrollment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for enrollment requests so tutors get live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollment_requests;