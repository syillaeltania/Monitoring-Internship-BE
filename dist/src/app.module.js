var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app/app.controller.js';
import { IssueController } from './app/issue.controller.js';
import { AppService } from './app/app.service.js';
import { AuthService } from './auth/auth.service.js';
import { PrismaService } from './prisma/prisma.service.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            JwtModule.register({
                global: true,
                secret: process.env.JWT_SECRET ?? 'dev-secret',
                signOptions: { expiresIn: '8h' },
            }),
        ],
        controllers: [AppController, IssueController],
        providers: [AppService, AuthService, PrismaService],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map