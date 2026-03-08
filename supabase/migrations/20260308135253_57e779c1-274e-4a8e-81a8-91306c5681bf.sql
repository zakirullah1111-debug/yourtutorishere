
-- Add blocked_dates column to tutors table
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS blocked_dates date[] DEFAULT '{}';

-- TABLE 1: tutor_availability
CREATE TABLE IF NOT EXISTS public.tutor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  day_of_week int NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_availability UNIQUE (tutor_id, day_of_week, start_time, end_time)
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_availability_time_range()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'end_time must be after start_time';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_availability_time
  BEFORE INSERT OR UPDATE ON public.tutor_availability
  FOR EACH ROW EXECUTE FUNCTION public.validate_availability_time_range();

ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_manage_availability"
  ON public.tutor_availability FOR ALL
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "read_active_availability"
  ON public.tutor_availability FOR SELECT
  USING (is_active = true);

-- TABLE 2: demo_bookings
CREATE TABLE IF NOT EXISTS public.demo_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes int DEFAULT 30,
  status text NOT NULL DEFAULT 'confirmed',
  meeting_room_id text NOT NULL,
  meeting_url text NOT NULL,
  cancellation_reason text,
  cancelled_at timestamptz,
  completed_at timestamptz,
  review_prompted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT no_double_booking UNIQUE (tutor_id, scheduled_date, scheduled_time)
);

ALTER TABLE public.demo_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_booking_select"
  ON public.demo_bookings FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "student_booking_insert"
  ON public.demo_bookings FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "student_booking_update"
  ON public.demo_bookings FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "tutor_booking_select"
  ON public.demo_bookings FOR SELECT
  USING (auth.uid() = tutor_id);

CREATE POLICY "tutor_booking_update"
  ON public.demo_bookings FOR UPDATE
  USING (auth.uid() = tutor_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.demo_bookings;

-- TABLE 3: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_booking_id uuid REFERENCES public.demo_bookings(id),
  action_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_notifications_select"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own_notifications_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_notifications_update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_availability_tutor_day
  ON public.tutor_availability(tutor_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_bookings_tutor_date
  ON public.demo_bookings(tutor_id, scheduled_date, scheduled_time);

CREATE INDEX IF NOT EXISTS idx_bookings_student_status
  ON public.demo_bookings(student_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);
