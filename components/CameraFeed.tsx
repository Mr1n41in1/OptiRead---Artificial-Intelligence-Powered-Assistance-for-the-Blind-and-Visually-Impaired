import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface CameraFeedProps {
    onStreamReady: () => void;
    onStreamError: (error: string) => void;
}

export interface CameraFeedHandle {
  captureFrame: () => string | null;
}

const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(({ onStreamReady, onStreamError }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          onStreamReady();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        onStreamError("Camera access was denied. Please enable camera permissions in your browser settings.");
      }
    };

    getCameraStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');

        const MAX_DIMENSION = 1024;
        const scale = Math.min(MAX_DIMENSION / video.videoWidth, MAX_DIMENSION / video.videoHeight, 1);
        const scaledWidth = video.videoWidth * scale;
        const scaledHeight = video.videoHeight * scale;

        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, scaledWidth, scaledHeight);
          return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        }
      }
      return null;
    }
  }));

  return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />;
});

export default CameraFeed;
