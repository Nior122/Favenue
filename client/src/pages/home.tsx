import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import CreatorCard from "@/components/CreatorCard";
import { ProfileWithImages } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [shuffleTrigger, setShuffleTrigger] = useState(0);
  const [nextShuffleIn, setNextShuffleIn] = useState(60);
  const itemsPerPage = 50;

  const { data: allProfiles = [], isLoading, error } = useQuery<ProfileWithImages[]>({
    queryKey: ["/api/profiles"],
    queryFn: async () => {
      console.log('🔍 Fetching profiles...');
      const response = await fetch('/api/profiles', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('❌ API Error:', response.status, await response.text());
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      console.log('✅ Profiles loaded:', data.length, data);
      return data;
    }
  });

  console.log('🏠 Home component state:', { isLoading, allProfiles: allProfiles.length, error });

  // Shuffle utility function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Shuffle profiles on every page load/refresh and when data changes
  const shuffledProfiles = useMemo(() => {
    if (allProfiles.length === 0) return [];
    const shuffled = shuffleArray(allProfiles);
    console.log('🔀 Profiles shuffled! New order:', shuffled.map(p => p.name));
    return shuffled;
  }, [allProfiles, shuffleTrigger]);

  // Shuffle profiles every time the component mounts or data loads
  useEffect(() => {
    if (allProfiles.length > 0) {
      setShuffleTrigger(Date.now());
    }
  }, [allProfiles]);

  // Auto-shuffle every 60 seconds with countdown
  useEffect(() => {
    let countdownId: NodeJS.Timeout;
    let shuffleId: NodeJS.Timeout;

    if (allProfiles.length > 0) {
      // Reset countdown to 60
      setNextShuffleIn(60);
      
      // Countdown timer (updates every second)
      countdownId = setInterval(() => {
        setNextShuffleIn(prev => {
          if (prev <= 1) {
            return 60; // Reset to 60 after shuffle
          }
          return prev - 1;
        });
      }, 1000);

      // Shuffle timer (triggers every 60 seconds)
      shuffleId = setInterval(() => {
        setShuffleTrigger(Date.now());
        console.log('⏰ Auto-shuffle triggered (60 seconds)');
      }, 60000);
    }

    return () => {
      if (countdownId) clearInterval(countdownId);
      if (shuffleId) clearInterval(shuffleId);
    };
  }, [allProfiles]);

  // Filter and paginate profiles
  const filteredProfiles = shuffledProfiles.filter(profile => 
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const profiles = filteredProfiles.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleShuffle = () => {
    setShuffleTrigger(Date.now());
    setCurrentPage(1); // Reset to first page after shuffle
    setNextShuffleIn(60); // Reset countdown timer
    console.log('🔀 Manual shuffle triggered');
  };

  // Generate page numbers
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

  console.log('🎯 Rendering with profiles:', profiles.length);

  if (error) {
    console.error('💥 Query error:', error);
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Error Loading Profiles</h1>
          <p className="text-red-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      {/* Search Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <form onSubmit={handleSearch} className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-full focus:border-blue-500"
              data-testid="input-search"
            />
          </div>
        </form>
      </div>

      {/* Results Count, Auto-Shuffle Info, and Shuffle Button */}
      <div className="flex justify-between items-center py-4 px-4 max-w-4xl mx-auto">
        <div className="text-gray-300 text-sm">
          Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredProfiles.length)} of {filteredProfiles.length}
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-gray-400 text-xs">
            Auto-shuffle in {nextShuffleIn}s
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShuffle}
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            data-testid="button-shuffle"
          >
            🔀 Shuffle Now
          </Button>
        </div>
      </div>

      {/* Pagination Top */}
      <div className="flex justify-center items-center space-x-2 py-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          &lt;&lt;
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
            onClick={() => handlePageChange(page)}
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
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          &gt;
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          &gt;&gt;
        </Button>
      </div>

      {/* Profile Grid */}
      <div className="px-4 pb-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-700 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl">No profiles found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => (
              <CreatorCard
                key={profile.id}
                profile={profile}
                onView={(profile) => {
                  setLocation(`/profile/${profile.id}`);
                }}
                onFavorite={(profileId) => {
                  console.log('Favorited profile:', profileId);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Bottom */}
      <div className="flex justify-center items-center space-x-2 py-8">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          &lt;&lt;
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
            onClick={() => handlePageChange(page)}
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
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          &gt;
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          &gt;&gt;
        </Button>
      </div>


    </div>
  );
}