import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { ArrowRight, Loader2, BookOpen, Zap } from "lucide-react";

const jobRoles = [
  "Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer",
  "Product Manager",
  "Data Scientist",
  "Data Analyst",
  "Data Engineer",
  "Machine Learning Engineer",
  "UX Designer",
  "UI Designer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Site Reliability Engineer",
  "Engineering Manager",
  "Technical Lead",
  "Business Analyst",
  "QA Engineer",
  "Cybersecurity Analyst",
  "Systems Administrator",
  "Database Administrator",
  "Blockchain Developer",
  "AI/ML Researcher",
  "Technical Writer",
  "Scrum Master",
  "Project Manager",
  "Solutions Architect",
  "Sales Engineer",
  "Customer Success Manager",
];

const difficulties = [
  { value: "basic", label: "Basic", description: "Entry-level & freshers" },
  { value: "medium", label: "Medium", description: "Mid-level professionals" },
  { value: "hard", label: "Hard", description: "Senior & expert level" },
];

const questionTypes = [
  { value: "general", label: "General", description: "Mixed technical & soft skills" },
  { value: "behavioral", label: "Behavioral", description: "STAR method, past experiences" },
  { value: "hr", label: "HR Interview", description: "Culture fit, salary, teamwork" },
  { value: "technical", label: "Technical", description: "Deep technical knowledge" },
];

const interviewModes = [
  { value: "practice", label: "Practice Mode", icon: BookOpen, description: "Relaxed with hints & feedback per question" },
  { value: "interview", label: "Interview Mode", icon: Zap, description: "Timed, no hints, realistic simulation" },
];

const NewInterview = () => {
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("general");
  const [mode, setMode] = useState("practice");
  const [loading, setLoading] = useState(false);
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadResumeData = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("resumes")
        .select("skills")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.skills) setResumeSkills(data.skills);
    };
    loadResumeData();
  }, [user]);

  const handleStart = async () => {
    if (!jobRole || !difficulty) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("interview_sessions")
      .insert({
        user_id: user!.id,
        job_role: jobRole,
        difficulty,
        interview_mode: mode,
        question_type: questionType,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating session", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      const res = await supabase.functions.invoke("generate-questions", {
        body: {
          sessionId: data.id,
          jobRole,
          difficulty,
          questionType,
          interviewMode: mode,
          resumeSkills: resumeSkills.length > 0 ? resumeSkills : undefined,
        },
      });
      if (res.error) throw res.error;
    } catch (e: any) {
      toast({ title: "Error generating questions", description: e.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    navigate(`/interview/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">New Interview</h1>
          <p className="mb-8 text-muted-foreground">Configure your practice session.</p>

          {resumeSkills.length > 0 && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-accent/50 p-4">
              <p className="mb-2 text-sm font-medium text-accent-foreground">
                📄 Resume detected — questions will be personalized to your skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {resumeSkills.slice(0, 8).map((s) => (
                  <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{s}</span>
                ))}
                {resumeSkills.length > 8 && <span className="text-xs text-muted-foreground">+{resumeSkills.length - 8} more</span>}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
            {/* Interview Mode */}
            <div className="space-y-3">
              <Label>Interview Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                {interviewModes.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      mode === m.value
                        ? "border-primary bg-accent shadow-sm"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <m.icon className={`mb-2 h-5 w-5 ${mode === m.value ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-display text-sm font-semibold text-foreground">{m.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Job Role */}
            <div className="space-y-2">
              <Label>Job Role</Label>
              <Select value={jobRole} onValueChange={setJobRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job role" />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Type */}
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div>
                        <span className="font-medium">{t.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">— {t.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`rounded-lg border-2 p-3 text-center transition-all ${
                      difficulty === d.value
                        ? "border-primary bg-accent shadow-sm"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="font-display text-sm font-semibold text-foreground">{d.label}</p>
                    <p className="text-xs text-muted-foreground">{d.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleStart} disabled={loading} className="w-full bg-hero-gradient text-primary-foreground">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Start {mode === "interview" ? "Interview" : "Practice"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInterview;
