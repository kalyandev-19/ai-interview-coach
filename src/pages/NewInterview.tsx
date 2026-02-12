import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { ArrowRight, Loader2 } from "lucide-react";

const jobRoles = [
  "Software Developer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "DevOps Engineer",
  "Engineering Manager",
  "Business Analyst",
  "QA Engineer",
];

const difficulties = ["easy", "medium", "hard"];

const NewInterview = () => {
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStart = async () => {
    if (!jobRole || !difficulty) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("interview_sessions")
      .insert({ user_id: user!.id, job_role: jobRole, difficulty })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating session", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Generate questions via edge function
    try {
      const res = await supabase.functions.invoke("generate-questions", {
        body: { sessionId: data.id, jobRole, difficulty },
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
        <div className="mx-auto max-w-lg">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">New Interview</h1>
          <p className="mb-8 text-muted-foreground">Configure your practice session.</p>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
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

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((d) => (
                    <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleStart} disabled={loading} className="w-full bg-hero-gradient text-primary-foreground">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Start Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInterview;
