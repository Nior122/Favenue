import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { ProfileImage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import MediaPlayer from "@/components/MediaPlayer";
import MediaRenderer from "@/components/MediaRenderer";

interface MediaGalleryProps {
  images: ProfileImage[];
}

export default function ImageGallery({ images }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") previousImage();
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="gallery-grid">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden"
            onClick={() => openLightbox(index)}
            data-testid={`gallery-image-${index}`}
          >
            {(image as any).contentType === 'video' && (image as any).videoUrl && (image as any).videoUrl.trim() !== '' ? (
              <MediaRenderer
                item={{
                  contentType: 'video',
                  videoUrl: (image as any).videoUrl,
                  thumbnailUrl: (image as any).thumbnailUrl,
                  title: (image as any).description || (image as any).title || `Portfolio Item ${index + 1}`
                }}
                className="w-full aspect-video object-cover transition-transform group-hover:scale-105"
                controls={false}
                muted={true}
              />
            ) : (
              <img
                src={(image as any).imageUrl || (image as any).videoUrl}
                alt={(image as any).description || (image as any).title || `Portfolio Item ${index + 1}`}
                className="w-full aspect-video object-cover transition-transform group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-2">
                <svg className="w-6 h-6 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          data-testid="lightbox"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2"
            data-testid="button-close-lightbox"
          >
            <X className="w-6 h-6" />
          </Button>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  previousImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2"
                data-testid="button-previous-image"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2"
                data-testid="button-next-image"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {(images[currentImageIndex] as any)?.contentType === 'video' ? (
            <MediaRenderer
              item={{
                contentType: 'video',
                videoUrl: (images[currentImageIndex] as any)?.videoUrl,
                thumbnailUrl: (images[currentImageIndex] as any)?.thumbnailUrl,
                title: (images[currentImageIndex] as any)?.description || (images[currentImageIndex] as any)?.title || `Portfolio Item ${currentImageIndex + 1}`
              }}
              className="max-w-full max-h-full object-contain"
              controls={true}
              onClick={(e) => e.stopPropagation()}
              autoPlay={true}
            />
          ) : (
            <img
              src={(images[currentImageIndex] as any)?.imageUrl || (images[currentImageIndex] as any)?.videoUrl}
              alt={(images[currentImageIndex] as any)?.description || (images[currentImageIndex] as any)?.title || `Portfolio Item ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
              data-testid="lightbox-image"
            />
          )}

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm" data-testid="image-counter">
            {currentImageIndex + 1} of {images.length}
          </div>
        </div>
      )}
    </>
  );
}
