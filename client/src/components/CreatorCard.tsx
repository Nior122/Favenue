import { Heart, Eye, Star, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileWithImages } from "@shared/schema";

interface CreatorCardProps {
  profile: ProfileWithImages;
  onFavorite?: (profileId: string) => void;
  onView?: (profile: ProfileWithImages) => void;
  isFavorited?: boolean;
}

export default function CreatorCard({ profile, onFavorite, onView, isFavorited }: CreatorCardProps) {
  const mainImage = profile.images?.find(img => img.isMainImage) || profile.images?.[0];
  const isOnline = Math.random() > 0.3; // Mock online status
  
  return (
    <div className="creator-card group" data-testid={`card-creator-${profile.id}`}>
      {/* Creator Avatar/Cover */}
      <div className="relative overflow-hidden">
        <img
          src={mainImage?.imageUrl || `https://picsum.photos/280/370?random=${profile.id}`}
          alt={profile.name}
          className="creator-avatar transition-transform duration-300 group-hover:scale-105"
          data-testid={`img-creator-${profile.id}`}
        />
        
        {/* Online Status */}
        {isOnline && (
          <div className="absolute top-3 left-3 flex items-center bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            <div className="online-indicator mr-1"></div>
            Online
          </div>
        )}
        
        {/* Verified Badge */}
        <div className="absolute top-3 right-3">
          <div className="verified-badge">
            <Shield className="w-3 h-3 mr-1 inline" />
            Verified
          </div>
        </div>
        
        {/* Heart/Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white"
          onClick={() => onFavorite?.(profile.id)}
          data-testid={`button-favorite-${profile.id}`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current text-primary' : ''}`} />
        </Button>
        
        {/* View Count Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center bg-black/50 text-white text-xs px-2 py-1 rounded">
          <Eye className="w-3 h-3 mr-1" />
          {Math.floor(Math.random() * 10000 + 1000)}
        </div>
      </div>
      
      {/* Creator Info */}
      <div className="creator-info">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-1" data-testid={`text-creator-name-${profile.id}`}>
              {profile.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {profile.title}
            </p>
          </div>
          <div className="flex items-center text-yellow-400">
            <Star className="w-4 h-4 fill-current mr-1" />
            <span className="text-sm font-medium">{profile.rating}</span>
          </div>
        </div>
        
        {/* Location */}
        <p className="text-sm text-muted-foreground mb-3">{profile.location}</p>
        
        {/* Category Badge */}
        <Badge variant="secondary" className="mb-3">
          <Zap className="w-3 h-3 mr-1" />
          {profile.category}
        </Badge>
        
        {/* Creator Stats */}
        <div className="creator-stats">
          <div className="text-sm">
            <span className="text-primary font-semibold">{profile.reviewCount}</span> subscribers
          </div>
          <div className="text-sm">
            <span className="text-secondary font-semibold">{profile.images?.length || 0}</span> posts
          </div>
        </div>
        
        {/* Tags */}
        <div className="creator-tags">
          {profile.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="creator-tag">
              {tag}
            </span>
          ))}
        </div>
        
        {/* Action Button */}
        <Button
          className="w-full mt-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
          onClick={() => onView?.(profile)}
          data-testid={`button-view-${profile.id}`}
        >
          View Profile
        </Button>
      </div>
    </div>
  );
}