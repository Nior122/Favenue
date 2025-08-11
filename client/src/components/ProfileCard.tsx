import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Star, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ProfileWithImages } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProfileCardProps {
  profile: ProfileWithImages;
  onClick: () => void;
  compact?: boolean;
}

export default function ProfileCard({ profile, onClick, compact = false }: ProfileCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFavorited, setIsFavorited] = useState(profile.isFavorited || false);

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/favorites/${profile.id}`);
      return response.json();
    },
    onSuccess: (data) => {
      setIsFavorited(data.isFavorited);
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      
      toast({
        title: data.isFavorited ? "Added to Favorites" : "Removed from Favorites",
        description: data.isFavorited 
          ? `${profile.name} has been added to your favorites` 
          : `${profile.name} has been removed from your favorites`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign In Required",
          description: "Please sign in to favorite profiles",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to favorite profiles",
        variant: "destructive",
      });
      return;
    }
    favoriteMutation.mutate();
  };

  const mainImage = profile.images?.find(img => img.isMainImage) || profile.images?.[0];
  const imageUrl = mainImage?.imageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
      onClick={onClick}
      data-testid={`card-profile-${profile.id}`}
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={profile.name}
          className={`w-full object-cover ${compact ? "h-48" : "h-64"}`}
          data-testid={`img-profile-${profile.id}`}
        />
        <div className="absolute top-4 right-4">
          <Button
            size="sm"
            variant="ghost"
            className={`rounded-full p-2 backdrop-blur-sm ${
              isFavorited 
                ? "bg-primary/20 text-primary hover:bg-primary/30" 
                : "bg-black/20 text-white hover:bg-black/30"
            }`}
            onClick={handleFavoriteClick}
            disabled={favoriteMutation.isPending}
            data-testid={`button-favorite-${profile.id}`}
          >
            <Heart 
              className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} 
            />
          </Button>
        </div>
        <div className="absolute top-4 left-4">
          <Badge 
            variant="secondary" 
            className="bg-white/90 text-text backdrop-blur-sm"
            data-testid={`badge-category-${profile.id}`}
          >
            {profile.category}
          </Badge>
        </div>
      </div>
      
      <div className={compact ? "p-4" : "p-6"}>
        <h4 className={`font-semibold text-text mb-2 ${compact ? "text-lg" : "text-xl"}`} data-testid={`text-name-${profile.id}`}>
          {profile.name}
        </h4>
        <p className={`text-gray-600 mb-3 ${compact ? "text-sm" : "text-base"}`} data-testid={`text-title-${profile.id}`}>
          {profile.title}
        </p>
        
        {profile.location && (
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span data-testid={`text-location-${profile.id}`}>{profile.location}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-accent fill-current" />
            <span className="text-sm text-gray-600" data-testid={`text-rating-${profile.id}`}>
              {profile.rating || "4.5"}
            </span>
            <span className="text-sm text-gray-500" data-testid={`text-reviews-${profile.id}`}>
              ({profile.reviewCount || "0"} reviews)
            </span>
          </div>
          
          {profile.images && profile.images.length > 1 && (
            <Badge variant="outline" className="text-xs" data-testid={`badge-images-${profile.id}`}>
              {profile.images.length} photos
            </Badge>
          )}
        </div>
        
        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {profile.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-primary/5 text-primary border-primary/20"
                data-testid={`tag-${profile.id}-${index}`}
              >
                {tag}
              </Badge>
            ))}
            {profile.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{profile.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
