import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, MapPin, Calendar, Shield, Eye, Users } from "lucide-react";
import { ProfileWithImages } from "@shared/schema";

interface ProfileModalProps {
  profile: ProfileWithImages | null;
  isOpen: boolean;
  onClose: () => void;
  onFavorite?: (profileId: string) => void;
  isFavorited?: boolean;
}

export default function ProfileModal({ profile, isOpen, onClose, onFavorite, isFavorited }: ProfileModalProps) {
  if (!profile) return null;

  const mainImage = profile.images?.find(img => img.isMainImage) || profile.images?.[0];
  const galleryImages = profile.images?.filter(img => !img.isMainImage) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-effect">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">
            {profile.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Image & Gallery */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg">
              {mainImage?.imageUrl ? (
                <img
                  src={mainImage.imageUrl}
                  alt={profile.name}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-400">No Profile Image</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => onFavorite?.(profile.id)}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-primary' : ''}`} />
              </Button>
            </div>

            {/* Gallery thumbnails */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.slice(0, 6).map((image, index) => (
                  <div key={image.id} className="relative group cursor-pointer">
                    <img
                      src={image.imageUrl}
                      alt={`${profile.name} gallery ${index + 1}`}
                      className="w-full h-20 object-cover rounded group-hover:opacity-75 transition"
                    />
                    {index === 5 && galleryImages.length > 6 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold rounded">
                        +{galleryImages.length - 5}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {profile.name}
                  </h3>
                  <p className="text-lg text-primary font-semibold mb-2">
                    {profile.title}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Verified</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span>{profile.rating} rating</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{profile.reviewCount} subscribers</span>
                </div>
              </div>

              <Badge className="bg-gradient-to-r from-primary to-secondary text-white mb-4">
                {profile.category}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-3">About</h4>
              <p className="text-muted-foreground leading-relaxed">
                {profile.description}
              </p>
            </div>

            {/* Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-3">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-effect rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{profile.images?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Posts</div>
              </div>
              <div className="glass-effect rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-secondary">{Math.floor(Math.random() * 1000 + 100)}</div>
                <div className="text-sm text-muted-foreground">Likes</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white py-3"
                size="lg"
              >
                Subscribe Now
              </Button>
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-white py-3"
                size="lg"
              >
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}