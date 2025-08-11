import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Heart, Upload, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileWithImages } from "@shared/schema";

interface Post {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  date: string;
  attachments: number;
}

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:id");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  
  const profileId = params?.id;
  
  // Fetch profile data
  const { data: profile, isLoading } = useQuery<ProfileWithImages>({
    queryKey: ['/api/profiles', profileId],
    enabled: !!profileId,
  });

  // Generate mock posts for the profile
  const generatePosts = (profile: ProfileWithImages): Post[] => {
    if (!profile) return [];
    
    const postTitles = [
      "just hangin out lol",
      "cum here often?", 
      "naked 99% of the time lol",
      "okay okay enough teasing... full video from this bj...",
      "my cleavage said to tell you hi :)",
      "taking you in the shower with me... no masturbation...",
      "do we fuck w the side angle??",
      "pov you're the fly that got trapped in my bathroom..."
    ];
    
    return Array.from({ length: 50 }, (_, index) => ({
      id: `post-${index}`,
      imageUrl: `https://picsum.photos/300/400?random=${profile.id}-${index}`,
      title: postTitles[index % postTitles.length],
      description: postTitles[index % postTitles.length],
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      attachments: Math.floor(Math.random() * 3)
    }));
  };

  const posts = profile ? generatePosts(profile) : [];
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const postsPerPage = 20;
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const profileImage = profile.images?.[1]?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`;
  const coverImage = profile.images?.[0]?.imageUrl || `https://picsum.photos/1200/400?random=${profile.id}`;

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Profile Header */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover opacity-60"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/1200/400?random=${profile.id}-cover`;
              }}
            />
          </div>
          
          {/* Profile Info Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
            <div className="absolute bottom-6 left-6 flex items-end gap-4">
              {/* Profile Picture */}
              <div className="relative">
                <img
                  src={profileImage}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full border-4 border-white/20 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`;
                  }}
                />
                <div className="absolute -bottom-2 -right-2 bg-blue-500 p-2 rounded-full">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Profile Details */}
              <div className="text-white pb-2">
                <h1 className="text-2xl font-bold mb-2">
                  {profile.name.toLowerCase().replace(/\s+/g, '')}
                </h1>
                <div className="flex gap-3">
                  <Button 
                    size="sm" 
                    className="bg-gray-700/80 hover:bg-gray-600/80 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload file
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className={`border-gray-500 ${isFavorited ? 'bg-red-500 text-white' : 'text-white hover:bg-red-500'}`}
                    onClick={() => setIsFavorited(!isFavorited)}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                    Favorite
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border">
          <div className="container max-w-6xl mx-auto px-6">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="bg-transparent border-none h-auto p-0 space-x-8">
                <TabsTrigger 
                  value="posts" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-3"
                >
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="tags"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-3"
                >
                  Tags
                </TabsTrigger>
                <TabsTrigger 
                  value="linked"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-3"
                >
                  Linked Accounts
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="mt-6">
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-card border-border"
                    />
                  </div>
                </div>

                {/* Posts Count */}
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {startIndex + 1} - {Math.min(startIndex + postsPerPage, filteredPosts.length)} of {filteredPosts.length}
                </p>

                {/* Posts Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {currentPosts.map((post) => (
                    <div
                      key={post.id}
                      className="group cursor-pointer bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                      onClick={() => window.open(post.imageUrl, '_blank')}
                    >
                      {/* Post Image */}
                      <div className="relative aspect-[3/4] bg-muted">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://picsum.photos/300/400?random=${post.id}`;
                          }}
                        />
                        
                        {/* Date Overlay */}
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {new Date(post.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }).replace(/\//g, '/')}
                        </div>

                        {/* Attachments Indicator */}
                        {post.attachments > 0 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                            {post.attachments} attachment{post.attachments > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      {/* Post Info */}
                      <div className="p-3">
                        <p className="text-sm text-foreground line-clamp-2 leading-tight">
                          {post.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      {'<<'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage > totalPages - 4) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      {'>>'}
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="tags" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <p>No tags available</p>
                </div>
              </TabsContent>
              
              <TabsContent value="linked" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <p>No linked accounts</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  );
}