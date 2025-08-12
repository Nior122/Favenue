import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Heart, Upload, Search, ChevronLeft, ChevronRight, Eye, ThumbsUp } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  
  const profileId = params?.id;
  
  // Fetch profile data
  const { data: profile, isLoading } = useQuery<ProfileWithImages>({
    queryKey: ['/api/profiles', profileId],
    enabled: !!profileId,
  });

  // Generate mock posts for the profile - exactly like the screenshot
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
    
    return Array.from({ length: 1336 }, (_, index) => ({
      id: `post-${index}`,
      imageUrl: `https://picsum.photos/300/400?random=${profile.id}-${index}`,
      title: postTitles[index % postTitles.length],
      description: postTitles[index % postTitles.length],
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '/'),
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

  // Generate page numbers exactly like the screenshot
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <p className="text-gray-400">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const profileImage = profile.images?.[1]?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`;
  const coverImage = profile.images?.[0]?.imageUrl || `https://picsum.photos/1200/400?random=${profile.id}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 overflow-hidden">
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
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white fill-current" />
                </div>
                {profile.name.toLowerCase().replace(/\s+/g, '')}
              </h1>
              
              {/* Profile Stats */}
              <div className="flex items-center gap-4 mb-3 text-sm">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{(posts.length * 87 + (profile.images?.length || 0) * 234).toLocaleString()} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{(posts.length * 245 + (profile.images?.length || 0) * 1000).toLocaleString()} views</span>
                </div>
                <div className="text-gray-300">
                  {posts.length} media
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  size="sm" 
                  className="bg-gray-700/80 hover:bg-gray-600/80 text-white border border-gray-600"
                  data-testid="button-upload-file"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload file
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className={`border-gray-500 ${isFavorited ? 'bg-red-500 text-white' : 'text-white hover:bg-red-500'}`}
                  onClick={() => setIsFavorited(!isFavorited)}
                  data-testid="button-favorite"
                >
                  <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                  ★Favorite
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700">
        <div className="container max-w-6xl mx-auto px-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="bg-transparent border-none h-auto p-0 space-x-8">
              <TabsTrigger 
                value="posts" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-3 text-white"
              >
                Posts
              </TabsTrigger>
              <TabsTrigger 
                value="tags"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-3 text-gray-400"
              >
                Tags
              </TabsTrigger>
              <TabsTrigger 
                value="linked"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-3 text-gray-400"
              >
                Linked Accounts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="mt-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    data-testid="input-search"
                  />
                </div>
              </div>

              {/* Result Count - matching screenshot exactly */}
              <div className="text-center text-gray-400 text-sm mb-4">
                Showing {startIndex + 1} - {Math.min(startIndex + postsPerPage, filteredPosts.length)} of {filteredPosts.length}
              </div>

              {/* Top Pagination - exactly like screenshot */}
              <div className="flex justify-center items-center space-x-2 mb-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  &lt;&lt;
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  &lt;
                </Button>
                
                {getPageNumbers().map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page 
                      ? "bg-blue-600 text-white border-blue-500" 
                      : "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    }
                  >
                    {page}
                  </Button>
                ))}

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  &gt;
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  &gt;&gt;
                </Button>
              </div>

              {/* Posts Grid - exactly 2 columns like screenshot */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {currentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="group cursor-pointer bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors"
                    onClick={() => window.open(post.imageUrl, '_blank')}
                    data-testid={`card-post-${post.id}`}
                  >
                    {/* Post Image */}
                    <div className="relative aspect-[3/4] bg-gray-700">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/300/400?random=${post.id}`;
                        }}
                      />
                      
                      {/* Date Overlay - top left like screenshot */}
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {post.date}
                      </div>

                      {/* Attachments Indicator */}
                      {post.attachments > 0 ? (
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {post.attachments} attachment{post.attachments > 1 ? 's' : ''}
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          No attachments
                        </div>
                      )}
                    </div>
                    
                    {/* Post Info */}
                    <div className="p-3">
                      <p className="text-sm text-white line-clamp-2 leading-tight">
                        {post.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Pagination */}
              <div className="flex justify-center items-center space-x-2 pb-8">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  &lt;&lt;
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  &lt;
                </Button>
                
                {getPageNumbers().map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page 
                      ? "bg-blue-600 text-white border-blue-500" 
                      : "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    }
                  >
                    {page}
                  </Button>
                ))}

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  &gt;
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  &gt;&gt;
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="tags" className="mt-6">
              <div className="text-center py-12 text-gray-400">
                <p>No tags available</p>
              </div>
            </TabsContent>
            
            <TabsContent value="linked" className="mt-6">
              <div className="text-center py-12 text-gray-400">
                <p>No linked accounts</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}