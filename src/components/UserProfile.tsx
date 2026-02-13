import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Briefcase, Phone, FileText, Loader2, Pencil, X, Check } from "lucide-react";

interface Profile {
  full_name: string | null;
  email: string | null;
  job_title: string | null;
  phone: string | null;
  bio: string | null;
}

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({
    full_name: null,
    email: null,
    job_title: null,
    phone: null,
    bio: null,
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Profile>({ ...profile });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, job_title, phone, bio")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        setForm(data);
      } else if (!data) {
        // If no profile exists, create one for the user
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
          })
          .select()
          .single();
        
        if (newProfile) {
          setProfile(newProfile);
          setForm(newProfile);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        email: form.email,
        job_title: form.job_title,
        phone: form.phone,
        bio: form.bio,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile({ ...form });
      setEditing(false);
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm({ ...profile });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">My Profile</h2>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-hero-gradient text-primary-foreground">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3.5 w-3.5" /> Full Name
          </Label>
          {editing ? (
            <Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your name" />
          ) : (
            <p className="text-sm font-medium text-foreground">{profile.full_name || "—"}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> Email
          </Label>
          {editing ? (
            <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          ) : (
            <p className="text-sm font-medium text-foreground">{profile.email || "—"}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" /> Job Title
          </Label>
          {editing ? (
            <Input value={form.job_title || ""} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="e.g. Software Engineer" />
          ) : (
            <p className="text-sm font-medium text-foreground">{profile.job_title || "—"}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> Phone
          </Label>
          {editing ? (
            <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" />
          ) : (
            <p className="text-sm font-medium text-foreground">{profile.phone || "—"}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> Bio
          </Label>
          {editing ? (
            <Textarea value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A short bio about yourself" rows={3} />
          ) : (
            <p className="text-sm font-medium text-foreground">{profile.bio || "—"}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
