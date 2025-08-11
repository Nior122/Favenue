import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Heart } from "lucide-react";
import Navigation from "@/components/Navigation";
import ProfileCard from "@/components/ProfileCard";
import ProfileModal from "@/components/ProfileModal";
import SearchFilters from "@/components/SearchFilters";
import { ProfileWithImages } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithImages | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    location: "",
  });
  const [loadMoreOffset, setLoadMoreOffset] = useState(0);

  const { data: profiles = [], isLoading } = useQuery<ProfileWithImages[]>({
    queryKey: ["/api/profiles", filters.category, filters.location, searchQuery, loadMoreOffset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.location) params.set('location', filters.location);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '12');
      if (loadMoreOffset > 0) params.set('offset', loadMoreOffset.toString());
      
      const response = await fetch(`/api/profiles?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    }
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<ProfileWithImages[]>({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const response = await fetch('/api/favorites', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    }
  });

  const featuredProfiles = profiles.slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadMoreOffset(0);
  };

  const handleLoadMore = () => {
    setLoadMoreOffset(prev => prev + 12);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold mb-6 font-poppins" data-testid="hero-title">
            Welcome Back!
          </h2>
          <p className="text-xl mb-10 text-white opacity-90" data-testid="hero-description">
            Discover and save your favorite professionals
          </p>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex rounded-lg overflow-hidden shadow-2xl">
              <Input
                type="text"
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-6 py-4 text-text focus:outline-none border-0 rounded-none"
                data-testid="input-search"
              />
              <Button 
                type="submit"
                className="bg-accent text-text px-8 py-4 font-semibold hover:bg-opacity-90 transition rounded-none"
                data-testid="button-search"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content with Tabs */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="browse" className="space-y-8">
            <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
              <TabsTrigger value="browse" data-testid="tab-browse">Browse Profiles</TabsTrigger>
              <TabsTrigger value="favorites" data-testid="tab-favorites">My Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-8">
              {/* Featured Profiles */}
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-text mb-4 font-poppins" data-testid="text-featured-title">
                  Featured Profiles
                </h3>
                <p className="text-gray-600" data-testid="text-featured-description">
                  Meet our most popular professionals
                </p>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-2xl h-80 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" data-testid="grid-featured-profiles">
                  {featuredProfiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onClick={() => setSelectedProfile(profile)}
                    />
                  ))}
                </div>
              )}

              {/* Profile Directory */}
              <div className="flex flex-col lg:flex-row gap-8">
                <SearchFilters filters={filters} onFiltersChange={setFilters} />

                <div className="lg:w-3/4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-text font-poppins" data-testid="text-all-profiles-title">
                      All Profiles
                    </h3>
                    <span className="text-gray-600" data-testid="text-profile-count">
                      {profiles.length} profiles found
                    </span>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="bg-gray-200 rounded-2xl h-64 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8" data-testid="grid-all-profiles">
                        {profiles.map((profile) => (
                          <ProfileCard
                            key={profile.id}
                            profile={profile}
                            onClick={() => setSelectedProfile(profile)}
                            compact
                          />
                        ))}
                      </div>

                      {profiles.length >= 12 && (
                        <div className="text-center">
                          <Button
                            onClick={handleLoadMore}
                            className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition font-medium"
                            data-testid="button-load-more"
                          >
                            Load More Profiles
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-8">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-text mb-4 font-poppins flex items-center justify-center gap-2" data-testid="text-favorites-title">
                  <Heart className="w-8 h-8 text-primary" />
                  Your Favorites
                </h3>
                <p className="text-gray-600" data-testid="text-favorites-description">
                  Profiles you've saved for later
                </p>
              </div>

              {favoritesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-2xl h-80 animate-pulse" />
                  ))}
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-text mb-2" data-testid="text-no-favorites">No favorites yet</h4>
                  <p className="text-gray-600" data-testid="text-no-favorites-description">
                    Start exploring profiles and save the ones you like!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="grid-favorites">
                  {favorites.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onClick={() => setSelectedProfile(profile)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-text text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 font-poppins" data-testid="text-footer-title">ProfileHub</h3>
              <p className="text-gray-300 mb-4" data-testid="text-footer-description">
                Connecting talented professionals with opportunities worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Browse</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition" data-testid="link-all-profiles">All Profiles</a></li>
                <li><a href="#" className="hover:text-white transition" data-testid="link-categories">Categories</a></li>
                <li><a href="#" className="hover:text-white transition" data-testid="link-featured">Featured</a></li>
                <li><a href="#" className="hover:text-white transition" data-testid="link-top-rated">Top Rated</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition" data-testid="link-help">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition" data-testid="link-contact">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition" data-testid="link-privacy">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition" data-testid="link-terms">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
              <p className="text-gray-300 mb-4" data-testid="text-newsletter-description">
                Stay updated with the latest profiles and features.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p data-testid="text-copyright">&copy; 2024 ProfileHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
