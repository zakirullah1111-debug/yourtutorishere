
-- Add demo video columns to tutors table
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS demo_video_type text DEFAULT NULL;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS demo_video_url text DEFAULT NULL;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS demo_video_title text DEFAULT NULL;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS demo_video_thumbnail text DEFAULT NULL;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS demo_video_duration text DEFAULT NULL;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS live_demo_enabled boolean DEFAULT false;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS live_demo_price numeric DEFAULT NULL;

-- Create demo-videos bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('demo-videos', 'demo-videos', false, 104857600, ARRAY['video/mp4', 'video/quicktime', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Create demo-thumbnails bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('demo-thumbnails', 'demo-thumbnails', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for demo-videos bucket
CREATE POLICY "Authenticated users can upload own demo videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'demo-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can view demo videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'demo-videos');

CREATE POLICY "Users can delete own demo videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'demo-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for demo-thumbnails bucket
CREATE POLICY "Authenticated users can upload own demo thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'demo-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view demo thumbnails"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'demo-thumbnails');

CREATE POLICY "Users can delete own demo thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'demo-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
