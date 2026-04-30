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
    const { data: canUpload, error: limitError } = await insforge.database.rpc('check_upload_limit', {
      u_id: userId,
      s_type: serviceType,
      max_limit: maxLimit
    });

    if (limitError) {
      console.error('Rate limit check error:', limitError);
    } else if (canUpload === false) {
      return { url: '', error: `You have reached your daily upload limit (${maxLimit}) for this service.` };
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
      blob = decode(base64);
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
