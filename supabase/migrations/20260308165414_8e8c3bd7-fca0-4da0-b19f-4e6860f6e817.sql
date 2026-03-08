
-- 1. Create a safe public view for tutors that excludes sensitive fields
CREATE OR REPLACE VIEW public.tutors_public
WITH (security_invoker = on) AS
SELECT 
  id, user_id, primary_subject, secondary_subject, additional_subjects,
  teaching_levels, education_level, university, degree, graduation_year,
  years_of_experience, hourly_rate_pkr, bio_summary, languages,
  teaching_mode, school_of_teaching, math_levels, country,
  average_rating, total_reviews, total_students_taught, active_students,
  total_hours_taught, verified, profile_complete, status,
  demo_video_url, demo_video_type, demo_video_title, demo_video_thumbnail,
  demo_video_duration, live_demo_enabled, live_demo_price,
  availability_days, preferred_time_slot,
  created_at, updated_at
FROM public.tutors;

-- 2. Add unique constraint on reviews to prevent duplicate reviews per session
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_student_session_unique 
UNIQUE (student_id, session_id);
