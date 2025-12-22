import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class ImageCompressionService {
  private readonly logger = new Logger(ImageCompressionService.name);
  
  // Maximum dimensions for full-size images
  private readonly MAX_WIDTH = 1200;
  private readonly MAX_HEIGHT = 800;
  
  // Dimensions for thumbnails
  private readonly THUMB_WIDTH = 300;
  private readonly THUMB_HEIGHT = 200;
  
  // Quality settings
  private readonly QUALITY = 80;

  /**
   * Compress an image to max 1200x800 with 80% quality
   * @param inputPath Path to the original image
   * @param outputPath Path where compressed image will be saved
   * @returns Compressed image metadata
   */
  async compressImage(
    inputPath: string,
    outputPath?: string,
  ): Promise<{ path: string; size: number; width: number; height: number }> {
    try {
      const output = outputPath || inputPath;
      
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      // Resize if larger than max dimensions
      const shouldResize = 
        (metadata.width && metadata.width > this.MAX_WIDTH) ||
        (metadata.height && metadata.height > this.MAX_HEIGHT);
      
      let processedImage = image;
      
      if (shouldResize) {
        processedImage = image.resize(this.MAX_WIDTH, this.MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
      
      // Compress based on format
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        processedImage = processedImage.jpeg({ quality: this.QUALITY });
      } else if (metadata.format === 'png') {
        processedImage = processedImage.png({ 
          quality: this.QUALITY,
          compressionLevel: 9,
        });
      } else if (metadata.format === 'webp') {
        processedImage = processedImage.webp({ quality: this.QUALITY });
      } else {
        // Default to JPEG for unsupported formats
        this.logger.warn(`Unsupported format ${metadata.format}, converting to JPEG`);
        processedImage = processedImage.jpeg({ quality: this.QUALITY });
      }
      
      await processedImage.toFile(output);
      
      const stats = await fs.stat(output);
      const newMetadata = await sharp(output).metadata();
      
      this.logger.log(`Compressed image: ${path.basename(output)} (${stats.size} bytes)`);
      
      return {
        path: output,
        size: stats.size,
        width: newMetadata.width || 0,
        height: newMetadata.height || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to compress image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a thumbnail (300x200)
   * @param inputPath Path to the original image
   * @param outputPath Path where thumbnail will be saved
   * @returns Thumbnail metadata
   */
  async generateThumbnail(
    inputPath: string,
    outputPath: string,
  ): Promise<{ path: string; size: number; width: number; height: number }> {
    try {
      await sharp(inputPath)
        .resize(this.THUMB_WIDTH, this.THUMB_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: this.QUALITY })
        .toFile(outputPath);
      
      const stats = await fs.stat(outputPath);
      const metadata = await sharp(outputPath).metadata();
      
      this.logger.log(`Generated thumbnail: ${path.basename(outputPath)}`);
      
      return {
        path: outputPath,
        size: stats.size,
        width: metadata.width || this.THUMB_WIDTH,
        height: metadata.height || this.THUMB_HEIGHT,
      };
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process uploaded image: compress and generate thumbnail
   * @param inputPath Path to uploaded image
   * @param compressedPath Path for compressed version
   * @param thumbnailPath Path for thumbnail
   * @param deleteOriginal Whether to delete the original after processing
   * @returns Processed image paths and metadata
   */
  async processUploadedImage(
    inputPath: string,
    compressedPath: string,
    thumbnailPath: string,
    deleteOriginal = true,
  ): Promise<{
    compressed: { path: string; size: number; width: number; height: number };
    thumbnail: { path: string; size: number; width: number; height: number };
  }> {
    const compressed = await this.compressImage(inputPath, compressedPath);
    const thumbnail = await this.generateThumbnail(compressedPath, thumbnailPath);
    
    // Delete original if requested and it's different from compressed
    if (deleteOriginal && inputPath !== compressedPath) {
      try {
        await fs.unlink(inputPath);
        this.logger.log(`Deleted original: ${path.basename(inputPath)}`);
      } catch (error) {
        this.logger.warn(`Failed to delete original: ${error.message}`);
      }
    }
    
    return { compressed, thumbnail };
  }

  /**
   * Check if an image file size exceeds the limit
   * @param filePath Path to the image file
   * @param maxSizeKb Maximum size in KB (default: 500KB)
   * @returns true if file size is acceptable
   */
  async checkFileSize(filePath: string, maxSizeKb = 500): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      const sizeKb = stats.size / 1024;
      return sizeKb <= maxSizeKb;
    } catch (error) {
      this.logger.error(`Failed to check file size: ${error.message}`);
      return false;
    }
  }
}
