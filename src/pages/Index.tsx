import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Mic, BarChart3, Target, ArrowRight, Users, Briefcase, GraduationCap } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: Mic,
    title: "Record Your Answers",
    description: "Practice with real interview questions and record your responses using your microphone.",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Feedback",
    description: "Get instant, detailed feedback on clarity, relevance, and areas for improvement.",
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    description: "Review past sessions and watch your interview skills improve over time.",
  },
  {
    icon: Target,
    title: "Role-Specific Questions",
    description: "Tailored questions for Product Managers, Developers, Leaders, and more.",
  },
];

const audiences = [
  { icon: GraduationCap, label: "Students" },
  { icon: Briefcase, label: "Professionals" },
  { icon: Users, label: "IT Teams" },
  { icon: Target, label: "Leaders" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-hero-gradient opacity-[0.03]" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <BrainCircuit className="h-4 w-4" />
              AI-Powered Interview Preparation
            </div>
            <h1 className="mb-6 font-display text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              Ace Your Next Interview with{" "}
              <span className="text-gradient">AI Coaching</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Practice with realistic questions, record your answers, and receive instant AI feedback
              on clarity, relevance, and delivery. Built for every career stage.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-hero-gradient text-primary-foreground px-8 text-base" onClick={() => navigate("/auth")}>
                Start Practicing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-base" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </div>
          </div>

          {/* Audience badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
            <span className="text-sm text-muted-foreground">Built for:</span>
            {audiences.map((a) => (
              <div key={a.label} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-card">
                <a.icon className="h-4 w-4 text-primary" />
                {a.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center font-display text-3xl font-bold text-foreground">
            Everything You Need to Prepare
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            A complete toolkit to help you feel confident and ready.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-background p-6 transition-all hover:shadow-elevated hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl bg-hero-gradient p-12 text-center shadow-elevated">
            <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground">
              Ready to Land Your Dream Job?
            </h2>
            <p className="mb-8 text-primary-foreground/80">
              Start practicing now and get personalized AI feedback in minutes.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-base font-semibold"
              onClick={() => navigate("/auth")}
            >
              Get Started — It's Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 AI Interview Coach. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
