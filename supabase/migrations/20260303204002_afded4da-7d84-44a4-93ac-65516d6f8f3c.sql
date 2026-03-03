
-- Create conversations table
CREATE TABLE public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id uuid NOT NULL,
    tutor_user_id uuid NOT NULL,
    last_message text,
    last_message_at timestamp with time zone DEFAULT now(),
    student_unread_count integer DEFAULT 0,
    tutor_unread_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (student_user_id, tutor_user_id)
);

-- Create messages table
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL,
    content text,
    file_url text,
    file_name text,
    file_type text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: users can see their own conversations
CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = student_user_id OR auth.uid() = tutor_user_id);

CREATE POLICY "Users can insert conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_user_id OR auth.uid() = tutor_user_id);

CREATE POLICY "Users can update own conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (auth.uid() = student_user_id OR auth.uid() = tutor_user_id);

-- Messages RLS: users can see messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND (c.student_user_id = auth.uid() OR c.tutor_user_id = auth.uid())
    )
);

CREATE POLICY "Users can insert messages in own conversations"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND (c.student_user_id = auth.uid() OR c.tutor_user_id = auth.uid())
    )
);

CREATE POLICY "Users can update messages in own conversations"
ON public.messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND (c.student_user_id = auth.uid() OR c.tutor_user_id = auth.uid())
    )
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create chat-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-files',
    'chat-files',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage RLS for chat-files
CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can view chat files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-files');
