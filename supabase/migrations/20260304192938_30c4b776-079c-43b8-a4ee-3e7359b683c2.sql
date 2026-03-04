
CREATE INDEX IF NOT EXISTS idx_conversations_student_user_id ON public.conversations(student_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tutor_user_id ON public.conversations(tutor_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_tutors_verified ON public.tutors(verified, profile_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
