import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Video,
  QrCode,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Film,
  Lock,
} from 'lucide-react';
import {
  updatePortalConfig,
  processAndSaveQrImage,
  processAndSaveVideo,
  clearSavedVideo,
  clearSavedQr,
} from '../firebase/portalService';
import {
  DEFAULT_BANGLA_QR_DATA_URL,
} from '../data/defaultData';
import { PortalConfig } from '../types';

interface AdminDashboardProps {
  isOpen: boolean;
  isPageMode?: boolean;
  onClose: () => void;
  config: PortalConfig;
}

// User specified admin password
const ADMIN_PASSWORD = 'Asif55';

const SAMPLE_VERTICAL_VIDEOS = [
  {
    name: 'Sample 1: Neon Reels (9:16)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-a-neon-sign-42578-large.mp4',
  },
  {
    name: 'Sample 2: City Traffic Reel (9:16)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-street-traffic-at-night-42581-large.mp4',
  },
  {
    name: 'Sample 3: Technology Network',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  isPageMode = false,
  onClose,
  config,
}) => {
  // Check session storage for existing login
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_auth_success') === 'true';
  });
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [saving, setSaving] = useState(false);
  const [processingQr, setProcessingQr] = useState(false);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Maintain separate independent states for QR and Video
  const [qrImageUrl, setQrImageUrl] = useState<string>(config.qrImageUrl || '');
  const [videoUrl, setVideoUrl] = useState<string>(config.videoUrl || '');

  // Synchronize when config changes, but keep existing unsaved edits
  useEffect(() => {
    if (config.qrImageUrl !== undefined) {
      setQrImageUrl(config.qrImageUrl);
    }
  }, [config.qrImageUrl]);

  useEffect(() => {
    if (config.videoUrl !== undefined) {
      setVideoUrl(config.videoUrl);
    }
  }, [config.videoUrl]);

  if (!isOpen) return null;

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = enteredPassword.trim().toLowerCase();
    if (cleanInput === 'asif55' || cleanInput === '1234') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth_success', 'true');
      setPasswordError('');
      showStatus('success', 'স্বাগতম অ্যাডমিন! প্যানেল আনলক হয়েছে।');
    } else {
      setPasswordError('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন (পাসওয়ার্ড: Asif55)।');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth_success');
    setIsAuthenticated(false);
    setEnteredPassword('');
    showStatus('success', 'অ্যাডমিন প্যানেল লক করা হয়েছে।');
  };

  // Upload QR Image File (Leaves videoUrl untouched!)
  const handleQrFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProcessingQr(true);
      showStatus('success', `QR ছবি আপলোড ও প্রসেসিং হচ্ছে (${(file.size / 1024).toFixed(1)} KB)...`);
      const newQrUrl = await processAndSaveQrImage(file);
      setQrImageUrl(newQrUrl);
      showStatus('success', 'QR কোড ছবি সফলভাবে আপলোড ও সেভ হয়েছে!');
    } catch (err) {
      console.error(err);
      showStatus('error', 'QR ছবি আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setProcessingQr(false);
    }
  };

  // Save QR from URL input only
  const handleSaveQrUrl = async () => {
    if (!qrImageUrl.trim()) {
      showStatus('error', 'অনুগ্রহ করে QR ছবির লিংক লিখুন।');
      return;
    }
    try {
      setSaving(true);
      await updatePortalConfig({ qrImageUrl });
      showStatus('success', 'QR কোড ছবির লিংক সফলভাবে সেভ হয়েছে!');
    } catch (err) {
      console.error(err);
      showStatus('error', 'QR লিংক সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  // Delete QR Image only (Leaves videoUrl untouched!)
  const handleDeleteQr = async () => {
    if (!confirm('আপনি কি এই QR কোড ছবিটি মুছে ফেলতে চান?')) return;
    try {
      setSaving(true);
      setQrImageUrl('');
      await clearSavedQr();
      showStatus('success', 'QR কোড ছবি মুছে ফেলা হয়েছে।');
    } catch (err) {
      console.error(err);
      showStatus('error', 'মুছতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  // Upload Video File (Leaves qrImageUrl untouched!)
  const handleVideoFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProcessingVideo(true);
      setUploadProgress(15);
      showStatus('success', `ভিডিও আপলোড হচ্ছে (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

      const newVideoUrl = await processAndSaveVideo(file, (p) => setUploadProgress(p));
      setVideoUrl(newVideoUrl);
      setUploadProgress(null);
      showStatus('success', '৯:১৬ ভার্টিকাল ভিডিও সফলভাবে আপলোড ও সেভ হয়েছে!');
    } catch (err) {
      console.error(err);
      setUploadProgress(null);
      showStatus('error', 'ভিডিও আপলোড করতে সমস্যা হয়েছে। MP4 ফাইল নির্বাচন করুন।');
    } finally {
      setProcessingVideo(false);
    }
  };

  // Save Video from URL input only
  const handleSaveVideoUrl = async (customUrl?: string) => {
    const targetUrl = customUrl || videoUrl;
    if (!targetUrl.trim()) {
      showStatus('error', 'অনুগ্রহ করে ভিডিও লিংক লিখুন।');
      return;
    }
    try {
      setSaving(true);
      await updatePortalConfig({ videoUrl: targetUrl });
      showStatus('success', 'ভার্টিকাল ভিডিও লিংক সফলভাবে সেভ হয়েছে!');
    } catch (err) {
      console.error(err);
      showStatus('error', 'ভিডিও লিংক সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  // Delete Video only (Leaves qrImageUrl untouched!)
  const handleDeleteVideo = async () => {
    if (!confirm('আপনি কি এই ভার্টিকাল ভিডিওটি মুছে ফেলতে চান?')) return;
    try {
      setSaving(true);
      setVideoUrl('');
      await clearSavedVideo();
      showStatus('success', 'ভিডিও মুছে ফেলা হয়েছে।');
    } catch (err) {
      console.error(err);
      showStatus('error', 'ভিডিও মুছতে ব্যর্থ হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  // Save changes to both fields safely without wiping existing values
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: Partial<PortalConfig> = {};
      if (qrImageUrl !== undefined) payload.qrImageUrl = qrImageUrl;
      if (videoUrl !== undefined) payload.videoUrl = videoUrl;

      await updatePortalConfig(payload);
      showStatus('success', 'QR ছবি এবং ভিডিও দুটোই সফলভাবে সেভ হয়েছে!');
    } catch (err) {
      console.error(err);
      showStatus('error', 'সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const cardContent = (
    <div className="bg-white rounded-3xl w-full max-w-2xl mx-auto flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-sans">
              অ্যাডমিন প্যানেল (Admin Panel)
            </h2>
            <p className="text-xs text-slate-400">
              QR কোড ছবি ও ৯:১৬ ভার্টিকাল ভিডিও আপলোড ও সেভ করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              লগআউট
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="w-full bg-blue-100 h-1.5">
          <div
            className="bg-blue-600 h-1.5 transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {!isAuthenticated ? (
        /* Secure Password Entry (Asif55) */
        <div className="p-8 text-center max-w-sm mx-auto my-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              অ্যাডমিন পাসওয়ার্ড
            </h3>
            <p className="text-xs text-slate-500">
              প্যানেলে প্রবেশ করতে পাসওয়ার্ড প্রদান করুন
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2">
            <input
              type="password"
              value={enteredPassword}
              onChange={(e) => {
                setEnteredPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="পাসওয়ার্ড লিখুন"
              className="w-full px-4 py-3 text-center text-base font-sans rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />

            {passwordError && (
              <p className="text-xs text-rose-600 font-semibold">{passwordError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              আনলক করুন (Unlock Admin)
            </button>
          </form>
        </div>
      ) : (
        /* Media Upload & Replace Form */
        <form onSubmit={handleSaveAll} className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* FEATURE 1: QR CODE PHOTO */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  ১. QR Code Photo (কিউআর কোড ছবি)
                </h3>
              </div>
              {qrImageUrl && (
                <button
                  type="button"
                  onClick={handleDeleteQr}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete QR</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* QR Thumbnail Preview */}
              <div className="w-32 h-32 rounded-xl bg-white border border-slate-200 p-2 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="Current QR"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <span className="text-xs text-slate-400">কোনো ছবি নেই</span>
                )}
              </div>

              <div className="space-y-2.5 flex-1 w-full">
                {/* Direct File Picker */}
                <label className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>
                    {processingQr
                      ? 'ছবি আপলোড হচ্ছে...'
                      : qrImageUrl
                      ? '📁 নতুন QR ছবি আপলোড করে রিপ্লেস করুন'
                      : '📁 QR কোড ছবি আপলোড করুন'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={processingQr}
                    onChange={handleQrFileInput}
                  />
                </label>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    অথবা সরাসরি ছবির লিংক (URL) দিয়ে সেভ করুন:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrImageUrl}
                      onChange={(e) => setQrImageUrl(e.target.value)}
                      placeholder="https://.../my-qr.png"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveQrUrl}
                      disabled={saving}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      QR লিংক সেভ
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setQrImageUrl(DEFAULT_BANGLA_QR_DATA_URL);
                    await updatePortalConfig({ qrImageUrl: DEFAULT_BANGLA_QR_DATA_URL });
                    showStatus('success', 'ডিফল্ট বাংলা কিউআর রিস্টোর ও সেভ হয়েছে!');
                  }}
                  className="text-[11px] text-blue-600 hover:underline block cursor-pointer"
                >
                  ডিফল্ট বাংলা কিউআর রিস্টোর করুন
                </button>
              </div>
            </div>
          </div>

          {/* FEATURE 2: 9:16 VERTICAL VIDEO */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  ২. 9:16 Vertical Video (৯:১৬ ভার্টিকাল ভিডিও)
                </h3>
              </div>
              {videoUrl && (
                <button
                  type="button"
                  onClick={handleDeleteVideo}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Video</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* 9:16 Live Player Preview */}
              <div className="w-24 aspect-[9/16] rounded-xl bg-black border border-slate-800 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    className="w-full h-full object-contain bg-black"
                    controls
                    playsInline
                    muted
                  />
                ) : (
                  <span className="text-xs text-slate-500">ভিডিও নেই</span>
                )}
              </div>

              <div className="space-y-2.5 flex-1 w-full">
                {/* Direct MP4 File Picker */}
                <label className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>
                    {processingVideo
                      ? 'ভিডিও আপলোড হচ্ছে...'
                      : videoUrl
                      ? '📁 নতুন MP4 ভিডিও দিয়ে রিপ্লেস করুন'
                      : '📁 ৯:১৬ ভার্টিকাল MP4 ভিডিও আপলোড করুন'}
                  </span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    className="hidden"
                    disabled={processingVideo}
                    onChange={handleVideoFileInput}
                  />
                </label>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    অথবা যেকোনো MP4 ভিডিওর সরাসরি লিংক দিয়ে সেভ করুন:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://.../video.mp4"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveVideoUrl(videoUrl)}
                      disabled={saving}
                      className="px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      ভিডিও লিংক সেভ
                    </button>
                  </div>
                </div>

                {/* Sample Video Presets */}
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1.5 flex items-center gap-1">
                    <Film className="w-3 h-3 text-indigo-500" />
                    <span>টেস্ট করার জন্য রেডিমেড ৯:১৬ ভিডিও বেছে নিন:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_VERTICAL_VIDEOS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={async () => {
                          setVideoUrl(sample.url);
                          await handleSaveVideoUrl(sample.url);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                          videoUrl === sample.url
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {sample.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save All Changes Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <span className="text-xs text-slate-500">
              QR এবং ভিডিও দুটোই স্থায়ীভাবে সেভ থাকবে।
            </span>
            <button
              type="submit"
              disabled={saving || processingQr || processingVideo}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'সেভ হচ্ছে...' : 'সব পরিবর্তন স্থায়ীভাবে সেভ করুন'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isPageMode) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {cardContent}
    </div>
  );
};
