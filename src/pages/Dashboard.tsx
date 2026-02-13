import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Plus, Clock, CheckCircle2, Loader2, Briefcase } from "lucide-react";
import { format } from "date-fns";
import UserProfile from "@/components/UserProfile";

interface Session {
  id: string;
  job_role: string;
  difficulty: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setSessions(data);
      setLoading(false);
    };
    fetchSessions();
  }, []);

  const difficultyColor = (d: string) => {
    if (d === "easy") return "bg-success/10 text-success";
    if (d === "hard") return "bg-destructive/10 text-destructive";
    return "bg-warning/10 text-warning";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Welcome back! Ready to practice?</p>
          </div>
          <Button onClick={() => navigate("/new-interview")} className="bg-hero-gradient text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            New Interview
          </Button>
        </div>

        <div className="mb-8">
          <UserProfile />
        </div>

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() =>
                  navigate(s.status === "completed" ? `/feedback/${s.id}` : `/interview/${s.id}`)
                }
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
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${difficultyColor(s.difficulty)}`}>
                    {s.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(s.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
