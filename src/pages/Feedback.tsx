import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Star, Lightbulb, MessageSquare, Target } from "lucide-react";

interface QuestionFeedback {
  id: string;
  question_text: string;
  question_order: number;
  answer_transcript: string | null;
  clarity_score: number | null;
  relevance_score: number | null;
  improvement_tips: string | null;
}

const ScoreBar = ({ label, score, icon: Icon }: { label: string; score: number; icon: any }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 font-medium text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </span>
      <span className="font-semibold text-foreground">{score}/10</span>
    </div>
    <div className="h-2.5 rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-hero-gradient transition-all duration-500"
        style={{ width: `${score * 10}%` }}
      />
    </div>
  </div>
);

const Feedback = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<{ job_role: string; difficulty: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [sessRes, qRes] = await Promise.all([
        supabase.from("interview_sessions").select("job_role, difficulty").eq("id", sessionId!).maybeSingle(),
        supabase
          .from("interview_questions")
          .select("*")
          .eq("session_id", sessionId!)
          .order("question_order"),
      ]);

      if (sessRes.data) setSessionInfo(sessRes.data);
      if (qRes.data) setQuestions(qRes.data);
      setLoading(false);
    };
    fetchData();
  }, [sessionId]);

  const avgClarity = questions.length
    ? Math.round(questions.reduce((s, q) => s + (q.clarity_score || 0), 0) / questions.length * 10) / 10
    : 0;
  const avgRelevance = questions.length
    ? Math.round(questions.reduce((s, q) => s + (q.relevance_score || 0), 0) / questions.length * 10) / 10
    : 0;

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
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Interview Feedback</h1>
          {sessionInfo && (
            <p className="mt-1 text-muted-foreground">
              {sessionInfo.job_role} · <span className="capitalize">{sessionInfo.difficulty}</span>
            </p>
          )}
        </div>

        {/* Summary card */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Overall Scores</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <ScoreBar label="Clarity" score={avgClarity} icon={MessageSquare} />
            <ScoreBar label="Relevance" score={avgRelevance} icon={Target} />
          </div>
        </div>

        {/* Per-question feedback */}
        <div className="space-y-6">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-accent-foreground">
                  {q.question_order}
                </div>
                <h3 className="font-display text-base font-semibold text-foreground leading-relaxed">
                  {q.question_text}
                </h3>
              </div>

              {q.answer_transcript && (
                <div className="mb-4 rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">{q.answer_transcript}</p>
                </div>
              )}

              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <ScoreBar label="Clarity" score={q.clarity_score || 0} icon={MessageSquare} />
                <ScoreBar label="Relevance" score={q.relevance_score || 0} icon={Target} />
              </div>

              {q.improvement_tips && (
                <div className="rounded-lg border border-primary/10 bg-accent p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-accent-foreground">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Improvement Tips
                  </div>
                  <p className="text-sm text-muted-foreground">{q.improvement_tips}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate("/new-interview")} className="bg-hero-gradient text-primary-foreground">
            <Star className="mr-2 h-4 w-4" />
            Start Another Interview
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
