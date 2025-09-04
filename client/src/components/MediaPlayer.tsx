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

  const handleImageError = () => {
    console.log('Image failed to load:', src);
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video failed to load:', { src, poster, error: e });
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    console.log('Video loaded successfully:', { src, poster });
    setVideoError(false);
  };

  if (contentType === 'image') {
    return (
      <div className={`relative ${className}`} onClick={onClick}>
        <img
          src={src}
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

  // Use video proxy for Twitter videos to bypass CORS
  const getVideoSource = (videoSrc: string) => {
    if (videoSrc && videoSrc.includes('video.twimg.com')) {
      // Use our proxy for Twitter videos
      return `/api/video-proxy?url=${encodeURIComponent(videoSrc)}`;
    }
    return videoSrc;
  };

  const videoSource = getVideoSource(src);

  // Console log video props for debugging
  if (contentType === 'video') {
    console.log('🎥 Video MediaPlayer props:', { originalSrc: src, proxiedSrc: videoSource, poster, contentType });
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <video 
        controls={controls} 
        width="100%" 
        poster={poster}
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