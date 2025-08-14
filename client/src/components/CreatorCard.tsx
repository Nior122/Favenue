import { useState } from "react";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProfileWithImages } from "@shared/schema";

interface CreatorCardProps {
  profile: ProfileWithImages;
  onView: (profile: ProfileWithImages) => void;
  onFavorite: (profileId: string) => void;
}

export default function CreatorCard({ profile, onView, onFavorite }: CreatorCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavorite(profile.id);
  };

  const handleView = () => {
    onView(profile);
  };

  // Use gallery image for background, profile picture for avatar
  const backgroundImage = profile.images?.[0]?.imageUrl || profile.coverPhotoUrl || null;
  const profileImage = profile.profilePictureUrl || profile.images?.[0]?.imageUrl || null;
  
  // Generate random favorite count between 10K-100K for demo
  const favoriteCount = Math.floor(Math.random() * 90000) + 10000;

  return (
    <div className="group cursor-pointer mb-2" onClick={handleView} data-testid="creator-card">
      {/* Card with Background Image - horizontal layout like screenshot */}
      <div className="relative h-20 overflow-hidden rounded-lg bg-gray-800">
        {backgroundImage ? (
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-800"></div>
        )}
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* OnlyFans Badge */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-xs font-semibold px-2 py-1">
            OnlyFans
          </Badge>
        </div>

        {/* Favorite Button */}
        <button
          className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
            isFavorited ? "text-red-500" : "text-white/80 hover:text-red-500"
          }`}
          onClick={handleFavorite}
          data-testid="button-favorite"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* Profile Content - horizontal layout */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-3">
          {/* Profile Picture */}
          <div className="relative flex-shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={profile.name}
                className="w-12 h-12 rounded-lg object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-700 border-2 border-white/20 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 text-white">
            <h3 className="font-semibold text-base truncate">
              {profile.name.toLowerCase().replace(/\s+/g, '')}
            </h3>
            <p className="text-white/90 text-sm">
              {favoriteCount.toLocaleString()} favorites
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}