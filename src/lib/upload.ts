import { Platform } from 'react-native';
import { insforge } from './insforge';

export type UploadServiceType = 
  | 'profile_picture' 
  | 'classified_ad' 
  | 'announcement' 
  | 'grievance' 
  | 'message_attachment';

export interface UploadOptions {
  bucketName: string;
  folderPath?: string;
  oldImageUrl?: string;
  userId: string;
  neighborhoodId: string;
  serviceType: UploadServiceType;
  entityId?: string;
  maxLimit?: number;
  base64?: string; // Optional base64 data for more reliable upload on some platforms
}

export interface UploadResult {
  url: string;
  error?: string;
}

/**
 * Robustly uploads an image to InsForge Storage with:
 * 1. Rate limiting (Daily)
 * 2. Old file cleanup
 * 3. Robust extension extraction
 * 4. Admin moderation notification
 * 5. Multi-platform blob handling
 */
export async function uploadImage(uri: string, options: UploadOptions): Promise<UploadResult> {
  const { bucketName, folderPath, oldImageUrl, userId, neighborhoodId, serviceType, entityId, maxLimit = 1, base64 } = options;

  try {
    // 1. Check Rate Limit (Daily)
    try {
      const { data: canUpload, error: limitError } = await insforge.database.rpc('check_upload_limit', {
        u_id: userId,
        s_type: serviceType,
        max_limit: maxLimit
      });

      if (limitError) {
        // If function doesn't exist (404/PGRST202), log and proceed (fail-open for MVP)
        if (limitError.code === 'PGRST202' || limitError.message?.includes('not found')) {
          console.warn('RPC check_upload_limit not found. Skipping rate limit check.');
        } else {
          console.error('Rate limit check error:', limitError);
        }
      } else if (canUpload === false) {
        return { url: '', error: `You have reached your daily upload limit (${maxLimit}) for this service.` };
      }
    } catch (rpcErr) {
      console.warn('Failed to call check_upload_limit RPC:', rpcErr);
    }

    // 2. Prepare File
    let fileExt = 'jpg';
    if (uri.includes('.') && !uri.startsWith('blob:') && !uri.startsWith('data:')) {
      fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    }
    
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    let blob: any;
    if (base64) {
      // Use base64 if provided (more reliable on some RN environments)
      const { decode } = require('base64-arraybuffer');
      const buffer = decode(base64);
      
      if (Platform.OS === 'web') {
        // Web requires a real Blob for size and type detection in fetch/xhr
        blob = new Blob([buffer], { type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}` });
      } else {
        blob = buffer;
        // Some SDK versions check .size; ArrayBuffer has .byteLength
        if (blob && !blob.size && blob.byteLength) {
          blob.size = blob.byteLength;
        }
      }
    } else {
      // Fallback to fetch/blob
      const fileResponse = await fetch(uri);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch image from URI: ${fileResponse.statusText}`);
      }
      blob = await fileResponse.blob();
    }

    if (!blob || (blob.size === 0 && !base64)) {
      throw new Error('Fetched blob is empty (0 bytes).');
    }

    // 3. Delete Old Image if exists
    if (oldImageUrl) {
      const oldPath = getFilePathFromUrl(oldImageUrl, bucketName);
      if (oldPath) {
        await insforge.storage.from(bucketName).remove([oldPath]);
      }
    }

    // 4. Upload New Image
    const { data: uploadData, error: uploadError } = await insforge.storage
      .from(bucketName)
      .upload(filePath, blob, {
        contentType: (blob as any).type || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Capture Public URL
    const publicUrlResponse = insforge.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    let newUrl = uploadData?.url || '';
    if (!newUrl) {
      if (typeof publicUrlResponse === 'string') {
        newUrl = publicUrlResponse;
      } else if ((publicUrlResponse as any)?.data?.publicUrl) {
        newUrl = (publicUrlResponse as any).data.publicUrl;
      } else if ((publicUrlResponse as any)?.publicUrl) {
        newUrl = (publicUrlResponse as any).publicUrl;
      }
    }

    if (!newUrl || newUrl === '[object Object]') {
      throw new Error('Failed to obtain a valid public URL for the uploaded image.');
    }

    // 5. Notify Admins (Moderation Queue)
    await insforge.database.from('image_moderation_queue').insert({
      neighborhood_id: neighborhoodId,
      user_id: userId,
      service_type: serviceType,
      entity_id: entityId,
      image_url: newUrl,
      status: 'pending'
    });

    return { url: newUrl };

  } catch (err: any) {
    console.error('Upload process failed:', err);
    return { url: '', error: err.message || 'Image upload failed' };
  }
}

export function getFilePathFromUrl(url: string, bucketName: string): string | null {
  if (!url || !url.includes(bucketName)) return null;
  const parts = url.split(bucketName + '/');
  if (parts.length < 2) return null;
  return parts[1].split('?')[0]; // Remove query params
}
