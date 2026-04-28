-- Drop overly permissive SELECT policies on chat-files bucket
DROP POLICY IF EXISTS "chat_files_select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view chat files" ON storage.objects;

-- Create restrictive SELECT policy: user must be uploader OR share a conversation with uploader
CREATE POLICY "Conversation participants can view chat files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND (
    -- Uploader (file path starts with their user_id)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Shares a conversation with the uploader
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (
        (c.student_user_id = auth.uid() AND c.tutor_user_id::text = (storage.foldername(name))[1])
        OR
        (c.tutor_user_id = auth.uid() AND c.student_user_id::text = (storage.foldername(name))[1])
      )
    )
  )
);