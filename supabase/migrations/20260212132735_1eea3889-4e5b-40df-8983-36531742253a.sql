
-- Drop overly permissive policies
DROP POLICY "Service role can insert questions" ON public.interview_questions;
DROP POLICY "Service role can update questions" ON public.interview_questions;

-- Insert: allow if user owns the session
CREATE POLICY "Users can insert questions for their sessions"
  ON public.interview_questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.interview_sessions
    WHERE id = interview_questions.session_id AND user_id = auth.uid()
  ));

-- Update: allow if user owns the session
CREATE POLICY "Users can update questions for their sessions"
  ON public.interview_questions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.interview_sessions
    WHERE id = interview_questions.session_id AND user_id = auth.uid()
  ));
