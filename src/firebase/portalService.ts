import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './config';
import { PortalConfig } from '../types';
import { defaultPortalConfig } from '../data/defaultData';
import { compressImage } from '../utils/mediaStorage';

const SETTINGS_COLLECTION = 'portal_settings';
const CONFIG_DOC_ID = 'config';

export const BOOTSTRAP_ADMIN_EMAIL = 'mdrobiulislam34t@gmail.com';

// Subscribe to Portal Config in real time
export function subscribeToPortalConfig(
  onUpdate: (config: PortalConfig) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
  return onSnapshot(
    docRef,
    (snap) => {
      let merged: PortalConfig = { ...defaultPortalConfig };
      if (snap.exists()) {
        const data = snap.data() as PortalConfig;
        merged = {
          ...defaultPortalConfig,
          ...data,
        };
      }
      onUpdate(merged);
    },
    (err) => {
      console.warn('Settings listener notice:', err.message);
      if (onError) onError(err);
    }
  );
}

// Update Portal Config in Firestore WITHOUT overwriting other existing fields
export async function updatePortalConfig(config: Partial<PortalConfig>): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    
    // Explicitly update ONLY the specified keys to prevent overwriting other fields
    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.email || BOOTSTRAP_ADMIN_EMAIL,
    };

    if (config.qrImageUrl !== undefined) {
      updatePayload.qrImageUrl = config.qrImageUrl;
    }
    if (config.videoUrl !== undefined) {
      updatePayload.videoUrl = config.videoUrl;
    }
    if (config.brandName !== undefined) {
      updatePayload.brandName = config.brandName;
    }
    if (config.brandSubtitle !== undefined) {
      updatePayload.brandSubtitle = config.brandSubtitle;
    }
    if (config.qrMerchantName !== undefined) {
      updatePayload.qrMerchantName = config.qrMerchantName;
    }
    if (config.qrMerchantId !== undefined) {
      updatePayload.qrMerchantId = config.qrMerchantId;
    }

    await setDoc(docRef, updatePayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Upload file to Express backend /api/upload
export async function uploadMediaToServer(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  if (onProgress) onProgress(20);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (onProgress) onProgress(80);

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success || !result.url) {
    throw new Error(result.error || 'Upload failed');
  }

  if (onProgress) onProgress(100);
  return result.url;
}

// Upload and save QR image (Preserves current videoUrl completely!)
export async function processAndSaveQrImage(file: File): Promise<string> {
  try {
    try {
      const serverUrl = await uploadMediaToServer(file);
      await updatePortalConfig({ qrImageUrl: serverUrl });
      return serverUrl;
    } catch (serverErr) {
      console.warn('Server upload fallback to compressed image:', serverErr);
      const compressedDataUrl = await compressImage(file, 800, 800, 0.85);
      await updatePortalConfig({ qrImageUrl: compressedDataUrl });
      return compressedDataUrl;
    }
  } catch (err) {
    console.error('Failed to process QR image:', err);
    throw err;
  }
}

// Upload and save 9:16 Vertical Video (Preserves current qrImageUrl completely!)
export async function processAndSaveVideo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const serverUrl = await uploadMediaToServer(file, onProgress);
    await updatePortalConfig({ videoUrl: serverUrl });
    return serverUrl;
  } catch (err) {
    console.error('Failed to process video:', err);
    throw err;
  }
}

export async function clearSavedVideo(): Promise<void> {
  await updatePortalConfig({ videoUrl: '' });
}

export async function clearSavedQr(): Promise<void> {
  await updatePortalConfig({ qrImageUrl: '' });
}
