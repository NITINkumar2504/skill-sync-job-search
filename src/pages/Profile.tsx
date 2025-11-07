import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  role: "job_seeker" | "recruiter" | "admin";
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  company_name: string | null;
  skills: string[] | null;
  experience_years: number | null;
  resume_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
    } catch (error: any) {
      toast.error("Failed to load profile");
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile || !user) return;

    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        full_name: formData.get("full_name") as string,
        phone: formData.get("phone") as string,
        location: formData.get("location") as string,
        bio: formData.get("bio") as string,
        company_name: profile.role === "recruiter" ? formData.get("company_name") as string : null,
        experience_years: profile.role === "job_seeker" ? parseInt(formData.get("experience_years") as string) || null : null,
        skills: profile.skills,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      setProfile({ ...profile, ...updates });
    } catch (error: any) {
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/resume.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile!, resume_url: publicUrl });
      toast.success("Resume uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload resume: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    if (!skillInput.trim() || !profile) return;
    const currentSkills = profile.skills || [];
    if (currentSkills.includes(skillInput.trim())) {
      toast.error("Skill already added");
      return;
    }
    const newSkills = [...currentSkills, skillInput.trim()];
    setProfile({ ...profile, skills: newSkills });
    setSkillInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    if (!profile) return;
    const newSkills = (profile.skills || []).filter(skill => skill !== skillToRemove);
    setProfile({ ...profile, skills: newSkills });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile.full_name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={profile.location || ""}
                />
              </div>

              {profile.role === "recruiter" && (
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    defaultValue={profile.company_name || ""}
                  />
                </div>
              )}

              {profile.role === "job_seeker" && (
                <div className="space-y-2">
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    name="experience_years"
                    type="number"
                    min="0"
                    defaultValue={profile.experience_years || ""}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={profile.bio || ""}
                  placeholder={profile.role === "recruiter" 
                    ? "Tell us about your company..." 
                    : "Tell us about yourself..."}
                />
              </div>

              {profile.role === "job_seeker" && (
                <>
                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Add a skill"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" onClick={addSkill}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(profile.skills || []).map((skill, index) => (
                        <div
                          key={index}
                          className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("resume")?.click()}
                        disabled={uploading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload Resume"}
                      </Button>
                      {profile.resume_url && (
                        <a
                          href={profile.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          View Current Resume
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default Profile;
