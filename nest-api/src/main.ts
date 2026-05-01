import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ensure upload directories exist
  const uploadDirs = [
    'uploads',
    'uploads/incidents',
    'uploads/incidents/images',
    'uploads/incidents/videos',
  ];
  uploadDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); 
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Remote Access: http://192.168.8.108:${port}/api`);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
