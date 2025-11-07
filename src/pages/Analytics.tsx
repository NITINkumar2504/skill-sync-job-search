import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Briefcase, Users, TrendingUp, CheckCircle, Clock, XCircle } from "lucide-react";

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    appliedCount: 0,
    reviewingCount: 0,
    interviewCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
  });

  useEffect(() => {
    checkUserAndFetchAnalytics();
  }, []);

  const checkUserAndFetchAnalytics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "recruiter") {
        toast.error("Only recruiters can access this page");
        navigate("/dashboard");
        return;
      }

      await fetchAnalytics(session.user.id);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (userId) => {
    try {
      // Fetch jobs stats
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, status")
        .eq("recruiter_id", userId);

      const totalJobs = jobs?.length || 0;
      const activeJobs = jobs?.filter((job) => job.status === "open").length || 0;

      // Fetch applications stats
      const { data: applications } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          jobs!inner(recruiter_id)
        `)
        .eq("jobs.recruiter_id", userId);

      const totalApplications = applications?.length || 0;
      const appliedCount = applications?.filter((app) => app.status === "applied").length || 0;
      const reviewingCount = applications?.filter((app) => app.status === "shortlisted").length || 0;
      const interviewCount = applications?.filter((app) => app.status === "viewed").length || 0;
      const acceptedCount = applications?.filter((app) => app.status === "hired").length || 0;
      const rejectedCount = applications?.filter((app) => app.status === "rejected").length || 0;

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
        appliedCount,
        reviewingCount,
        interviewCount,
        acceptedCount,
        rejectedCount,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch analytics");
    }
  };

  const calculateSuccessRate = () => {
    if (stats.totalApplications === 0) return 0;
    return ((stats.acceptedCount / stats.totalApplications) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Track your hiring performance and metrics
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeJobs} currently active
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all job postings
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateSuccessRate()}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.acceptedCount} accepted applications
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.appliedCount + stats.reviewingCount + stats.interviewCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Applications to review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Status Breakdown */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Application Status Breakdown</CardTitle>
            <CardDescription>
              Distribution of applications across different stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">Applied</span>
                </div>
                <span className="text-2xl font-bold">{stats.appliedCount}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">Shortlisted</span>
                </div>
                <span className="text-2xl font-bold">{stats.reviewingCount}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-medium">Viewed</span>
                </div>
                <span className="text-2xl font-bold">{stats.interviewCount}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span className="font-medium">Hired</span>
                </div>
                <span className="text-2xl font-bold text-accent">{stats.acceptedCount}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="font-medium">Rejected</span>
                </div>
                <span className="text-2xl font-bold text-destructive">{stats.rejectedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
