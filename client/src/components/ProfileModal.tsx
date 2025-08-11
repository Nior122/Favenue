import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Heart, Star, MapPin, Mail, Share, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ProfileWithImages } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ImageGallery from "./ImageGallery";

interface ProfileModalProps {
  profile: ProfileWithImages;
  onClose: () => void;
}

export default function ProfileModal({ profile, onClose }: ProfileModalProps) {
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

  const handleFavoriteClick = () => {
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} - ${profile.title}`,
          text: profile.description || `Check out ${profile.name}'s profile`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled the share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Profile link copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Share Failed",
          description: "Could not copy link to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const mainImage = profile.images?.find(img => img.isMainImage) || profile.images?.[0];
  const coverImage = mainImage?.imageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400";
  const avatarImage = mainImage?.imageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto" data-testid="modal-profile">
      <div className="min-h-screen px-4 text-center">
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white">
            {/* Profile Header */}
            <div className="relative">
              <img 
                src={coverImage} 
                alt="Profile Cover" 
                className="w-full h-64 object-cover"
                data-testid="img-profile-cover"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2"
                data-testid="button-close-modal"
              >
                <X className="w-5 h-5 text-text" />
              </Button>
              <div className="absolute bottom-4 left-4">
                <img 
                  src={avatarImage} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full border-4 border-white object-cover"
                  data-testid="img-profile-avatar"
                />
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-text mb-2 font-poppins" data-testid="text-profile-name">
                    {profile.name}
                  </h2>
                  <p className="text-xl text-gray-600 mb-2" data-testid="text-profile-title">
                    {profile.title}
                  </p>
                  {profile.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span data-testid="text-profile-location">{profile.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-accent fill-current" />
                    <span className="font-semibold" data-testid="text-profile-rating">
                      {profile.rating || "4.8"}
                    </span>
                    <span className="text-gray-600" data-testid="text-profile-reviews">
                      ({profile.reviewCount || "24"} reviews)
                    </span>
                  </div>
                  <Button
                    onClick={handleFavoriteClick}
                    disabled={favoriteMutation.isPending}
                    className={`${
                      isFavorited 
                        ? "bg-primary text-white hover:bg-primary/90" 
                        : "bg-gray-100 text-text hover:bg-gray-200"
                    }`}
                    data-testid="button-toggle-favorite"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                    {isFavorited ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>

              {/* Profile Description */}
              {profile.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text mb-3">About</h3>
                  <p className="text-gray-600 leading-relaxed" data-testid="text-profile-description">
                    {profile.description}
                  </p>
                </div>
              )}

              {/* Skills/Tags */}
              {profile.tags && profile.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2" data-testid="tags-container">
                    {profile.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20"
                        data-testid={`tag-${index}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Gallery */}
              {profile.images && profile.images.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text mb-4">Portfolio Gallery</h3>
                  <ImageGallery images={profile.images} />
                </div>
              )}

              {/* Contact Information */}
              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-4 sm:mb-0">
                    <h3 className="text-lg font-semibold text-text mb-2">Get in Touch</h3>
                    <p className="text-gray-600">Available for new projects and collaborations</p>
                  </div>
                  <div className="flex space-x-4">
                    <Button 
                      className="bg-secondary text-white hover:bg-secondary/90"
                      data-testid="button-contact"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleShare}
                      data-testid="button-share"
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
