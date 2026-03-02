
-- Add missing columns to tutors table
ALTER TABLE public.tutors 
ADD COLUMN IF NOT EXISTS cnic text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Pakistan',
ADD COLUMN IF NOT EXISTS teaching_mode text DEFAULT 'online',
ADD COLUMN IF NOT EXISTS school_of_teaching text,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"emailNewBooking": true, "emailSessionReminder": true, "emailPayment": true, "emailReview": true, "pushNewBooking": true, "pushSessionReminder": true, "pushMessages": true}'::jsonb;
