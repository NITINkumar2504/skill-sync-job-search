import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { ArrowRight, Briefcase, Users, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient opacity-10"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI-Powered Job Matching</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Find Your Dream Job with{" "}
                <span className="bg-hero-gradient bg-clip-text text-transparent">
                  Smart Matching
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Connect with top employers and opportunities tailored to your skills. 
                Let AI guide your career journey.
              </p>
              <div className="flex gap-4">
                <Link to="/auth">
                  <Button size="lg" className="group">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/jobs">
                  <Button size="lg" variant="outline">
                    Browse Jobs
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-hero-gradient opacity-20 blur-3xl"></div>
              <img
                src={heroImage}
                alt="Professional team collaboration"
                className="rounded-2xl shadow-2xl relative z-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose SkillSync?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the future of recruitment with our intelligent platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:shadow-card-hover transition-all duration-300 hover:scale-105">
              <CardContent className="pt-6">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
                <p className="text-muted-foreground">
                  Advanced algorithms match your skills with perfect opportunities
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:shadow-card-hover transition-all duration-300 hover:scale-105">
              <CardContent className="pt-6">
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Top Employers</h3>
                <p className="text-muted-foreground">
                  Connect with leading companies across industries
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:shadow-card-hover transition-all duration-300 hover:scale-105">
              <CardContent className="pt-6">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Career Growth</h3>
                <p className="text-muted-foreground">
                  Track applications and get insights to advance your career
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-hero-gradient text-primary-foreground overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6TTI2IDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDEwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0tMTAtMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
            <CardContent className="pt-12 pb-12 relative z-10">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <h2 className="text-3xl font-bold">Ready to Transform Your Career?</h2>
                <p className="text-lg opacity-90">
                  Join thousands of professionals who found their dream jobs through SkillSync
                </p>
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="group">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <span className="font-semibold">SkillSync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SkillSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
