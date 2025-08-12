import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Heart, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      "taking you in the shower with me... no masturbatio...",
      "okay okay enough teasing... full video from this bj...",
      "my cleavage said to tell you( hi :)",
      "do we fuck w the side angle??",
      "pov you're the fly that got trapped in my bathroom..."
    ];
    
    return Array.from({ length: 1336 }, (_, index) => ({
      id: `post-${index}`,
      imageUrl: `https://picsum.photos/300/400?random=${profile.id}-${index}`,
      title: postTitles[index % postTitles.length],
      description: postTitles[index % postTitles.length],
      date: `2025/07/${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      attachments: Math.floor(Math.random() * 3)
    }));
  };

  const posts = profile ? generatePosts(profile) : [];
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const postsPerPage = 50;
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
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
    <div className="min-h-screen bg-black text-white">
      {/* Profile Header - Exactly like OnlyFans */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {/* Cover Image with Dark Overlay */}
        <div className="absolute inset-0">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/1200/400?random=${profile.id}-cover`;
            }}
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        {/* Profile Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
          <div className="flex items-end gap-4">
            {/* Profile Picture */}
            <div className="relative">
              <img
                src={profileImage}
                alt={profile.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`;
                }}
              />
              {/* Verified Badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-current" />
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
                {profile.name.toLowerCase().replace(/\s+/g, '')}
              </h1>
              
              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <Button 
                  size="sm"
                  className="bg-gray-700/90 hover:bg-gray-600/90 text-white border border-gray-500 text-xs sm:text-sm"
                  data-testid="button-upload-file"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Upload file
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className={`border-gray-500 text-xs sm:text-sm ${isFavorited ? 'bg-red-500 text-white border-red-500' : 'text-white hover:bg-red-500/20'}`}
                  onClick={() => setIsFavorited(!isFavorited)}
                  data-testid="button-favorite"
                >
                  <Heart className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                  ★Favorite
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - OnlyFans Style */}
      <div className="border-b border-gray-800">
        <div className="px-4 sm:px-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="bg-transparent border-none h-auto p-0 space-x-4 sm:space-x-8 w-full">
              <TabsTrigger 
                value="posts" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-400 data-[state=active]:bg-transparent rounded-none px-0 py-3 text-white font-medium text-sm sm:text-base"
              >
                Posts
              </TabsTrigger>
              <TabsTrigger 
                value="tags"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-400 data-[state=active]:bg-transparent rounded-none px-0 py-3 text-gray-400 font-medium text-sm sm:text-base"
              >
                Tags
              </TabsTrigger>
              <TabsTrigger 
                value="linked"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-400 data-[state=active]:bg-transparent rounded-none px-0 py-3 text-gray-400 font-medium text-sm sm:text-base"
              >
                Linked Accounts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              {/* Search Bar */}
              <div className="px-4 sm:px-0">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-md text-sm"
                    data-testid="input-search"
                  />
                </div>
              </div>

              {/* Result Count */}
              <div className="text-center text-gray-400 text-sm px-4 sm:px-0">
                Showing {startIndex + 1} - {Math.min(startIndex + postsPerPage, filteredPosts.length)} of {filteredPosts.length}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center space-x-1 px-4 sm:px-0 overflow-x-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 text-xs px-2 flex-shrink-0"
                >
                  &lt;&lt;
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 text-xs px-2 flex-shrink-0"
                >
                  &lt;
                </Button>
                
                {getPageNumbers().map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`text-xs min-w-[32px] flex-shrink-0 ${currentPage === page 
                      ? "bg-blue-600 text-white border-blue-500" 
                      : "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </Button>
                ))}

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 text-xs px-2 flex-shrink-0"
                >
                  &gt;
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 text-xs px-2 flex-shrink-0"
                >
                  &gt;&gt;
                </Button>
              </div>

              {/* Posts Grid - Exactly 2 columns like OnlyFans, mobile responsive */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 px-4 sm:px-0">
                {currentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="group cursor-pointer bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-200"
                    onClick={() => window.open(post.imageUrl, '_blank')}
                    data-testid={`card-post-${post.id}`}
                  >
                    {/* Post Image */}
                    <div className="relative aspect-[3/4] bg-gray-800">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/300/400?random=${post.id}`;
                        }}
                      />
                      
                      {/* Date Overlay - top left */}
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/70 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded">
                        {post.date}
                      </div>

                      {/* Attachments Indicator - top right */}
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/70 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded">
                        {post.attachments > 0 ? `${post.attachments} attachment${post.attachments > 1 ? 's' : ''}` : 'No attachments'}
                      </div>
                    </div>
                    
                    {/* Post Caption */}
                    <div className="p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-tight">
                        {post.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Pagination */}
              <div className="flex justify-center items-center space-x-1 pb-8 px-4 sm:px-0 overflow-x-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 text-xs px-2 flex-shrink-0"
                >
                  &lt;&lt;
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 text-xs px-2 flex-shrink-0"
                >
                  &lt;
                </Button>
                
                {getPageNumbers().map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`text-xs min-w-[32px] flex-shrink-0 ${currentPage === page 
                      ? "bg-blue-600 text-white border-blue-500" 
                      : "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </Button>
                ))}

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 text-xs px-2 flex-shrink-0"
                >
                  &gt;
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 text-xs px-2 flex-shrink-0"
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