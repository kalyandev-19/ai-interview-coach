import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import {
  Plus, Clock, CheckCircle2, Loader2, Briefcase, FileText,
  Compass, TrendingUp, BarChart3, BookOpen, Zap, Target
} from "lucide-react";
import { format } from "date-fns";

interface Session {
  id: string;
  job_role: string;
  difficulty: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  interview_mode: string;
  question_type: string;
}

interface Stats {
  total: number;
  completed: number;
  avgClarity: number;
  avgRelevance: number;
  practiceCount: number;
  interviewCount: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, avgClarity: 0, avgRelevance: 0, practiceCount: 0, interviewCount: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessData } = await supabase
        .from("interview_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (sessData) {
        setSessions(sessData as Session[]);
        const completed = sessData.filter((s) => s.status === "completed");
        const practice = sessData.filter((s) => (s as any).interview_mode === "practice").length;
        const interview = sessData.filter((s) => (s as any).interview_mode === "interview").length;

        // Fetch scores for completed sessions
        if (completed.length > 0) {
          const { data: qData } = await supabase
            .from("interview_questions")
            .select("clarity_score, relevance_score")
            .in("session_id", completed.map((s) => s.id));

          const scored = qData?.filter((q) => q.clarity_score && q.relevance_score) || [];
          const avgC = scored.length ? scored.reduce((s, q) => s + (q.clarity_score || 0), 0) / scored.length : 0;
          const avgR = scored.length ? scored.reduce((s, q) => s + (q.relevance_score || 0), 0) / scored.length : 0;

          setStats({
            total: sessData.length,
            completed: completed.length,
            avgClarity: Math.round(avgC * 10) / 10,
            avgRelevance: Math.round(avgR * 10) / 10,
            practiceCount: practice,
            interviewCount: interview,
          });
        } else {
          setStats({ total: sessData.length, completed: 0, avgClarity: 0, avgRelevance: 0, practiceCount: practice, interviewCount: interview });
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const difficultyColor = (d: string) => {
    if (d === "basic" || d === "easy") return "bg-success/10 text-success";
    if (d === "hard") return "bg-destructive/10 text-destructive";
    return "bg-warning/10 text-warning";
  };

  const modeIcon = (mode: string) => mode === "interview" ? Zap : BookOpen;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Track your progress and keep improving.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/resume")}>
              <FileText className="mr-2 h-4 w-4" /> Resume Analyzer
            </Button>
            <Button variant="outline" onClick={() => navigate("/career-guidance")}>
              <Compass className="mr-2 h-4 w-4" /> Career Guidance
            </Button>
            <Button onClick={() => navigate("/new-interview")} className="bg-hero-gradient text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> New Interview
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BarChart3} label="Total Sessions" value={stats.total} color="text-primary" />
          <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="text-success" />
          <StatCard icon={Target} label="Avg Clarity" value={`${stats.avgClarity}/10`} color="text-primary" />
          <StatCard icon={TrendingUp} label="Avg Relevance" value={`${stats.avgRelevance}/10`} color="text-warning" />
        </div>

        {/* Mode breakdown */}
        {stats.total > 0 && (
          <div className="mb-8 flex gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2">
              <BookOpen className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">{stats.practiceCount} Practice</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2">
              <Zap className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">{stats.interviewCount} Interview</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="mb-2 font-display text-xl font-semibold text-foreground">No sessions yet</h3>
            <p className="mb-6 text-muted-foreground">Start your first interview practice to see results here.</p>
            <Button onClick={() => navigate("/new-interview")} className="bg-hero-gradient text-primary-foreground">
              Start Your First Interview
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Recent Sessions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => {
                const ModeIcon = modeIcon(s.interview_mode);
                return (
                  <div
                    key={s.id}
                    onClick={() => navigate(s.status === "completed" ? `/feedback/${s.id}` : `/interview/${s.id}`)}
                    className="cursor-pointer rounded-xl border border-border bg-card p-6 transition-all hover:shadow-elevated hover:-translate-y-0.5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-display text-lg font-semibold text-foreground">{s.job_role}</span>
                      {s.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Clock className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${difficultyColor(s.difficulty)}`}>
                        {s.difficulty}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        <ModeIcon className="h-3 w-3" />
                        {s.interview_mode === "interview" ? "Interview" : "Practice"}
                      </span>
                      {s.question_type && s.question_type !== "general" && (
                        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium capitalize text-accent-foreground">
                          {s.question_type}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(s.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
  <div className="rounded-xl border border-border bg-card p-5 shadow-card">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  </div>
);

export default Dashboard;
