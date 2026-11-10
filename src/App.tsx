import React, { useState, useEffect, useRef } from 'react';
import { subscribeToPortalConfig } from './firebase/portalService';
import { defaultPortalConfig } from './data/defaultData';
import { PortalConfig } from './types';

import { QrCodeCard } from './components/QrCodeCard';
import { VerticalVideoPlayer } from './components/VerticalVideoPlayer';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [config, setConfig] = useState<PortalConfig>(defaultPortalConfig);
  const [currentPath, setCurrentPath] = useState(
    () => window.location.pathname + window.location.hash + window.location.search
  );
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<any>(null);

  // Sync config from Firestore in real-time
  useEffect(() => {
    const unsubConfig = subscribeToPortalConfig((updatedConfig) => {
      setConfig(updatedConfig);
    });

    const handleLocationChange = () => {
      const full = window.location.pathname + window.location.hash + window.location.search;
      setCurrentPath(full);
      if (full.toLowerCase().includes('admin')) {
        setIsAdminOpen(true);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Fast URL check for AI Studio preview address bar changes
    const pollInterval = setInterval(() => {
      const full = window.location.pathname + window.location.hash + window.location.search;
      if (full.toLowerCase().includes('admin') && !isAdminOpen) {
        setCurrentPath(full);
        setIsAdminOpen(true);
      }
    }, 400);

    // Keyboard shortcut listener: Ctrl+A / Ctrl+Shift+A / Alt+A to open Admin
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      
      // Ctrl+A or Cmd+A outside of text input fields
      if (!isInput && (e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsAdminOpen(true);
        if (!window.location.pathname.toLowerCase().includes('admin')) {
          window.history.pushState(null, '', '/admin');
          setCurrentPath('/admin');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial check on mount
    if (window.location.pathname.toLowerCase().includes('admin') ||
        window.location.hash.toLowerCase().includes('admin') ||
        window.location.search.toLowerCase().includes('admin')) {
      setIsAdminOpen(true);
    }

    return () => {
      unsubConfig();
      clearInterval(pollInterval);
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminOpen]);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    if (path.toLowerCase().includes('admin')) {
      setIsAdminOpen(true);
    } else {
      setIsAdminOpen(false);
    }
  };

  // Secret gesture for mobile/touch admins: 3 taps within 1.2s anywhere on public container
  const handleContainerClick = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      setIsAdminOpen(true);
      navigateTo('/admin');
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 1200);
  };

  // Check if admin mode is currently active
  const isDirectAdminUrl =
    isAdminOpen ||
    currentPath.toLowerCase().includes('admin') ||
    window.location.pathname.toLowerCase().includes('admin') ||
    window.location.hash.toLowerCase().includes('admin') ||
    window.location.search.toLowerCase().includes('admin');

  // IF ADMIN ROUTE (/admin or triggered via Ctrl+A) -> RENDER ADMIN DASHBOARD
  if (isDirectAdminUrl) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 py-6 sm:py-10 px-4">
        <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between">
          <button
            onClick={() => navigateTo('/')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span>← গ্রাহক সাইট দেখুন (View Public Website)</span>
          </button>
          <span className="text-xs text-slate-500 font-mono font-bold">Admin Route: /admin</span>
        </div>

        <AdminDashboard
          isOpen={true}
          isPageMode={true}
          onClose={() => navigateTo('/')}
          config={config}
        />
      </div>
    );
  }

  // PUBLIC CUSTOMER VIEW: STRICTLY ONLY TWO FEATURES
  // 1. QR CODE PHOTO
  // 2. VERTICAL VIDEO PLAYER (9:16)
  // ZERO admin buttons, links, or controls visible to the public.
  return (
    <div
      onClick={handleContainerClick}
      className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center py-6 sm:py-10 px-4 selection:bg-blue-600 selection:text-white cursor-default"
    >
      <main className="w-full max-w-[420px] mx-auto space-y-8 sm:space-y-10">
        {/* 1. QR CODE PHOTO (Large image + Download button) */}
        <section aria-label="QR Code Payment">
          <QrCodeCard qrImageUrl={config.qrImageUrl} />
        </section>

        {/* 2. VERTICAL VIDEO PLAYER (9:16 Portrait Reels/Shorts style) */}
        <section aria-label="Tutorial Video">
          <VerticalVideoPlayer videoUrl={config.videoUrl} />
        </section>
      </main>
    </div>
  );
}
