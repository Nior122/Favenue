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
    <nav className="bg-black border-b border-green-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">♥</span>
              </div>
              <span className="text-green-400 text-lg sm:text-xl font-bold">CreatorHub</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <Link href="/">
                <span 
                  className={`text-green-300 hover:text-green-100 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                    location === "/" ? "text-green-100" : ""
                  }`}
                  data-testid="link-browse"
                >
                  Models
                </span>
              </Link>
              <a href="#" className="text-green-300 hover:text-green-100 px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-categories">
                Categories
              </a>
              <a href="#" className="text-green-300 hover:text-green-100 px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-premium">
                VIP Access
              </a>
              <a href="#" className="text-green-300 hover:text-green-100 px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-cam">
                Live Shows
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="sm" 
                className={`border-green-600 text-green-300 hover:bg-green-900 hover:text-green-100 text-xs sm:text-sm ${
                  location === "/dashboard" ? "bg-green-600 text-white border-green-500" : ""
                }`}
                data-testid="link-dashboard"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            
            {isAuthenticated && typedUser?.isAdmin && (
              <Link href="/admin">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`border-green-600 text-green-300 hover:bg-green-900 hover:text-green-100 text-xs sm:text-sm ${
                    location === "/admin" ? "bg-green-600 text-white border-green-500" : ""
                  }`}
                  data-testid="link-admin"
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center space-x-2">
                  {typedUser?.profileImageUrl && (
                    <img
                      src={typedUser.profileImageUrl}
                      alt="Profile"
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                      data-testid="img-user-avatar"
                    />
                  )}
                  <span className="text-green-300 text-xs sm:text-sm font-medium truncate max-w-24 sm:max-w-none" data-testid="text-user-name">
                    {typedUser?.firstName || typedUser?.email}
                  </span>
                </div>
                
                <Button
                  onClick={() => window.location.href = "/api/logout"}
                  variant="ghost"
                  size="sm"
                  className="text-green-300 hover:text-green-100 text-xs sm:text-sm"
                  data-testid="button-logout"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = "/api/login"}
                className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white text-xs sm:text-sm"
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
