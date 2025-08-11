import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Settings, LogOut, Shield } from "lucide-react";
import { User as UserType } from "@shared/schema";

export default function Navigation() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  
  const typedUser = user as UserType;

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">♥</span>
              </div>
              <span className="text-foreground text-xl font-bold font-poppins gradient-text">CreatorHub</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <Link href="/">
                <span 
                  className={`text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                    location === "/" ? "text-primary" : ""
                  }`}
                  data-testid="link-browse"
                >
                  Models
                </span>
              </Link>
              <a href="#" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-categories">
                Categories
              </a>
              <a href="#" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-premium">
                VIP Access
              </a>
              <a href="#" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-cam">
                Live Shows
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="sm" 
                className={`border-primary text-primary hover:bg-primary hover:text-white ${
                  location === "/dashboard" ? "bg-primary text-white" : ""
                }`}
                data-testid="link-dashboard"
              >
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            
            <Link href="/admin">
              <Button 
                variant="outline" 
                size="sm" 
                className={`border-secondary text-secondary hover:bg-secondary hover:text-white ${
                  location === "/admin" ? "bg-secondary text-white" : ""
                }`}
                data-testid="link-admin"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  {typedUser?.profileImageUrl && (
                    <img
                      src={typedUser.profileImageUrl}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                      data-testid="img-user-avatar"
                    />
                  )}
                  <span className="text-text text-sm font-medium" data-testid="text-user-name">
                    {typedUser?.firstName || typedUser?.email}
                  </span>
                </div>
                
                <Button
                  onClick={() => window.location.href = "/api/logout"}
                  variant="ghost"
                  size="sm"
                  className="text-text hover:text-primary"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = "/api/login"}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white"
                data-testid="button-signin"
              >
                Join Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
