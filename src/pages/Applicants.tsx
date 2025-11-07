import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, FileText, Calendar, Briefcase } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Applicants = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    checkUserAndFetchApplications();
  }, []);

  const checkUserAndFetchApplications = async () => {
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

      await fetchApplications(session.user.id);
    } catch (error) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (userId) => {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        jobs!inner(
          id,
          title,
          company_name,
          recruiter_id
        ),
        profiles!applications_applicant_id_fkey(
          full_name,
          email,
          phone
        )
      `)
      .eq("jobs.recruiter_id", userId)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to fetch applications");
    } else {
      setApplications(data || []);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      toast.success("Application status updated");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchApplications(session.user.id);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (filterStatus === "all") return true;
    return app.status === filterStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      applied: "default",
      shortlisted: "secondary",
      viewed: "default",
      hired: "default",
      rejected: "destructive",
    };
    return colors[status] || "default";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Loading applicants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Applicants</h1>
            <p className="text-muted-foreground">
              Manage applications for your job postings
            </p>
          </div>
          <div className="w-48">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                No applications found
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="border-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">
                        {application.profiles?.full_name || "Unknown Applicant"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {application.jobs?.title} at {application.jobs?.company_name}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {application.profiles?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {application.profiles.email}
                        </div>
                      )}
                      {application.profiles?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {application.profiles.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Applied {formatDate(application.applied_at)}
                      </div>
                    </div>

                    {application.cover_letter && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Cover Letter
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {application.cover_letter}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <Select
                        value={application.status}
                        onValueChange={(value) => updateApplicationStatus(application.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="viewed">Viewed</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      {application.resume_url && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(application.resume_url, "_blank")}
                        >
                          View Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applicants;
