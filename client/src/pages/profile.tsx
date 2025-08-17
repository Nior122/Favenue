import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Heart, Search, Eye, X, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileWithImages } from "@shared/schema";
import UnlockPopup from "@/components/UnlockPopup";
import { useToast } from "@/hooks/use-toast";

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
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showUnlockPopup, setShowUnlockPopup] = useState(false);
  const [pendingPost, setPendingPost] = useState<Post | null>(null);
  const [unlockedImages, setUnlockedImages] = useState<Set<string>>(new Set());
  const [unlockingImages, setUnlockingImages] = useState<Set<string>>(new Set());
  const [viewedImages, setViewedImages] = useState<Set<string>>(new Set());
  const [verifyingImages, setVerifyingImages] = useState<Set<string>>(new Set());
  const [failedVerification, setFailedVerification] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  const profileId = params?.id;

  // Remove localStorage persistence - images should re-lock after viewing
  // Don't save unlocked state anymore since we want pay-per-view behavior

  // Clear unlocked images when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts - reset all unlock states
      setUnlockedImages(new Set());
      setUnlockingImages(new Set());
      setViewedImages(new Set());
      setVerifyingImages(new Set());
      setFailedVerification(new Set());
    };
  }, []);

  const handleImageClick = (post: Post) => {
    if (unlockedImages.has(post.id) && !viewedImages.has(post.id)) {
      // Image is unlocked but not yet viewed, show it directly
      setSelectedPost(post);
      // Mark as viewed so it will lock again after closing
      setViewedImages(prev => new Set(Array.from(prev).concat(post.id)));
    } else if (verifyingImages.has(post.id)) {
      // Image is still being verified, show warning
      toast({
        title: "Still verifying",
        description: "Click the link and spend 5 seconds on the verification page. If not, image won't open.",
        duration: 8000,
      });
    } else if (failedVerification.has(post.id)) {
      // Image verification failed, show failure message
      toast({
        title: "Verification failed",
        description: "You didn't spend enough time (5 seconds) on the verification page. Try unlocking again.",
        duration: 8000,
      });
      // Allow user to try again
      setPendingPost(post);
      setShowUnlockPopup(true);
      // Remove from failed set so they can try again
      setFailedVerification(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(post.id);
        return newSet;
      });
    } else {
      // Image is locked or already viewed, show unlock popup
      setPendingPost(post);
      setShowUnlockPopup(true);
    }
  };

  const handleUnlock = () => {
    if (pendingPost) {
      const postId = pendingPost.id;
      
      // Add this image to verifying set (waiting for user to visit link)
      setVerifyingImages(prev => new Set(Array.from(prev).concat(postId)));
      
      // Show toast notification
      toast({
        title: "Click the link and stay for 5 seconds",
        description: "If you don't spend at least 5 seconds on the verification page, the image won't unlock.",
        duration: 8000,
      });

      // Check if user actually visited the unlock page
      const unlockWindow = window.open('https://loadingup.vercel.app/', '_blank');
      
      // Use focus/blur events to detect if user actually visits the page
      let visitStartTime: number | null = null;
      let isVerified = false;
      
      const checkInterval = setInterval(() => {
        if (unlockWindow?.closed) {
          // User closed the window before verification
          if (!isVerified) {
            setVerifyingImages(prev => {
              const newSet = new Set(Array.from(prev));
              newSet.delete(postId);
              return newSet;
            });
            setFailedVerification(prev => new Set(Array.from(prev).concat(postId)));
            
            toast({
              title: "Verification failed - Window closed early",
              description: "You must click the link and spend 5 seconds on the verification page. Image locked.",
              duration: 8000,
            });
          }
          clearInterval(checkInterval);
          return;
        }
      }, 1000);

      // Listen for when user returns to our page (blur/focus)
      const handleVisibilityChange = () => {
        if (!document.hidden && visitStartTime) {
          const timeSpent = Date.now() - visitStartTime;
          if (timeSpent >= 5000 && !isVerified) {
            isVerified = true;
            
            // Add to unlocked images after verification
            setUnlockedImages(prev => new Set(Array.from(prev).concat(postId)));
            // Remove from verifying
            setVerifyingImages(prev => {
              const newSet = new Set(Array.from(prev));
              newSet.delete(postId);
              return newSet;
            });
            
            // Show the image
            setSelectedPost(pendingPost);
            // Mark as viewed so it will lock again after closing
            setViewedImages(prev => new Set(Array.from(prev).concat(postId)));
            setPendingPost(null);
            
            // Show success toast
            toast({
              title: "Content unlocked!",
              description: "5-second verification completed successfully.",
              duration: 3000,
            });
            
            // Cleanup
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(checkInterval);
          } else if (visitStartTime && timeSpent < 5000) {
            // User returned too early - mark as failed verification
            setVerifyingImages(prev => {
              const newSet = new Set(Array.from(prev));
              newSet.delete(postId);
              return newSet;
            });
            setFailedVerification(prev => new Set(Array.from(prev).concat(postId)));
            
            toast({
              title: "Verification failed - Not enough time",
              description: `You only spent ${Math.round(timeSpent/1000)} seconds. Need 5 seconds minimum. Image locked.`,
              duration: 8000,
            });
            
            // Cleanup
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(checkInterval);
          }
        } else if (document.hidden && !visitStartTime) {
          // User left our page (presumably to visit verification link)
          visitStartTime = Date.now();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Fallback cleanup after 3 minutes
      setTimeout(() => {
        if (!isVerified) {
          setVerifyingImages(prev => {
            const newSet = new Set(Array.from(prev));
            newSet.delete(postId);
            return newSet;
          });
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(checkInterval);
        if (unlockWindow && !unlockWindow.closed) {
          unlockWindow.close();
        }
      }, 180000);
    }
  };

  const handleCloseUnlockPopup = () => {
    setShowUnlockPopup(false);
    setPendingPost(null);
  };

  const handleCloseImageModal = () => {
    if (selectedPost && viewedImages.has(selectedPost.id)) {
      // Remove the image from unlocked set so it locks again
      setUnlockedImages(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(selectedPost.id);
        return newSet;
      });
    }
    setSelectedPost(null);
  };
  
  // Fetch profile data
  const { data: profile, isLoading } = useQuery<ProfileWithImages>({
    queryKey: ['/api/profiles', profileId],
    enabled: !!profileId,
  });

  // Generate posts from profile images with actual post data
  const generatePosts = (profile: ProfileWithImages): Post[] => {
    // Return only actual profile images, not generated posts
    if (!profile || !profile.images || profile.images.length === 0) return [];
    
    // Convert profile images to posts format using actual post data
    const posts = profile.images.map((image, index) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      title: image.title || '',
      description: image.description || '',
      date: image.createdAt ? new Date(image.createdAt).toLocaleDateString('en-CA') : '2025/08/12',
      attachments: 1
    }));
    
    console.log('📝 Generated posts with captions:', posts.map(p => ({ id: p.id, title: p.title, description: p.description })));
    console.log('📝 First post details:', posts[0]);
    return posts;
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

  const profileImage = profile.images?.[1]?.imageUrl || null;
  const coverImage = profile.images?.[0]?.imageUrl || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Buttons */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
          className="bg-black/50 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/")}
          className="bg-black/50 border-white/20 text-white hover:bg-white/20"
        >
          <Home className="w-4 h-4 mr-1" />
          Home
        </Button>
      </div>

      {/* Profile Header - Exactly like OnlyFans */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {/* Cover Image with Dark Overlay */}
        <div className="absolute inset-0">
          {coverImage ? (
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-400">No Cover Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        {/* Profile Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
          <div className="flex items-end gap-4">
            {/* Profile Picture */}
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={profile.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
              {/* Verified Badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center border-2 border-white">
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
                  variant="outline"
                  className={`border-green-600 text-xs sm:text-sm ${isFavorited ? 'bg-green-600 text-white border-green-500' : 'text-green-400 hover:bg-green-600/20'}`}
                  onClick={() => setIsFavorited(!isFavorited)}
                  data-testid="button-favorite"
                >
                  <Heart className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                  ★Favorite
                </Button>
              </div>
              
              {/* Dashboard Stats - OnlyFans Style */}
              <div className="flex gap-4 text-xs sm:text-sm text-green-300 mt-2">
                <div className="text-center">
                  <div className="font-semibold text-white">{profile.mediaCount || profile.images?.length || '0'}</div>
                  <div>Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-white">{profile.likesCount || '0'}</div>
                  <div>Likes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-white">{profile.viewsCount || '0'}</div>
                  <div>Views</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-white">{profile.subscribersCount || profile.reviewCount || '0'}</div>
                  <div>Subscribers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - OnlyFans Style */}
      <div className="border-b border-green-800">
        <div className="px-4 sm:px-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="bg-transparent border-none h-auto p-0 space-x-4 sm:space-x-8 w-full justify-start">
              <TabsTrigger 
                value="posts" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-400 data-[state=active]:bg-transparent rounded-none px-0 py-3 text-foreground font-medium text-sm sm:text-base"
              >
                Posts
              </TabsTrigger>
              <TabsTrigger 
                value="tags"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-400 data-[state=active]:bg-transparent rounded-none px-0 py-3 text-muted-foreground font-medium text-sm sm:text-base"
              >
                Tags
              </TabsTrigger>
              <TabsTrigger 
                value="linked"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-400 data-[state=active]:bg-transparent rounded-none px-0 py-3 text-muted-foreground font-medium text-sm sm:text-base"
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
                    className={`group bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-200 ${(unlockedImages.has(post.id) && !viewedImages.has(post.id)) ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={(unlockedImages.has(post.id) && !viewedImages.has(post.id)) ? () => setSelectedPost(post) : undefined}
                    data-testid={`card-post-${post.id}`}
                  >
                    {/* Post Image */}
                    <div className="relative aspect-[3/4] bg-gray-800">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className={`w-full h-full object-cover ${(unlockedImages.has(post.id) && !viewedImages.has(post.id)) ? '' : 'pointer-events-none'}`}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                      
                      {/* Date Overlay - top left */}
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/70 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded">
                        {post.date}
                      </div>

                      {/* Attachments Indicator - top right */}
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/70 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded">
                        {post.attachments > 0 ? `${post.attachments} attachment${post.attachments > 1 ? 's' : ''}` : 'No attachments'}
                      </div>

                      {/* Click to View Overlay - covers most of the image */}
                      <div className={`absolute inset-0 ${(unlockedImages.has(post.id) && !viewedImages.has(post.id)) ? 'bg-black/30 hover:bg-black/50' : verifyingImages.has(post.id) ? 'bg-black/70' : failedVerification.has(post.id) ? 'bg-red-900/80' : unlockingImages.has(post.id) ? 'bg-black/70' : 'bg-black/80'} flex items-center justify-center transition-all duration-200`}>
                        <Button 
                          size="lg"
                          className={`${(unlockedImages.has(post.id) && !viewedImages.has(post.id)) ? 'bg-green-600 hover:bg-green-700' : verifyingImages.has(post.id) ? 'bg-yellow-600 hover:bg-yellow-700' : failedVerification.has(post.id) ? 'bg-red-600 hover:bg-red-700' : unlockingImages.has(post.id) ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold px-6 py-3 text-sm sm:text-base`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(post);
                          }}
                          disabled={unlockingImages.has(post.id) || verifyingImages.has(post.id)}
                        >
                          {(unlockedImages.has(post.id) && !viewedImages.has(post.id)) ? "View Image" : verifyingImages.has(post.id) ? "Verifying..." : failedVerification.has(post.id) ? "Not enough time - Try again" : unlockingImages.has(post.id) ? "Unlocking..." : "Click to view"}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Post Caption */}
                    <div className="p-2 sm:p-3">
                      <div className="text-xs sm:text-sm text-gray-300 leading-tight">
                        <p className="font-semibold text-white mb-1">{post.title}</p>
                        <p className="line-clamp-2">{post.description}</p>
                      </div>
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
            
            <TabsContent value="tags" className="mt-6 px-4 sm:px-0">
              <div className="text-center py-12 text-gray-400">
                <p>No tags available</p>
              </div>
            </TabsContent>
            
            <TabsContent value="linked" className="mt-6 px-4 sm:px-0">
              <div className="text-center py-12 text-gray-400">
                <p>No linked accounts</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Post Modal/Lightbox */}
      {selectedPost && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={handleCloseImageModal}
        >
          <div className="max-w-2xl max-h-full overflow-auto relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseImageModal();
              }}
            >
              <X className="w-5 h-5" />
            </Button>
            
            <img
              src={selectedPost.imageUrl}
              alt={selectedPost.title}
              className="w-full h-auto object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="bg-gray-900 p-4 text-white">
              <p className="text-sm mb-2">{selectedPost.description}</p>
              <p className="text-xs text-gray-400">{selectedPost.date}</p>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Popup */}
      <UnlockPopup
        isOpen={showUnlockPopup}
        onClose={handleCloseUnlockPopup}
        onUnlock={handleUnlock}
        postTitle={pendingPost?.title}
      />
    </div>
  );
}