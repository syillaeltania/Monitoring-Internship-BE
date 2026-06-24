import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { configureNestApp } from '../src/nest-app.js';
let cachedServer;
async function bootstrapServer() {
    if (cachedServer)
        return cachedServer;
    const app = await NestFactory.create(AppModule);
    configureNestApp(app);
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
    return cachedServer;
}
export default async function handler(request, response) {
    const server = await bootstrapServer();
    return server(request, response);
}
//# sourceMappingURL=index.js.map