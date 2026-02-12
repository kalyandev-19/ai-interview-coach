
-- Create interview_sessions table
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_role TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for interview_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create interview_questions table
CREATE TABLE public.interview_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL DEFAULT 1,
  answer_transcript TEXT,
  audio_url TEXT,
  clarity_score NUMERIC,
  relevance_score NUMERIC,
  improvement_tips TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for interview_questions
CREATE POLICY "Users can view questions for their sessions"
  ON public.interview_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.interview_sessions
    WHERE id = interview_questions.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert questions"
  ON public.interview_questions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update questions"
  ON public.interview_questions FOR UPDATE
  USING (true);
