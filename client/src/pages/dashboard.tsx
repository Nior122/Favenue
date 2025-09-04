import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, User, Star, Settings, Eye, ThumbsUp } from "lucide-react";
import { type ProfileWithImages } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to log in to view your dashboard.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user favorites
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<ProfileWithImages[]>({
    queryKey: ['/api/user/favorites'],
    enabled: isAuthenticated,
  });

  // Fetch user activity/stats
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    enabled: isAuthenticated,
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return await apiRequest(`/api/user/favorites/${profileId}`, {
        method: 'POST',
      });
    },
    onSuccess: (data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });

      toast({
        title: data.isFavorited ? "Added to favorites" : "Removed from favorites",
        description: data.isFavorited ?
          "Profile has been added to your favorites." :
          "Profile has been removed from your favorites.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    },
  });

  const handleToggleFavorite = (profileId: string) => {
    toggleFavoriteMutation.mutate(profileId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <p className="text-muted-foreground mb-4">You need to log in to view your dashboard.</p>
          <Button onClick={() => window.location.href = "/api/login"}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-green-600 to-green-800 flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'User'}!
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your favorites and explore new creators</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/">Browse Creators</Link>
            </Button>
            {user?.isAdmin && (
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/admin">Admin Panel</Link>
              </Button>
            )}
            <Button onClick={() => window.location.href = "/api/logout"} className="w-full sm:w-auto">
              Log Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs sm:text-sm">
              Favorites ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Favorites</CardTitle>
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{favorites.length}</div>
                  <p className="text-xs text-muted-foreground">Saved creators</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Profile Views</CardTitle>
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{userStats?.profileViews || 0}</div>
                  <p className="text-xs text-muted-foreground">Views given</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Interactions</CardTitle>
                  <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{userStats?.interactions || 0}</div>
                  <p className="text-xs text-muted-foreground">Total interactions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Member Since</CardTitle>
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {user?.createdAt ? new Date(user.createdAt).getFullYear() : "2024"}
                  </div>
                  <p className="text-xs text-muted-foreground">Year joined</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Favorites */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Favorites</CardTitle>
                <CardDescription>Your recently favorited creators</CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
                    <p className="mb-4">Start exploring and heart your favorite creators!</p>
                    <Button asChild>
                      <Link href="/">Browse Creators</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {favorites.slice(0, 6).map((profile) => (
                      <div key={profile.id} className="group cursor-pointer">
                        <Link href={`/profile/${profile.id}`}>
                          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="aspect-square bg-muted rounded-lg overflow-hidden group relative">
                              {(profile.profilePictureUrl || profile.images?.[0]?.imageUrl) && (
                                <img
                                  src={profile.profilePictureUrl || profile.images[0]?.imageUrl}
                                  alt={profile.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              )}
                              {!profile.profilePictureUrl && !profile.images?.[0]?.imageUrl && (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                  No Image
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleToggleFavorite(profile.id);
                                }}
                              >
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              </Button>
                            </div>
                            <CardContent className="p-3">
                              <h3 className="font-medium mb-1">{profile.name}</h3>
                              <p className="text-xs text-muted-foreground mb-2">{profile.title}</p>
                              <Badge variant="outline" className="text-xs">
                                {profile.category}
                              </Badge>
                            </CardContent>
                          </Card>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">My Favorites</h2>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/">Find More Creators</Link>
              </Button>
            </div>

            {favoritesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">No favorites yet</h3>
                <p className="mb-6">Start exploring and heart your favorite creators!</p>
                <Button asChild>
                  <Link href="/">Browse Creators</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {favorites.map((profile) => (
                  <div key={profile.id} className="group cursor-pointer">
                    <Link href={`/profile/${profile.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-48 bg-muted relative">
                          {profile.images[0] && (
                            <img
                              src={profile.images[0].imageUrl}
                              alt={profile.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleFavorite(profile.id);
                            }}
                          >
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1">{profile.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{profile.title}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{profile.category}</Badge>
                            <div className="text-xs text-muted-foreground">
                              ⭐ {profile.rating} ({profile.reviewCount} reviews)
                            </div>
                          </div>
                          {profile.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {profile.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="text-center py-12 text-muted-foreground">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Activity History</h3>
              <p>Activity tracking features coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}