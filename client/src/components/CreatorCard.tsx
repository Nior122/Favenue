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

  const coverImage = profile.images?.[0]?.imageUrl || null;
  const profileImage = profile.images?.[1]?.imageUrl || null;
  
  // Generate random favorite count between 10K-100K for demo
  const favoriteCount = Math.floor(Math.random() * 90000) + 10000;

  return (
    <div className="onlyfans-card group cursor-pointer" onClick={handleView} data-testid="creator-card">
      {/* Card Background with Cover Image */}
      <div className="relative h-32 overflow-hidden rounded-lg">
        {coverImage ? (
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Cover Image</span>
          </div>
        )}
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/20"></div>
        
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

        {/* Profile Content Overlay */}
        <div className="absolute inset-0 p-3 flex items-end">
          <div className="flex items-center gap-3 w-full">
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
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
              {profile.isActive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 text-white">
              <h3 className="font-semibold text-base truncate mb-1">
                {profile.name.toLowerCase().replace(/\s+/g, '')}
              </h3>
              <p className="text-white/90 text-sm">
                {favoriteCount.toLocaleString()} favorites
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}