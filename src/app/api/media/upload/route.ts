import {
  apiHandler,
  sendError,
  sendSuccess,
  DbUtils,
  getCurrentUser,
  sendForbidden,
} from '@/lib/api-utils';
import imagekit, { toFile } from '@/lib/imagekit';
import { UserRole } from '@/schemas/cms';

/**
 * MEDIA UPLOAD PROXY
 * Proxies uploads to ImageKit to keep keys server-side and centralized logic.
 */
export const POST = apiHandler(async (request) => {
  try {
    const user = await getCurrentUser();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const portfolio = formData.get('portfolio') as string;
    const virtualFolder = formData.get('virtualFolder') as string;
    const fileName = formData.get('fileName') as string;
    const ikFolder = formData.get('folder') as string;

    // Access Control: Ensure user has access to target portfolio
    if (
      user?.role !== UserRole.ADMIN &&
      !user?.portfolios?.includes(portfolio)
    ) {
      return sendForbidden('You do not have access to this portfolio');
    }

    if (!file) {
      return sendError('No file provided for upload', 400);
    }

    // Industrial Guard: Limit file size to 100MB for video support
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return sendError(
        `FILE TOO LARGE: ${Math.round(file.size / 1024 / 1024)}MB. Max limit is 100MB.`,
        400
      );
    }

    // Convert file to buffer for ImageKit SDK
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(
      `🚀 [MEDIA UPLOAD] Starting upload: ${fileName} (${file.size} bytes)`
    );

    // Execute upload to ImageKit
    const ikRes = await imagekit.files.upload({
      file: await toFile(buffer, fileName),
      fileName: fileName || `upload_${Date.now()}`,
      folder: ikFolder,
      useUniqueFileName: true,
    });

    console.log(`✅ [IMAGEKIT] Success: ${ikRes.url}`);

    // Standardize the registration data for CMS
    const mediaData = {
      filename: ikRes.name,
      imageKitUrl: ikRes.url,
      imageKitFileId: ikRes.fileId,
      mimeType: file.type || ikRes.fileType,
      filesize: ikRes.size,
      width: ikRes.width,
      height: ikRes.height,
      altText: ikRes.name.replace(/[-_]/g, ' ').split('.')[0],
      folder: virtualFolder,
      portfolio: portfolio,
    };

    // Atomic Database Registration
    const result = await DbUtils.createDoc('media', mediaData);

    return sendSuccess(
      {
        ...mediaData,
        _id: result.insertedId,
      },
      201
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ [MEDIA UPLOAD] Critical Failure:', err);
    const errorMessage =
      err.message === 'socket hang up'
        ? 'Connection to ImageKit timed out. Please check your network or try a smaller file.'
        : err.message;
    return sendError(`ImageKit upload failed: ${errorMessage}`, 500);
  }
});
