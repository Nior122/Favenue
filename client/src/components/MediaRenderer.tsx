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
  const [videoFallback, setVideoFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  if (isVideo && item.videoUrl && !videoFallback) {
    const videoSource = getVideoSource(item.videoUrl);
    const posterSource = item.thumbnailUrl ? getImageSource(item.thumbnailUrl) : undefined;

    console.log('🎥 MediaRenderer video props:', { 
      originalVideoUrl: item.videoUrl, 
      proxiedVideoUrl: videoSource, 
      originalThumbnail: item.thumbnailUrl, 
      proxiedThumbnail: posterSource,
      contentType: item.contentType,
      videoFallback: videoFallback
    });

    return (
      <div className={`media media-video relative ${className}`} onClick={onClick}>
        {isLoading && (
          <div className="absolute inset-0 w-full h-full bg-gray-900/50 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Loading video...</p>
            </div>
          </div>
        )}
        <video
          controls={controls}
          preload="metadata"
          poster={posterSource || undefined}
          style={{ width: '100%', height: 'auto', maxHeight: '80vh' }}
          muted={muted}
          autoPlay={autoPlay}
          playsInline
          crossOrigin="anonymous"
          onLoadStart={() => {
            setIsLoading(true);
            console.log('🔄 Video loading started:', videoSource);
          }}
          onError={(e) => {
            console.error('❌ MediaRenderer video error - falling back to thumbnail:', {
              src: e.currentTarget.src,
              poster: e.currentTarget.poster,
              error: e.currentTarget.error,
              originalVideoUrl: item.videoUrl,
              thumbnailUrl: item.thumbnailUrl
            });
            setIsLoading(false);
            setVideoError(true);
            // Automatically fallback to thumbnail display after 2 seconds
            setTimeout(() => {
              if (item.thumbnailUrl) {
                console.log('🔄 Auto-falling back to thumbnail image:', item.thumbnailUrl);
                setVideoFallback(true);
              }
            }, 2000);
          }}
          onLoadedData={() => {
            console.log('✅ MediaRenderer video loaded successfully:', videoSource);
            setIsLoading(false);
            setVideoError(false);
          }}
          onCanPlay={() => {
            console.log('✅ Video can play:', videoSource);
            setIsLoading(false);
          }}
        >
          <source src={videoSource} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {videoError && (
          <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <RotateCcw className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Video failed to load</p>
              {item.thumbnailUrl && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoFallback(true);
                  }}
                  className="text-xs mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Show Thumbnail
                </button>
              )}
              <p className="text-xs mt-1">Source: {item.videoUrl?.substring(0, 50)}...</p>
            </div>
          </div>
        )}
        {caption && <div className="caption mt-2 text-sm text-gray-600">{caption}</div>}
      </div>
    );
  }

  // Video fallback case - render thumbnail as image when video fails
  if (isVideo && videoFallback && item.thumbnailUrl) {
    const thumbnailSource = getImageSource(item.thumbnailUrl);
    
    return (
      <div className={`media media-video-fallback relative ${className}`} onClick={onClick}>
        <img 
          src={thumbnailSource} 
          alt={caption || 'Video thumbnail'} 
          style={{ width: '100%', height: 'auto' }} 
          className="rounded-lg"
          onError={(e) => {
            console.error('❌ MediaRenderer thumbnail fallback error:', {
              src: e.currentTarget.src,
              originalThumbnail: item.thumbnailUrl
            });
            setImageError(true);
          }}
          onLoad={() => {
            console.log('✅ Video thumbnail fallback loaded:', thumbnailSource);
            setImageError(false);
          }}
        />
        {/* Play button overlay to indicate this is a video */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/60 rounded-full p-3 hover:bg-black/80 transition-colors">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        {/* Badge to indicate video fallback */}
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          Video
        </div>
        {imageError && (
          <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <RotateCcw className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Thumbnail failed to load</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoFallback(false);
                  setVideoError(false);
                }}
                className="text-xs mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry Video
              </button>
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