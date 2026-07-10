import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { extname, join } from 'path';
import * as fs from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class UploadService {
  private allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private maxFileSize = 5 * 1024 * 1024; // 5MB
  private maxWidth = 1920;
  private maxHeight = 1080;

  async validateAndResize(file: Express.Multer.File): Promise<string> {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('Kích thước file tối đa là 5MB');
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    const outputPath = join(UPLOAD_DIR, filename);

    await sharp(file.buffer)
      .resize(this.maxWidth, this.maxHeight, { fit: 'inside', withoutEnlargement: true })
      .toFile(outputPath);

    return `/uploads/${filename}`;
  }

  getUploadDir(): string {
    return UPLOAD_DIR;
  }
}
