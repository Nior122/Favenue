import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import CreatorCard from "@/components/CreatorCard";
import ProfileModal from "@/components/ProfileModal";
import { ProfileWithImages } from "@shared/schema";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    location: "",
  });
  const [loadMoreOffset, setLoadMoreOffset] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithImages | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const featuredProfiles = profiles.filter((p, i) => i < 6);
  const categories = ['Solo', 'Couples', 'Fetish', 'Cam Shows', 'Alternative', 'Luxury', 'Amateur', 'Ethnic'];
  const locations = ['Miami', 'Los Angeles', 'Las Vegas', 'New York', 'Austin', 'Portland', 'Monaco', 'Phoenix'];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadMoreOffset(0);
  };

  const handleFilterChange = (key: string, value: string) => {
    const filterValue = value === 'all-locations' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: filterValue }));
    setLoadMoreOffset(0);
  };

  const handleLoadMore = () => {
    setLoadMoreOffset(prev => prev + 12);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text font-poppins">
            Premium Adult Creator Hub
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover exclusive adult content creators and connect with top-tier performers in premium entertainment
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="flex rounded-xl overflow-hidden glass-effect">
              <Input
                type="text"
                placeholder="Search models and performers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                data-testid="input-search"
              />
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-6"
                data-testid="button-search"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge 
              variant={filters.category === "" ? "default" : "secondary"}
              className="cursor-pointer px-4 py-2"
              onClick={() => handleFilterChange('category', '')}
              data-testid="filter-all"
            >
              <Zap className="w-3 h-3 mr-1" />
              All
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={filters.category === category ? "default" : "secondary"}
                className="cursor-pointer px-4 py-2"
                onClick={() => handleFilterChange('category', category)}
                data-testid={`filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="glass-effect rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">2,500+</div>
              <div className="text-sm text-muted-foreground">Verified Models</div>
            </div>
            <div className="glass-effect rounded-lg p-4">
              <div className="text-2xl font-bold text-secondary">100K+</div>
              <div className="text-sm text-muted-foreground">Premium Videos</div>
            </div>
            <div className="glass-effect rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Live Shows</div>
            </div>
            <div className="glass-effect rounded-lg p-4">
              <div className="text-2xl font-bold text-secondary">99%</div>
              <div className="text-sm text-muted-foreground">Privacy Secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2 font-poppins">
                Featured Models
              </h2>
              <p className="text-muted-foreground">
                Discover our most popular and highly-rated adult content creators
              </p>
            </div>
            
            {/* Advanced Filters */}
            <div className="flex items-center gap-3">
              <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                <SelectTrigger className="w-48 glass-effect">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-locations">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" className="glass-effect">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="content-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="creator-card animate-pulse">
                  <div className="w-full h-80 bg-muted"></div>
                  <div className="creator-info">
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <CreatorCard
                    key={profile.id}
                    profile={profile}
                    onView={(profile) => {
                      setSelectedProfile(profile);
                      setIsModalOpen(true);
                    }}
                    onFavorite={(profileId) => console.log('Favorite:', profileId)}
                  />
                ))}
              </div>

              {profiles.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No models found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria</p>
                </div>
              )}

              {profiles.length > 0 && profiles.length % 12 === 0 && (
                <div className="text-center mt-12">
                  <Button
                    onClick={handleLoadMore}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 px-8 py-3"
                    data-testid="button-load-more"
                  >
                    Load More Models
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            © 2025 CreatorHub Premium. All rights reserved. 18+ Only.
          </p>
        </div>
      </footer>

      {/* Profile Modal */}
      <ProfileModal
        profile={selectedProfile}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProfile(null);
        }}
        onFavorite={(profileId) => console.log('Favorite:', profileId)}
      />
    </div>
  );
}