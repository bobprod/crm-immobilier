import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerConfig } from './config';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { join } from 'path';
import * as express from 'express';

const logger = new Logger('Bootstrap');

// Handle uncaught exceptions to prevent server crashes
process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`, error.stack);
  // Don't exit - try to keep the server running
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // Don't exit - try to keep the server running
});

// Graceful shutdown handlers
let app: any = null;

async function gracefulShutdown(signal: string) {
  logger.log(`Received ${signal}. Starting graceful shutdown...`);
  if (app) {
    try {
      await app.close();
      logger.log('Application closed successfully');
    } catch (err) {
      logger.error('Error during shutdown:', err);
    }
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function bootstrap() {
  app = await NestFactory.create(AppModule);

  // Global exception filter for detailed error logging
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve uploaded files as static assets
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // API prefix
  app.setGlobalPrefix('api');

  // Enable shutdown hooks for graceful shutdown
  app.enableShutdownHooks();

  // Swagger documentation
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Application démarrée sur http://localhost:${port}`);
  console.log(`📚 Documentation Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
