import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Heart, 
  Eye, 
  DollarSign, 
  Users, 
  Calendar, 
  Camera, 
  Video, 
  MessageCircle,
  Settings,
  Upload,
  Star,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access your creator dashboard</p>
          <Button onClick={() => window.location.href = "/api/login"}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Mock dashboard data - in real app this would come from API
  const dashboardStats = {
    totalEarnings: "$12,450",
    monthlyEarnings: "$3,200",
    totalViews: "45.2K",
    subscribers: "1,847",
    likes: "8,392",
    contentCount: 127
  };

  const recentActivity = [
    { type: "subscription", user: "Anonymous User", amount: "$29.99", time: "2 hours ago" },
    { type: "tip", user: "VIP Member", amount: "$15.00", time: "4 hours ago" },
    { type: "message", user: "Premium Fan", amount: "$5.00", time: "6 hours ago" },
    { type: "subscription", user: "Anonymous User", amount: "$29.99", time: "1 day ago" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 font-poppins">
            Creator Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || user?.email}! Here's your performance overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{dashboardStats.totalEarnings}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{dashboardStats.subscribers}</div>
              <p className="text-xs text-muted-foreground">
                +23 this week
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{dashboardStats.totalViews}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Likes</CardTitle>
              <Heart className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{dashboardStats.likes}</div>
              <p className="text-xs text-muted-foreground">
                +156 today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Your latest transactions and interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'subscription' ? 'bg-primary' : 
                            activity.type === 'tip' ? 'bg-secondary' : 'bg-accent'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{activity.user}</p>
                            <p className="text-xs text-muted-foreground capitalize">{activity.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{activity.amount}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-secondary" />
                    Quick Upload
                  </CardTitle>
                  <CardDescription>Upload new content to your profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">Drop files here or click to browse</p>
                    <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                      Select Files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Manage your photos, videos, and posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-6 border border-border rounded-lg">
                    <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Photos</h3>
                    <p className="text-2xl font-bold text-primary">89</p>
                    <p className="text-sm text-muted-foreground">Published</p>
                  </div>
                  <div className="text-center p-6 border border-border rounded-lg">
                    <Video className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Videos</h3>
                    <p className="text-2xl font-bold text-secondary">24</p>
                    <p className="text-sm text-muted-foreground">Published</p>
                  </div>
                  <div className="text-center p-6 border border-border rounded-lg">
                    <MessageCircle className="h-12 w-12 text-accent mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Posts</h3>
                    <p className="text-2xl font-bold text-accent">14</p>
                    <p className="text-sm text-muted-foreground">This month</p>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Content
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages & Chat</CardTitle>
                <CardDescription>Manage fan messages and premium chat requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">VF</span>
                      </div>
                      <div>
                        <p className="font-medium">VIP Fan</p>
                        <p className="text-sm text-muted-foreground">Custom request - $25</p>
                      </div>
                    </div>
                    <Badge className="bg-primary">New</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">PU</span>
                      </div>
                      <div>
                        <p className="font-medium">Premium User</p>
                        <p className="text-sm text-muted-foreground">Thank you for the content!</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">2h ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Track your earnings and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Earnings Trend</h3>
                    <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Chart would go here</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">Engagement Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Profile Views</span>
                        <span className="text-sm font-medium">2,847</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Content Likes</span>
                        <span className="text-sm font-medium">8,392</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Messages</span>
                        <span className="text-sm font-medium">156</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your profile information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name</label>
                    <Input placeholder="Your stage name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo</SelectItem>
                        <SelectItem value="couples">Couples</SelectItem>
                        <SelectItem value="fetish">Fetish</SelectItem>
                        <SelectItem value="cam">Cam Shows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea 
                    placeholder="Tell your fans about yourself..."
                    rows={4}
                  />
                </div>
                
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}