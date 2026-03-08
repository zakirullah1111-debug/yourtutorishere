
-- =============================================
-- CATEGORY 7: DATABASE SECURITY CONSTRAINTS
-- =============================================

-- 1. Validation triggers (not CHECK constraints per guidelines)

-- Rating validation trigger for reviews
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_review_rating
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

-- Hourly rate validation trigger for tutors
CREATE OR REPLACE FUNCTION public.validate_tutor_hourly_rate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.hourly_rate_pkr IS NOT NULL AND (NEW.hourly_rate_pkr <= 0 OR NEW.hourly_rate_pkr > 50000) THEN
    RAISE EXCEPTION 'Hourly rate must be between 1 and 50000 PKR';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_tutor_hourly_rate
  BEFORE INSERT OR UPDATE ON public.tutors
  FOR EACH ROW EXECUTE FUNCTION public.validate_tutor_hourly_rate();

-- Duration validation trigger for demo_bookings
CREATE OR REPLACE FUNCTION public.validate_booking_duration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.duration_minutes IS NOT NULL AND NEW.duration_minutes != 30 THEN
    RAISE EXCEPTION 'Demo booking duration must be 30 minutes';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_booking_duration
  BEFORE INSERT OR UPDATE ON public.demo_bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_duration();

-- Day of week validation trigger for tutor_availability
CREATE OR REPLACE FUNCTION public.validate_day_of_week()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.day_of_week < 0 OR NEW.day_of_week > 6 THEN
    RAISE EXCEPTION 'day_of_week must be between 0 and 6';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_day_of_week
  BEFORE INSERT OR UPDATE ON public.tutor_availability
  FOR EACH ROW EXECUTE FUNCTION public.validate_day_of_week();

-- 2. Unique constraints to prevent duplicates

-- Prevent duplicate conversations between same student and tutor
ALTER TABLE public.conversations
  ADD CONSTRAINT uq_conversation_participants
  UNIQUE (student_user_id, tutor_user_id);

-- Prevent double-booking same tutor at same date/time
ALTER TABLE public.demo_bookings
  ADD CONSTRAINT uq_tutor_booking_slot
  UNIQUE (tutor_id, scheduled_date, scheduled_time);

-- 3. updated_at triggers on all mutable tables

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_tutors_updated_at
  BEFORE UPDATE ON public.tutors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_demo_bookings_updated_at
  BEFORE UPDATE ON public.demo_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
