
-- Add math_levels column to tutors table
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS math_levels text[] DEFAULT NULL;

-- Create an RPC function for efficient subject tutor counts
CREATE OR REPLACE FUNCTION public.get_subject_tutor_counts()
RETURNS TABLE(subject text, tutor_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    unnested_subject as subject,
    COUNT(DISTINCT t.id) as tutor_count
  FROM tutors t,
    LATERAL unnest(
      ARRAY[t.primary_subject] || 
      COALESCE(ARRAY[t.secondary_subject], ARRAY[]::text[]) ||
      COALESCE(t.additional_subjects, ARRAY[]::text[])
    ) AS unnested_subject
  WHERE t.verified = true
    AND t.profile_complete = true
    AND unnested_subject IS NOT NULL
    AND unnested_subject != ''
  GROUP BY unnested_subject;
$$;

-- Create an RPC function for math level tutor counts
CREATE OR REPLACE FUNCTION public.get_math_level_tutor_counts()
RETURNS TABLE(math_level text, tutor_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    unnested_level as math_level,
    COUNT(DISTINCT t.id) as tutor_count
  FROM tutors t,
    LATERAL unnest(COALESCE(t.math_levels, ARRAY[]::text[])) AS unnested_level
  WHERE t.verified = true
    AND t.profile_complete = true
    AND unnested_level IS NOT NULL
  GROUP BY unnested_level;
$$;
