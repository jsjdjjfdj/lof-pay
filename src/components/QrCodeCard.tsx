import React, { useState } from 'react';
import { Download, Check, QrCode } from 'lucide-react';

interface QrCodeCardProps {
  qrImageUrl: string;
}

export const QrCodeCard: React.FC<QrCodeCardProps> = ({ qrImageUrl }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    if (!qrImageUrl) return;
    try {
      setDownloading(true);

      if (qrImageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = qrImageUrl;
        link.download = 'payment-qr-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(qrImageUrl, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'payment-qr-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch {
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.target = '_blank';
      link.download = 'payment-qr-code.png';
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } finally {
      setDownloading(false);
    }
  };

  if (!qrImageUrl) {
    return (
      <div className="w-full max-w-[420px] mx-auto bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <QrCode className="w-8 h-8" />
        </div>
        <p className="text-sm font-semibold text-slate-500">QR Code Not Uploaded Yet</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto text-center">
      {/* Large Centered QR Code Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xl shadow-slate-100 transition-all">
        <div className="w-full aspect-square bg-white rounded-2xl p-2 flex items-center justify-center overflow-hidden">
          <img
            src={qrImageUrl}
            alt="Payment QR Code"
            className="w-full h-full object-contain select-none"
          />
        </div>

        {/* Download QR Button */}
        <div className="mt-5">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99] ${
              downloadSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
            }`}
          >
            {downloadSuccess ? (
              <>
                <Check className="w-5 h-5 text-white" />
                <span>Downloaded Successfully</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>{downloading ? 'Downloading...' : 'Download QR'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
