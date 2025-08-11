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
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary font-poppins cursor-pointer" data-testid="link-home">
                ProfileHub
              </h1>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/">
                <span 
                  className={`text-text hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                    location === "/" ? "text-primary" : ""
                  }`}
                  data-testid="link-browse"
                >
                  Browse
                </span>
              </Link>
              <a href="#" className="text-text hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-categories">
                Categories
              </a>
              <a href="#" className="text-text hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-about">
                About
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {typedUser?.isAdmin && (
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
                )}
                
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
              <>
                <Button
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-primary text-white hover:bg-primary/90"
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
                
                <Link href="/admin">
                  <Button 
                    variant="outline" 
                    className="border-secondary text-secondary hover:bg-secondary hover:text-white"
                    data-testid="button-admin"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
