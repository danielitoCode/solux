import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('cloudinary', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('isCloudinaryConfigured es false sin env', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', '');
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', '');
    const { isCloudinaryConfigured } = await import('$infrastructure/media/cloudinary');
    expect(isCloudinaryConfigured()).toBe(false);
  });

  it('isCloudinaryConfigured es true con cloud + preset', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'solux');
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'unsigned_preset');
    const { isCloudinaryConfigured } = await import('$infrastructure/media/cloudinary');
    expect(isCloudinaryConfigured()).toBe(true);
  });

  it('uploadImageToCloudinary lanza si no está configurado', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', '');
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', '');
    const { uploadImageToCloudinary } = await import('$infrastructure/media/cloudinary');
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await expect(uploadImageToCloudinary(file)).rejects.toThrow(/Cloudinary no configurado/i);
  });
});
