import { type INestApplication, ValidationPipe } from '@nestjs/common';

export function getCorsOrigins() {
  const configured = process.env.CORS_ORIGINS;
  if (!configured) return ['http://localhost:5173', 'http://127.0.0.1:5173'];

  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function configureNestApp(app: INestApplication) {
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
