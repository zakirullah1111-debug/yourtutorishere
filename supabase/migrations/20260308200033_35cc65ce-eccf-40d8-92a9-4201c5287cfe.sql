
-- Add new columns to demo_bookings
ALTER TABLE public.demo_bookings
  ADD COLUMN IF NOT EXISTS request_message text,
  ADD COLUMN IF NOT EXISTS tutor_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD COLUMN IF NOT EXISTS session_link_sent boolean NOT NULL DEFAULT false;

-- Change default status from 'confirmed' to 'pending'
ALTER TABLE public.demo_bookings
  ALTER COLUMN status SET DEFAULT 'pending';
