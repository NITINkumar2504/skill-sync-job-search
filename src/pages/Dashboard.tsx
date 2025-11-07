import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Briefcase, FileText, TrendingUp, Users } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Profile {
  role: "job_seeker" | "recruiter" | "admin";
  full_name: string;
  email: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [totalApplicants, setTotalApplicants] = useState(0);

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
        .select("role, full_name, email")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);

      // Fetch statistics based on role
      if (profileData.role === "job_seeker") {
        // Get applications count
        const { count: appsCount } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("applicant_id", session.user.id);
        setApplicationsCount(appsCount || 0);

        // Get saved jobs count
        const { count: savedCount } = await supabase
          .from("saved_jobs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        setSavedJobsCount(savedCount || 0);
      } else if (profileData.role === "recruiter") {
        // Get active jobs count
        const { count: jobsCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("recruiter_id", session.user.id)
          .eq("status", "open");
        setActiveJobsCount(jobsCount || 0);

        // Get total applicants count
        const { data: recruiterJobs } = await supabase
          .from("jobs")
          .select("id")
          .eq("recruiter_id", session.user.id);

        if (recruiterJobs && recruiterJobs.length > 0) {
          const jobIds = recruiterJobs.map(job => job.id);
          const { count: applicantsCount } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .in("job_id", jobIds);
          setTotalApplicants(applicantsCount || 0);
        }
      }
    } catch (error: any) {
      toast.error("Failed to load profile");
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {profile?.full_name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            {profile?.role === "recruiter"
              ? "Manage your job postings and candidates"
              : "Track your applications and discover new opportunities"}
          </p>
        </div>

        {profile?.role === "job_seeker" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-card-hover transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Applications</CardTitle>
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">{applicationsCount}</p>
                <CardDescription>Total applications submitted</CardDescription>
                <Button className="w-full mt-4" onClick={() => navigate("/jobs")}>
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-card-hover transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile Strength</CardTitle>
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">60%</p>
                <CardDescription>Complete your profile to increase visibility</CardDescription>
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/profile")}>
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-card-hover transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Saved Jobs</CardTitle>
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">{savedJobsCount}</p>
                <CardDescription>Jobs you've bookmarked</CardDescription>
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/jobs")}>
                  Explore Jobs
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-card-hover transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Jobs</CardTitle>
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">{activeJobsCount}</p>
                <CardDescription>Currently open positions</CardDescription>
                <Button className="w-full mt-4" onClick={() => navigate("/post-job")}>
                  Post New Job
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-card-hover transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Total Applicants</CardTitle>
                  <Users className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">{totalApplicants}</p>
                <CardDescription>Applications received this month</CardDescription>
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/applicants")}>
                  View Applicants
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-card-hover transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Success Rate</CardTitle>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">--</p>
                <CardDescription>Successful hires this quarter</CardDescription>
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/analytics")}>
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity Section */}
        <Card className="mt-8 border-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              No recent activity to display
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
