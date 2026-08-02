import { storage, logMediaJobToFirestore } from '../lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export async function compressDataUrlImage(dataUrl: string, maxDimension = 800, quality = 0.65): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function processAndUploadMedia(
  inputDataUrl: string,
  userId: string,
  mediaType: 'image' | 'video_15s' | 'clip_2s',
  filenamePrefix = 'moment'
): Promise<{
  primaryUrl: string;
  thumbnailUrl: string;
  storageTier: 'hot_s3' | 'cool_infrequent' | 'glacier_cold';
}> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const filename = `${filenamePrefix}_${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;

  // Pre-compress images to ensure lightweight base64 payloads if fallback is needed
  let processedDataUrl = inputDataUrl;
  if (inputDataUrl && inputDataUrl.startsWith('data:image/')) {
    try {
      processedDataUrl = await compressDataUrlImage(inputDataUrl, 800, 0.65);
    } catch (e) {
      console.warn("Client pre-compression warning:", e);
    }
  }

  // Log queued stage
  await logMediaJobToFirestore({
    jobId,
    filename,
    stage: 'queued',
    progress: 10,
    userId,
    outputUrls: { thumbnail: '', medium: '', full: '' }
  });

  try {
    // 1. Process image/video via server API pipeline if available
    const isVideo = mediaType === 'video_15s' || mediaType === 'clip_2s';
    await logMediaJobToFirestore({
      jobId,
      filename,
      stage: isVideo ? 'transcoding_ffmpeg' : 'compressing_sharp',
      progress: 40,
      userId,
      outputUrls: { thumbnail: '', medium: '', full: '' }
    });

    try {
      const response = await fetch('/api/media/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          filename,
          mediaType,
          inputDataUrl: processedDataUrl
        })
      });

      if (response.ok) {
        const jobResult = await response.json();
        if (jobResult.outputUrls?.full) {
          processedDataUrl = jobResult.outputUrls.full;
        }
      }
    } catch (procErr) {
      console.warn("Server image processing fallback:", procErr);
    }

    // 2. Upload to Firebase Storage
    await logMediaJobToFirestore({
      jobId,
      filename,
      stage: 'uploading_cdn',
      progress: 80,
      userId,
      outputUrls: { thumbnail: processedDataUrl, medium: processedDataUrl, full: processedDataUrl }
    });

    let firebaseStorageUrl = processedDataUrl;

    if (processedDataUrl.startsWith('data:')) {
      try {
        const storageRef = ref(storage, `media/${userId}/${filename}`);
        const uploadPromise = (async () => {
          await uploadString(storageRef, processedDataUrl, 'data_url');
          return await getDownloadURL(storageRef);
        })();

        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('Storage upload timeout')), 7000);
        });

        firebaseStorageUrl = await Promise.race([uploadPromise, timeoutPromise]);
      } catch (stErr) {
        console.warn("Firebase Storage upload fallback (using compressed dataUrl):", stErr);
      }
    }

    // 3. Complete job log
    await logMediaJobToFirestore({
      jobId,
      filename,
      stage: 'completed',
      progress: 100,
      userId,
      outputUrls: {
        thumbnail: firebaseStorageUrl,
        medium: firebaseStorageUrl,
        full: firebaseStorageUrl
      }
    });

    return {
      primaryUrl: firebaseStorageUrl,
      thumbnailUrl: firebaseStorageUrl,
      storageTier: 'hot_s3'
    };
  } catch (err) {
    console.error("Media processing pipeline error:", err);
    return {
      primaryUrl: processedDataUrl,
      thumbnailUrl: processedDataUrl,
      storageTier: 'hot_s3'
    };
  }
}



