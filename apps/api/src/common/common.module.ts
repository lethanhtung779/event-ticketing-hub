import { Global, Module } from '@nestjs/common';
import { UploadService } from './services/upload.service';

@Global()
@Module({
  providers: [UploadService],
  exports: [UploadService],
})
export class CommonModule {}
