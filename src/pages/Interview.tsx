import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Mic, MicOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  question_order: number;
  answer_transcript: string | null;
}

const Interview = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from("interview_questions")
        .select("id, question_text, question_order, answer_transcript")
        .eq("session_id", sessionId!)
        .order("question_order");

      if (!error && data) {
        setQuestions(data);
        // Find first unanswered question
        const firstUnanswered = data.findIndex((q) => !q.answer_transcript);
        setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : data.length - 1);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [sessionId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const submitAnswer = async () => {
    const question = questions[currentIndex];
    if (!question) return;

    setSubmitting(true);

    try {
      // Use AI to generate feedback for this answer
      const res = await supabase.functions.invoke("evaluate-answer", {
        body: {
          questionId: question.id,
          questionText: question.question_text,
          answerText: transcript || "(Audio answer submitted - using recorded response)",
        },
      });

      if (res.error) throw res.error;

      // Move to next question or finish
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setTranscript("");
        chunksRef.current = [];
      } else {
        // Mark session as completed
        await supabase
          .from("interview_sessions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", sessionId!);

        navigate(`/feedback/${sessionId}`);
      }
    } catch (e: any) {
      toast({ title: "Error submitting", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIndex];

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
          {/* Progress */}
          <div className="mb-8 flex items-center gap-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < currentIndex
                    ? "bg-success"
                    : i === currentIndex
                    ? "bg-primary"
                    : "bg-border"
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

            {/* Answer input */}
            <div className="space-y-4">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Type your answer here or use the microphone..."
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px] resize-none"
              />

              <div className="flex items-center gap-3">
                <Button
                  variant={recording ? "destructive" : "outline"}
                  size="lg"
                  onClick={recording ? stopRecording : startRecording}
                  className="flex-shrink-0"
                >
                  {recording ? (
                    <>
                      <MicOff className="mr-2 h-5 w-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Record Answer
                    </>
                  )}
                </Button>

                {recording && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                    Recording...
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                onClick={submitAnswer}
                disabled={submitting || (!transcript && chunksRef.current.length === 0)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
