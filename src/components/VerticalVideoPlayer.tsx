import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Video } from 'lucide-react';

interface VerticalVideoPlayerProps {
  videoUrl: string;
}

export const VerticalVideoPlayer: React.FC<VerticalVideoPlayerProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);

  // Reset play state if videoUrl changes
  useEffect(() => {
    setIsPlaying(false);
  }, [videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
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

  if (!videoUrl) {
    return (
      <div className="w-full max-w-[420px] aspect-[9/16] mx-auto bg-black rounded-3xl border border-slate-800 shadow-xl flex flex-col items-center justify-center text-slate-500 p-6 text-center">
        <Video className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-sm font-semibold text-slate-400">Video Not Uploaded Yet</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* 9:16 Portrait Container (Reels / Shorts Style) */}
      <div
        onClick={togglePlay}
        onMouseEnter={() => setShowControlsOverlay(true)}
        className="relative w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 cursor-pointer group select-none flex items-center justify-center"
      >
        {/* 
          Video Element:
          - object-contain: NEVER stretches, NEVER crops, NEVER distorts
          - bg-black: Letterboxes cleanly if aspect ratio differs from 9:16
          - Plays inline for mobile browsers
        */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain bg-black"
          playsInline
          loop
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Center Play Button Overlay when paused */}
        {!isPlaying && (
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
            className="p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Bottom subtle progress indicator / controls on hover */}
        {isPlaying && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-2 rounded-full bg-black/40 backdrop-blur-xs text-xs flex items-center gap-1.5">
              <Pause className="w-3.5 h-3.5" fill="currentColor" />
              <span>Tap to pause</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
