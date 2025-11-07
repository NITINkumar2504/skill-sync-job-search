import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Briefcase, DollarSign, Clock, Search, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  required_skills: string[];
  created_at: string;
  description: string;
}

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkUser();
    fetchJobs();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);

    if (session?.user) {
      // Fetch saved jobs
      const { data } = await supabase
        .from("saved_jobs")
        .select("job_id")
        .eq("user_id", session.user.id);
      
      if (data) {
        setSavedJobIds(new Set(data.map(item => item.job_id)));
      }
    }
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.required_skills.some((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesLocation = locationFilter
      ? job.location.toLowerCase().includes(locationFilter.toLowerCase())
      : true;
    return matchesSearch && matchesLocation;
  });

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return "Salary not specified";
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `From $${(min / 1000).toFixed(0)}k`;
    return `Up to $${(max! / 1000).toFixed(0)}k`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const toggleSaveJob = async (jobId: string) => {
    if (!user) {
      toast.error("Please sign in to save jobs");
      return;
    }

    try {
      const isSaved = savedJobIds.has(jobId);

      if (isSaved) {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("user_id", user.id)
          .eq("job_id", jobId);

        if (error) throw error;
        
        const newSavedIds = new Set(savedJobIds);
        newSavedIds.delete(jobId);
        setSavedJobIds(newSavedIds);
        toast.success("Job removed from saved");
      } else {
        const { error } = await supabase
          .from("saved_jobs")
          .insert({ user_id: user.id, job_id: jobId });

        if (error) throw error;
        
        const newSavedIds = new Set(savedJobIds);
        newSavedIds.add(jobId);
        setSavedJobIds(newSavedIds);
        toast.success("Job saved successfully");
      }
    } catch (error: any) {
      toast.error("Failed to save job: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Your Next Opportunity</h1>
          <p className="text-muted-foreground">Explore thousands of job openings</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, company, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Listings */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No jobs found matching your criteria</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="hover:shadow-card-hover transition-all duration-300 border-2"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{job.title}</CardTitle>
                      <CardDescription className="text-lg">
                        {job.company_name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {user && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSaveJob(job.id)}
                        >
                          <Bookmark
                            className={`h-4 w-4 ${savedJobIds.has(job.id) ? "fill-primary" : ""}`}
                          />
                        </Button>
                      )}
                      <Link to={`/jobs/${job.id}`}>
                        <Button>View Details</Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.job_type}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatSalary(job.salary_min, job.salary_max)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(job.created_at)}
                      </div>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {job.required_skills.length > 5 && (
                        <Badge variant="outline">
                          +{job.required_skills.length - 5} more
                        </Badge>
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

export default Jobs;
