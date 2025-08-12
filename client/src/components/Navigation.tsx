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
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">♥</span>
              </div>
              <span className="text-white text-xl font-bold">CreatorHub</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <Link href="/">
                <span 
                  className={`text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                    location === "/" ? "text-white" : ""
                  }`}
                  data-testid="link-browse"
                >
                  Models
                </span>
              </Link>
              <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-categories">
                Categories
              </a>
              <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-premium">
                VIP Access
              </a>
              <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-cam">
                Live Shows
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="sm" 
                className={`border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white ${
                  location === "/dashboard" ? "bg-blue-600 text-white border-blue-500" : ""
                }`}
                data-testid="link-dashboard"
              >
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            
            {isAuthenticated && typedUser?.isAdmin && (
              <Link href="/admin">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white ${
                    location === "/admin" ? "bg-purple-600 text-white border-purple-500" : ""
                  }`}
                  data-testid="link-admin"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            
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
                  <span className="text-gray-300 text-sm font-medium" data-testid="text-user-name">
                    {typedUser?.firstName || typedUser?.email}
                  </span>
                </div>
                
                <Button
                  onClick={() => window.location.href = "/api/logout"}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = "/api/login"}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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
