import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import ProfileModal from "@/components/ProfileModal";
import { ProfileWithImages } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithImages | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { data: allProfiles = [], isLoading } = useQuery<ProfileWithImages[]>({
    queryKey: ["/api/profiles"],
    queryFn: async () => {
      const response = await fetch('/api/profiles', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    }
  });

  // Filter and paginate profiles
  const filteredProfiles = allProfiles.filter(profile => 
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

      {/* Results Count and Pagination Info */}
      <div className="text-center py-4 text-gray-300 text-sm">
        Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredProfiles.length)} of {filteredProfiles.length}
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
          <div className="space-y-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer"
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="flex items-center space-x-4">
                  {/* Profile Image */}
                  <div className="relative">
                    <img
                      src={profile.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face'}
                      alt={profile.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="absolute top-1 right-1">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        OnlyFans
                      </span>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <h3 className="text-white text-xl font-semibold mb-1">
                      {profile.name}
                    </h3>
                    <div className="text-gray-400 text-sm">
                      {Math.floor(Math.random() * 100000)} favorites
                    </div>
                  </div>

                  {/* Favorite Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle favorite toggle
                    }}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
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

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}