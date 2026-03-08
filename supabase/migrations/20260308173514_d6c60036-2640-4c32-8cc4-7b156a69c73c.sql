
-- Drop existing storage policies to recreate with proper security
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view demo videos" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can upload own demo videos" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can update own demo videos" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can delete own demo videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view demo thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can upload own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can update own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can delete own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat files in own conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat files to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public avatar reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated avatar deletes" ON storage.objects;

-- 1. AVATARS BUCKET
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. DEMO-VIDEOS BUCKET
CREATE POLICY "demo_videos_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'demo-videos');
CREATE POLICY "demo_videos_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'demo-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "demo_videos_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'demo-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "demo_videos_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'demo-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. DEMO-THUMBNAILS BUCKET
CREATE POLICY "demo_thumbnails_select" ON storage.objects FOR SELECT USING (bucket_id = 'demo-thumbnails');
CREATE POLICY "demo_thumbnails_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'demo-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "demo_thumbnails_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'demo-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "demo_thumbnails_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'demo-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. CHAT-FILES BUCKET
CREATE POLICY "chat_files_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chat-files');
CREATE POLICY "chat_files_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "chat_files_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. File size limits
UPDATE storage.buckets SET file_size_limit = 5242880 WHERE id = 'avatars';
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'chat-files';
UPDATE storage.buckets SET file_size_limit = 104857600 WHERE id = 'demo-videos';
UPDATE storage.buckets SET file_size_limit = 2097152 WHERE id = 'demo-thumbnails';

-- 6. Allowed MIME types
UPDATE storage.buckets SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'] WHERE id = 'avatars';
UPDATE storage.buckets SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'] WHERE id = 'demo-thumbnails';
UPDATE storage.buckets SET allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime'] WHERE id = 'demo-videos';
UPDATE storage.buckets SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] WHERE id = 'chat-files';
