import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './config';
import { PortalConfig } from '../types';
import { defaultPortalConfig } from '../data/defaultData';
import {
  compressImage,
  uint8ArrayToBase64,
  base64ToUint8Array,
  saveLocalMedia,
  getLocalMedia,
} from '../utils/mediaStorage';

const SETTINGS_COLLECTION = 'portal_settings';
const CONFIG_DOC_ID = 'config';
const MEDIA_COLLECTION = 'media';
const FIRESTORE_VIDEO_PREFIX = 'firestore://media/';
const MAX_FIRESTORE_VIDEO_BYTES = 25 * 1024 * 1024; // 25MB
const CHUNK_BINARY_BYTES = 380 * 1024; // ~507KB base64 per Firestore document (< 1MB hard limit)

export const BOOTSTRAP_ADMIN_EMAIL = 'mdrobiulislam34t@gmail.com';

export function isFirestoreVideoUrl(url: string): boolean {
  return typeof url === 'string' && url.startsWith(FIRESTORE_VIDEO_PREFIX);
}

// Subscribe to Portal Config in real time
export function subscribeToPortalConfig(
  onUpdate: (config: PortalConfig) => void,
  onError?: (err: Error) => void
) {
  const path = `${SETTINGS_COLLECTION}/${CONFIG_DOC_ID}`;
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
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

// Update Portal Config in Firestore WITHOUT overwriting other existing fields
export async function updatePortalConfig(config: Partial<PortalConfig>): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);

    // Explicitly update ONLY the specified keys to prevent overwriting other fields
    const updatePayload: Record<string, string> = {
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

// Upload and save QR image directly into Firestore so it persists permanently on Published & Dev sites
export async function processAndSaveQrImage(file: File): Promise<string> {
  try {
    const persistentDataUrl = await compressImage(file, 1000, 1000, 0.9, 450000);
    await updatePortalConfig({ qrImageUrl: persistentDataUrl });
    return persistentDataUrl;
  } catch (err) {
    console.error('Failed to process QR image:', err);
    throw err;
  }
}

// Upload and save 9:16 Vertical Video directly into Firestore chunked /media collection
// Works permanently across both Dev and Published Cloud Run containers!
export async function processAndSaveVideo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (file.size > MAX_FIRESTORE_VIDEO_BYTES) {
    throw new Error(
      `ভিডিওর সাইজ ${(file.size / (1024 * 1024)).toFixed(1)} MB। স্থায়ীভাবে সেভ করার জন্য সর্বোচ্চ 25 MB পর্যন্ত MP4 ভিডিও আপলোড করুন অথবা সরাসরি ভিডিও লিংক দিন।`
    );
  }

  const videoId = `video_${Date.now()}`;
  const mimeType = file.type || 'video/mp4';

  try {
    if (onProgress) onProgress(5);
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const totalChunks = Math.ceil(bytes.length / CHUNK_BINARY_BYTES);

    // Upload chunks in batches of 4
    const batchSize = 4;
    for (let start = 0; start < totalChunks; start += batchSize) {
      const end = Math.min(start + batchSize, totalChunks);
      const promises: Promise<void>[] = [];

      for (let i = start; i < end; i++) {
        const sliceStart = i * CHUNK_BINARY_BYTES;
        const sliceEnd = Math.min(sliceStart + CHUNK_BINARY_BYTES, bytes.length);
        const chunkBase64 = uint8ArrayToBase64(bytes.subarray(sliceStart, sliceEnd));
        const chunkDocId = `${videoId}_c_${i}`;
        const chunkPath = `${MEDIA_COLLECTION}/${chunkDocId}`;

        promises.push(
          setDoc(doc(db, MEDIA_COLLECTION, chunkDocId), {
            index: i,
            data: chunkBase64,
          }).catch((err) => handleFirestoreError(err, OperationType.WRITE, chunkPath))
        );
      }

      await Promise.all(promises);
      if (onProgress) {
        const pct = Math.min(90, Math.round((end / totalChunks) * 85) + 5);
        onProgress(pct);
      }
    }

    // Write metadata document
    const metaPath = `${MEDIA_COLLECTION}/${videoId}`;
    try {
      await setDoc(doc(db, MEDIA_COLLECTION, videoId), {
        type: 'video',
        mimeType,
        totalChunks,
        totalSize: bytes.length,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, metaPath);
    }

    // Cache locally in IndexedDB for instant playback
    await saveLocalMedia(videoId, file);

    const firestoreUrl = `${FIRESTORE_VIDEO_PREFIX}${videoId}`;
    await updatePortalConfig({ videoUrl: firestoreUrl });

    if (onProgress) onProgress(100);
    return firestoreUrl;
  } catch (err) {
    console.error('Failed to save video to Firestore:', err);
    throw err;
  }
}

// Resolve a firestore://media/<id> reference into a playable Blob URL (with IndexedDB cache)
export async function resolveFirestoreVideoUrl(videoUrl: string): Promise<string> {
  if (!isFirestoreVideoUrl(videoUrl)) {
    return videoUrl;
  }

  const videoId = videoUrl.slice(FIRESTORE_VIDEO_PREFIX.length);
  if (!videoId) return '';

  // 1. Check IndexedDB cache first
  const cachedBlob = await getLocalMedia(videoId);
  if (cachedBlob && cachedBlob.size > 0) {
    return URL.createObjectURL(cachedBlob);
  }

  // 2. Fetch metadata document from Firestore
  const metaPath = `${MEDIA_COLLECTION}/${videoId}`;
  let metaSnap;
  try {
    metaSnap = await getDoc(doc(db, MEDIA_COLLECTION, videoId));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, metaPath);
  }

  if (!metaSnap || !metaSnap.exists()) {
    throw new Error('Video metadata not found in database');
  }

  const meta = metaSnap.data() as {
    mimeType?: string;
    totalChunks: number;
  };
  const totalChunks = meta.totalChunks || 0;
  if (totalChunks <= 0) {
    throw new Error('Invalid video chunk count');
  }

  // 3. Fetch all chunks in parallel batches
  const chunkArrays: Uint8Array[] = new Array(totalChunks);
  const batchSize = 6;
  for (let start = 0; start < totalChunks; start += batchSize) {
    const end = Math.min(start + batchSize, totalChunks);
    const promises: Promise<void>[] = [];

    for (let i = start; i < end; i++) {
      const chunkDocId = `${videoId}_c_${i}`;
      const chunkPath = `${MEDIA_COLLECTION}/${chunkDocId}`;
      promises.push(
        getDoc(doc(db, MEDIA_COLLECTION, chunkDocId))
          .then((snap) => {
            if (!snap.exists()) {
              throw new Error(`Missing video chunk ${i}`);
            }
            const chunkData = snap.data() as { data: string };
            chunkArrays[i] = base64ToUint8Array(chunkData.data);
          })
          .catch((err) => handleFirestoreError(err, OperationType.GET, chunkPath))
      );
    }
    await Promise.all(promises);
  }

  // 4. Assemble into single Blob
  const totalLength = chunkArrays.reduce((sum, arr) => sum + arr.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of chunkArrays) {
    combined.set(arr, offset);
    offset += arr.length;
  }

  const blob = new Blob([combined], { type: meta.mimeType || 'video/mp4' });
  await saveLocalMedia(videoId, blob);
  return URL.createObjectURL(blob);
}

export async function clearSavedVideo(): Promise<void> {
  await updatePortalConfig({ videoUrl: '' });
}

export async function clearSavedQr(): Promise<void> {
  await updatePortalConfig({ qrImageUrl: '' });
}
