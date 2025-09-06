import React from 'react';
import MediaRenderer from './MediaRenderer';

export default function VideoTest() {
  const testVideoItem = {
    contentType: 'video',
    videoUrl: 'https://video.twimg.com/amplify_video/1958987542554165248/vid/avc1/720x1280/KqthbZ48-Nbo1xpF.mp4?tag=21',
    thumbnailUrl: 'https://pbs.twimg.com/amplify_video_thumb/1958987542554165248/img/ESXJ32zF5Psjvwq6.jpg',
    title: 'Test Video'
  };

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="text-lg font-bold mb-4">Video Test Component</h2>
      <div className="max-w-md">
        <MediaRenderer 
          item={testVideoItem}
          controls={true}
          muted={true}
        />
      </div>
      <div className="mt-4 text-sm">
        <p><strong>Video URL:</strong> {testVideoItem.videoUrl}</p>
        <p><strong>Thumbnail URL:</strong> {testVideoItem.thumbnailUrl}</p>
        <p><strong>Content Type:</strong> {testVideoItem.contentType}</p>
      </div>
    </div>
  );
}