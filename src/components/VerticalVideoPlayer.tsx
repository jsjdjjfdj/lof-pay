import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Video, Loader2 } from 'lucide-react';
import {
  isFirestoreVideoUrl,
  resolveFirestoreVideoUrl,
} from '../firebase/portalService';

interface VerticalVideoPlayerProps {
  videoUrl: string;
}

export const VerticalVideoPlayer: React.FC<VerticalVideoPlayerProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string>(() =>
    videoUrl && !isFirestoreVideoUrl(videoUrl) ? videoUrl : ''
  );
  const [loadingVideo, setLoadingVideo] = useState<boolean>(() =>
    Boolean(videoUrl && isFirestoreVideoUrl(videoUrl))
  );
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Resolve normal URL or firestore://media/... chunked video into playable src
  useEffect(() => {
    let active = true;
    let createdBlobUrl = '';

    setIsPlaying(false);
    setLoadError(false);

    if (!videoUrl) {
      setResolvedSrc('');
      setLoadingVideo(false);
      return;
    }

    if (!isFirestoreVideoUrl(videoUrl)) {
      setResolvedSrc(videoUrl);
      setLoadingVideo(false);
      return;
    }

    setLoadingVideo(true);
    setResolvedSrc('');

    resolveFirestoreVideoUrl(videoUrl)
      .then((blobUrl) => {
        if (!active) {
          if (blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
          return;
        }
        createdBlobUrl = blobUrl;
        setResolvedSrc(blobUrl);
      })
      .catch((err) => {
        console.warn('Video load notice:', err);
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoadingVideo(false);
      });

    return () => {
      active = false;
      if (createdBlobUrl && createdBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current || !resolvedSrc) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Playback error:', err);
        });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!videoUrl || loadError) {
    return (
      <div className="w-full max-w-[420px] aspect-[9/16] mx-auto bg-black rounded-3xl border border-slate-800 shadow-xl flex flex-col items-center justify-center text-slate-500 p-6 text-center">
        <Video className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-sm font-semibold text-slate-400">
          {loadError ? 'Video Unavailable' : 'Video Not Uploaded Yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* 9:16 Portrait Container (Reels / Shorts Style) */}
      <div
        onClick={togglePlay}
        className="relative w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 cursor-pointer group select-none flex items-center justify-center"
      >
        {loadingVideo || !resolvedSrc ? (
          <div className="flex flex-col items-center justify-center text-slate-300 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <span className="text-xs font-medium text-slate-400">Loading video...</span>
          </div>
        ) : (
          <>
            {/* 
              Video Element:
              - object-contain: NEVER stretches, NEVER crops, NEVER distorts
              - bg-black: Letterboxes cleanly if aspect ratio differs from 9:16
              - Plays inline for mobile browsers
            */}
            <video
              ref={videoRef}
              src={resolvedSrc || undefined}
              className="w-full h-full object-contain bg-black"
              playsInline
              loop
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setLoadError(true)}
            />

            {/* Center Play Button Overlay when paused */}
            {!isPlaying && resolvedSrc && (
              <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center transition-opacity duration-200">
                <div className="w-20 h-20 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-200 backdrop-blur-xs">
                  <Play className="w-9 h-9 ml-1" fill="currentColor" />
                </div>
              </div>
            )}

            {/* Top Floating Mute Toggle */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom subtle control hint on hover */}
            {isPlaying && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-2 rounded-full bg-black/40 backdrop-blur-xs text-xs flex items-center gap-1.5">
                  <Pause className="w-3.5 h-3.5" fill="currentColor" />
                  <span>Tap to pause</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
