import { devLog, devError } from '$infrastructure/ui/dev-logger';

const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined)?.trim() ?? '';
const uploadPreset =
  (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined)?.trim() ?? '';

export function isCloudinaryConfigured() {
  return Boolean(cloudName && uploadPreset);
}

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

/**
 * Upload unsigned a Cloudinary (seguro en cliente: no usa API secret).
 * Requiere preset unsigned en el dashboard de Cloudinary.
 */
export async function uploadImageToCloudinary(file: File, folder = 'solux/catalog'): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    const err = new Error(
      'Cloudinary no configurado. Define VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET'
    );
    devError('cloudinary', 'not configured', err);
    throw err;
  }

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', uploadPreset);
  body.append('folder', folder);

  devLog('cloudinary', 'upload start', { name: file.name, size: file.size });

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body
  });

  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json?.error?.message ?? 'Error al subir imagen a Cloudinary');
    devError('cloudinary', 'upload failed', err);
    throw err;
  }

  devLog('cloudinary', 'upload ok', json.secure_url);

  return {
    url: json.secure_url as string,
    publicId: json.public_id as string,
    width: json.width,
    height: json.height
  };
}
