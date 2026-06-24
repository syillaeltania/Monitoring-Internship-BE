import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureNestApp } from './nest-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureNestApp(app);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
