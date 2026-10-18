import { isCloudinaryConfigured, uploadImageToCloudinary } from '$infrastructure/media/cloudinary';

export class PresentationMediaDataSource {
  isConfigured(): boolean {
    return isCloudinaryConfigured();
  }

  upload(file: File, slug: string): Promise<{ url: string }> {
    return uploadImageToCloudinary(file, `solux/site-content/${slug}`);
  }
}
