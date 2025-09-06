import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface MediaPlayerProps {
  src: string;
  poster?: string;
  contentType: 'image' | 'video';
  alt?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export default function MediaPlayer({
  src,
  poster,
  contentType,
  alt = '',
  className = '',
  controls = true,
  autoPlay = false,
  muted = true,
  onClick
}: MediaPlayerProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    console.error('❌ Image error details:', {
      src: img.src,
      alt: img.alt,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      originalSrc: src,
      event: e.type
    });
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    console.error('❌ Video error details:', {
      src: video.src,
      poster: video.poster,
      networkState: video.networkState,
      readyState: video.readyState,
      error: video.error ? {
        code: video.error.code,
        message: video.error.message
      } : null,
      originalSrc: src,
      event: e.type
    });
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    console.log('Video loaded successfully:', { src, poster });
    setVideoError(false);
  };

  // Helper function for Twitter image proxy
  const getImageSource = (imageSrc: string) => {
    if (imageSrc && imageSrc.includes('pbs.twimg.com')) {
      // Use our proxy for Twitter images
      return `/api/image-proxy?url=${encodeURIComponent(imageSrc)}`;
    }
    return imageSrc;
  };

  // Helper function for Twitter video proxy
  const getVideoSource = (videoSrc: string) => {
    if (videoSrc && videoSrc.includes('video.twimg.com')) {
      // Use our proxy for Twitter videos
      return `/api/video-proxy?url=${encodeURIComponent(videoSrc)}`;
    }
    return videoSrc;
  };

  if (contentType === 'image') {
    const imageSource = getImageSource(src);
    
    return (
      <div className={`relative ${className}`} onClick={onClick}>
        <img
          src={imageSource}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        {imageError && (
          <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <RotateCcw className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Image failed to load</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Handle video content
  const videoSource = getVideoSource(src);
  const posterSource = poster ? getImageSource(poster) : undefined;

  // Console log video props for debugging
  if (contentType === 'video') {
    console.log('🎥 Video MediaPlayer props:', { 
      originalSrc: src, 
      proxiedSrc: videoSource, 
      originalPoster: poster, 
      proxiedPoster: posterSource, 
      contentType 
    });
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <video 
        controls={controls} 
        width="100%" 
        poster={posterSource}
        className="w-full h-full object-cover"
        muted={muted}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        onError={handleVideoError}
        onLoadedData={handleVideoLoad}
        onCanPlay={() => console.log('Video can play:', videoSource)}
      >
        <source src={videoSource} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {videoError && (
        <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <RotateCcw className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Video failed to load</p>
            <p className="text-xs mt-1">Source: {src?.substring(0, 50)}...</p>
          </div>
        </div>
      )}
    </div>
  );
}