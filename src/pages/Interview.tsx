import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AudioRecorder from "@/components/AudioRecorder";
import { ArrowRight, Loader2, CheckCircle2, Clock, Lightbulb, Eye, EyeOff } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  question_order: number;
  answer_transcript: string | null;
}

interface SessionInfo {
  interview_mode: string;
  job_role: string;
  difficulty: string;
  question_type: string;
}

const Interview = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [questionFeedback, setQuestionFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [sessRes, qRes] = await Promise.all([
        supabase.from("interview_sessions").select("interview_mode, job_role, difficulty, question_type").eq("id", sessionId!).maybeSingle(),
        supabase.from("interview_questions").select("id, question_text, question_order, answer_transcript").eq("session_id", sessionId!).order("question_order"),
      ]);
      if (sessRes.data) setSessionInfo(sessRes.data as SessionInfo);
      if (!qRes.error && qRes.data) {
        setQuestions(qRes.data);
        const first = qRes.data.findIndex((q) => !q.answer_transcript);
        setCurrentIndex(first >= 0 ? first : qRes.data.length - 1);
      }
      setLoading(false);
    };
    fetchData();
  }, [sessionId]);

  // Timer for interview mode
  useEffect(() => {
    if (sessionInfo?.interview_mode !== "interview") return;
    setTimeLeft(180); // 3 minutes per question
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, sessionInfo?.interview_mode]);

  const handleTranscript = useCallback((text: string) => {
    setTranscript((prev) => (prev ? prev + " " + text : text));
  }, []);

  const isPractice = sessionInfo?.interview_mode === "practice";

  const submitAnswer = async () => {
    const question = questions[currentIndex];
    if (!question) return;
    setSubmitting(true);
    setQuestionFeedback(null);

    try {
      const res = await supabase.functions.invoke("evaluate-answer", {
        body: {
          questionId: question.id,
          questionText: question.question_text,
          answerText: transcript || "(No answer provided)",
        },
      });
      if (res.error) throw res.error;

      // In practice mode, show feedback before moving on
      if (isPractice && res.data?.improvement_tips) {
        setQuestionFeedback(res.data.improvement_tips);
        // Don't auto-advance in practice mode — user clicks next
      }

      if (!isPractice || !res.data?.improvement_tips) {
        advanceQuestion();
      }
    } catch (e: any) {
      toast({ title: "Error submitting", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const advanceQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTranscript("");
      setQuestionFeedback(null);
      setShowHint(false);
    } else {
      await supabase
        .from("interview_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sessionId!);
      navigate(`/feedback/${sessionId}`);
    }
  };

  const currentQuestion = questions[currentIndex];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          {/* Header with mode badge */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isPractice ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}>
                {isPractice ? "Practice Mode" : "Interview Mode"}
              </span>
              {sessionInfo && (
                <span className="text-sm text-muted-foreground">
                  {sessionInfo.job_role} · <span className="capitalize">{sessionInfo.difficulty}</span>
                </span>
              )}
            </div>
            {!isPractice && timeLeft !== null && (
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-semibold ${
                timeLeft < 30 ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
              }`}>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mb-8 flex items-center gap-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < currentIndex ? "bg-success" : i === currentIndex ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>

          <div className="mb-2 text-sm font-medium text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </div>

          {/* Question card */}
          <div className="rounded-xl border border-border bg-card p-8 shadow-card">
            <h2 className="mb-8 font-display text-2xl font-bold leading-relaxed text-foreground">
              {currentQuestion?.question_text}
            </h2>

            {/* Practice mode hint */}
            {isPractice && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                  className="text-muted-foreground"
                >
                  {showHint ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
                {showHint && (
                  <div className="mt-2 rounded-lg border border-primary/10 bg-accent p-3">
                    <p className="text-sm text-muted-foreground">
                      <Lightbulb className="mb-0.5 mr-1 inline h-4 w-4 text-primary" />
                      Tip: Structure your answer clearly. Start with context, explain your approach, and highlight the outcome.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Answer input */}
            <div className="space-y-4">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Type your answer here or use the microphone..."
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px] resize-none"
              />

              <AudioRecorder onTranscript={handleTranscript} disabled={submitting} />
            </div>

            {/* Practice mode feedback */}
            {questionFeedback && isPractice && (
              <div className="mt-4 rounded-lg border border-primary/10 bg-accent p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-accent-foreground">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Feedback
                </div>
                <p className="text-sm text-muted-foreground">{questionFeedback}</p>
                <Button onClick={advanceQuestion} className="mt-3 bg-hero-gradient text-primary-foreground" size="sm">
                  {currentIndex < questions.length - 1 ? (
                    <><ArrowRight className="mr-2 h-4 w-4" /> Next Question</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" /> View Results</>
                  )}
                </Button>
              </div>
            )}

            {!questionFeedback && (
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={submitAnswer}
                  disabled={submitting || !transcript}
                  className="bg-hero-gradient text-primary-foreground"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : currentIndex < questions.length - 1 ? (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {currentIndex < questions.length - 1 ? "Submit & Next" : "Finish Interview"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
