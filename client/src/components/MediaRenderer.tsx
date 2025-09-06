import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface MediaRendererProps {
  item: {
    contentType?: string;
    videoUrl?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    url?: string;
    caption?: string;
    title?: string;
    description?: string;
  };
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export default function MediaRenderer({
  item,
  className = '',
  controls = true,
  autoPlay = false,
  muted = true,
  onClick
}: MediaRendererProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const caption = item.caption || item.title || item.description || '';

  // Helper function for Twitter image proxy
  const getImageSource = (imageSrc: string) => {
    if (imageSrc && imageSrc.includes('pbs.twimg.com')) {
      return `/api/image-proxy?url=${encodeURIComponent(imageSrc)}`;
    }
    return imageSrc;
  };

  // Helper function for Twitter video proxy
  const getVideoSource = (videoSrc: string) => {
    if (videoSrc && videoSrc.includes('video.twimg.com')) {
      return `/api/video-proxy?url=${encodeURIComponent(videoSrc)}`;
    }
    return videoSrc;
  };

  // Determine if this is a video item
  const isVideo = item.contentType === 'video' || (item.videoUrl && item.videoUrl.trim() !== '');

  if (isVideo && item.videoUrl) {
    const videoSource = getVideoSource(item.videoUrl);
    const posterSource = item.thumbnailUrl ? getImageSource(item.thumbnailUrl) : undefined;

    console.log('🎥 MediaRenderer video props:', { 
      originalVideoUrl: item.videoUrl, 
      proxiedVideoUrl: videoSource, 
      originalThumbnail: item.thumbnailUrl, 
      proxiedThumbnail: posterSource,
      contentType: item.contentType
    });

    return (
      <div className={`media media-video ${className}`} onClick={onClick}>
        <video
          controls={controls}
          preload="metadata"
          poster={posterSource || undefined}
          style={{ width: '100%', height: 'auto', maxHeight: '80vh' }}
          muted={muted}
          autoPlay={autoPlay}
          playsInline
          crossOrigin="anonymous"
          onError={(e) => {
            console.error('❌ MediaRenderer video error:', {
              src: e.currentTarget.src,
              poster: e.currentTarget.poster,
              error: e.currentTarget.error,
              originalVideoUrl: item.videoUrl
            });
            setVideoError(true);
          }}
          onLoadedData={() => {
            console.log('✅ MediaRenderer video loaded:', videoSource);
            setVideoError(false);
          }}
          onCanPlay={() => console.log('✅ Video can play:', videoSource)}
        >
          <source src={videoSource} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {videoError && (
          <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <RotateCcw className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Video failed to load</p>
              <p className="text-xs mt-1">Source: {item.videoUrl?.substring(0, 50)}...</p>
            </div>
          </div>
        )}
        {caption && <div className="caption mt-2 text-sm text-gray-600">{caption}</div>}
      </div>
    );
  }

  // Default image case
  const src = item.imageUrl || item.url || item.thumbnailUrl;
  if (!src) {
    return (
      <div className={`media media-error ${className}`}>
        <div className="w-full h-32 bg-gray-800 flex items-center justify-center">
          <span className="text-gray-400 text-sm">No media available</span>
        </div>
      </div>
    );
  }

  const imageSource = getImageSource(src);

  return (
    <div className={`media media-image ${className}`} onClick={onClick}>
      <img 
        src={imageSource} 
        alt={caption || 'image'} 
        style={{ width: '100%', height: 'auto' }} 
        onError={(e) => {
          console.error('❌ MediaRenderer image error:', {
            src: e.currentTarget.src,
            originalSrc: src
          });
          setImageError(true);
        }}
        onLoad={() => setImageError(false)}
      />
      {imageError && (
        <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <RotateCcw className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Image failed to load</p>
          </div>
        </div>
      )}
      {caption && <div className="caption mt-2 text-sm text-gray-600">{caption}</div>}
    </div>
  );
}