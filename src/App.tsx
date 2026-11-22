import React, { useState, useEffect, useRef } from 'react';
import { subscribeToPortalConfig } from './firebase/portalService';
import { defaultPortalConfig } from './data/defaultData';
import { PortalConfig } from './types';

import { QrCodeCard } from './components/QrCodeCard';
import { VerticalVideoPlayer } from './components/VerticalVideoPlayer';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [config, setConfig] = useState<PortalConfig>(defaultPortalConfig);
  
  // View mode can be 'public' or 'admin'
  const [viewMode, setViewMode] = useState<'public' | 'admin'>(() => {
    const forcedPublic = sessionStorage.getItem('admin_forced_public');
    if (forcedPublic === 'true') return 'public';
    
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (path.includes('admin') || hash.includes('admin') || search.includes('admin')) {
      return 'admin';
    }
    return 'public';
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_auth_success') === 'true';
  });

  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<any>(null);

  // Sync config from Firestore in real-time
  useEffect(() => {
    const unsubConfig = subscribeToPortalConfig((updatedConfig) => {
      setConfig(updatedConfig);
    });

    const checkAdminLogin = () => {
      setIsAdminLoggedIn(sessionStorage.getItem('admin_auth_success') === 'true');
    };

    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('admin') || hash.includes('admin') || search.includes('admin')) {
        sessionStorage.removeItem('admin_forced_public');
        setViewMode('admin');
      }
      checkAdminLogin();
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('admin-auth-changed', checkAdminLogin);

    // Keyboard shortcut listener: Ctrl+A / Ctrl+Shift+A to toggle Admin
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      
      // Ctrl+A or Cmd+A outside of text input fields
      if (!isInput && (e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        sessionStorage.removeItem('admin_forced_public');
        setViewMode('admin');
        window.history.pushState(null, '', '/admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubConfig();
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('admin-auth-changed', checkAdminLogin);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showPublicWebsite = () => {
    sessionStorage.setItem('admin_forced_public', 'true');
    setViewMode('public');
    window.history.pushState(null, '', '/');
  };

  const showAdminDashboard = () => {
    sessionStorage.removeItem('admin_forced_public');
    setViewMode('admin');
    window.history.pushState(null, '', '/admin');
  };

  // Secret gesture: 3 quick taps anywhere on public container for mobile admin
  const handleContainerClick = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      showAdminDashboard();
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 1200);
  };

  // IF ADMIN MODE -> RENDER ADMIN DASHBOARD
  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 py-6 sm:py-10 px-4">
        <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between">
          <button
            onClick={showPublicWebsite}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <span>← গ্রাহক সাইট দেখুন (View Public Website)</span>
          </button>
          <span className="text-xs text-slate-500 font-mono font-bold">Admin Route: /admin</span>
        </div>

        <AdminDashboard
          isOpen={true}
          isPageMode={true}
          onClose={showPublicWebsite}
          config={config}
        />
      </div>
    );
  }

  // PUBLIC CUSTOMER VIEW: STRICTLY ONLY TWO FEATURES
  // 1. QR CODE PHOTO
  // 2. VERTICAL VIDEO PLAYER (9:16)
  // Public visitors see ZERO admin elements.
  return (
    <div
      onClick={handleContainerClick}
      className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center py-6 sm:py-10 px-4 selection:bg-blue-600 selection:text-white cursor-default relative"
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

      {/* Floating Admin Switcher: ONLY visible to logged-in admin (sessionStorage). Public visitors NEVER see this! */}
      {isAdminLoggedIn && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={showAdminDashboard}
            className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg border border-slate-700 flex items-center gap-2 cursor-pointer backdrop-blur-xs transition-all opacity-80 hover:opacity-100"
            title="Logged in as Admin"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>⚙️ অ্যাডমিন প্যানেল (Admin Panel)</span>
          </button>
        </div>
      )}
    </div>
  );
}
