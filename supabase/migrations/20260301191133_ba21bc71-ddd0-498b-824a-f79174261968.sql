
-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can view verified tutors" ON public.tutors;

-- Create a PERMISSIVE SELECT policy so authenticated (and anon) users can view verified tutors
CREATE POLICY "Anyone can view verified tutors"
ON public.tutors
FOR SELECT
USING ((verified = true) OR (auth.uid() = user_id));
