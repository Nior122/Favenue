import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MapPin, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProfileWithImages } from "@shared/schema";

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:id");
  const profileId = params?.id;
  
  // Fetch profile data
  const { data: profile, isLoading } = useQuery<ProfileWithImages>({
    queryKey: ['/api/profiles', profileId],
    enabled: !!profileId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <p className="text-gray-400">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Use profile images or fallbacks
  const coverImage = profile.images?.[0]?.imageUrl || `https://picsum.photos/400/300?random=${profile.id}`;
  const profileTags = profile.tags || [];
  
  // Calculate stats based on profile data
  const posts = Math.floor(Math.random() * 10) + 1;
  const likes = Math.floor(Math.random() * 1000) + 100;
  const rating = parseFloat(profile.rating || '4.7');
  const subscribers = parseInt(profile.reviewCount || '1334');

  // Map category to content type
  const getContentType = (category: string) => {
    const contentTypes: { [key: string]: string } = {
      'Adult Entertainment': 'Girl-Next-Door Content',
      'Fitness': 'Fitness Content',
      'Lifestyle': 'Lifestyle Content',
      'Art': 'Artistic Content',
      'Music': 'Music Content',
      'Photography': 'Photography Content'
    };
    return contentTypes[category] || 'Premium Content';
  };

  // Generate specialties based on tags and category
  const getSpecialties = () => {
    const baseSpecialties = ['Authentic', 'Sweet', 'Personal'];
    if (profileTags.length > 0) {
      return [...baseSpecialties, ...profileTags.slice(0, 3)];
    }
    return [...baseSpecialties, 'Girl Next Door', 'Genuine'];
  };

  const specialties = getSpecialties();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Cover/Header Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/400/300?random=${profile.id}-cover`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-8">
        {/* Profile Image */}
        <div className="relative -mt-16 mb-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden border-4 border-black bg-gray-800">
            <img
              src={coverImage}
              alt={profile.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`;
              }}
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-4">
          {/* Name */}
          <h1 className="text-3xl font-bold text-white">
            {profile.name}
          </h1>

          {/* Content Type */}
          <h2 className="text-xl text-purple-400 font-medium">
            {getContentType(profile.category)}
          </h2>

          {/* Location, Rating, Subscribers */}
          <div className="flex items-center gap-4 text-gray-300 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{profile.location || 'Austin'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{rating} rating</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{subscribers.toLocaleString()} subscribers</span>
            </div>
          </div>

          {/* Category Badge */}
          <div>
            <Badge 
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm"
              data-testid="badge-category"
            >
              {profile.category === 'Adult Entertainment' ? 'Amateur' : profile.category}
            </Badge>
          </div>

          {/* About Section */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">About</h3>
            <p className="text-gray-300 leading-relaxed">
              {profile.description || "Sweet and authentic girl-next-door creating genuine content that feels personal and intimate."}
            </p>
          </div>

          {/* Specialties */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-white">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty, index) => (
                <Badge 
                  key={index}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm"
                  data-testid={`badge-specialty-${index}`}
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{posts}</div>
              <div className="text-gray-400 text-sm">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{likes.toLocaleString()}</div>
              <div className="text-gray-400 text-sm">Likes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}