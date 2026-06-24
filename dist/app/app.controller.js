var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { AppService } from './app.service.js';
let AppController = class AppController {
    appService;
    authService;
    constructor(appService, authService) {
        this.appService = appService;
        this.authService = authService;
    }
    login(body) {
        return this.authService.login(body.email, body.password);
    }
    dashboard(query) {
        return this.appService.getDashboard(query);
    }
    interns(query) {
        return this.appService.getInterns(query);
    }
    createIntern(body) {
        return this.appService.createIntern(body);
    }
    updateIntern(id, body) {
        return this.appService.updateIntern(id, body);
    }
    deleteIntern(id) {
        return this.appService.deleteIntern(id);
    }
    costs(query) {
        return this.appService.getCosts(query);
    }
    updateCost(internId, year, month, body) {
        return this.appService.updateMonthlyCost(internId, Number(year), Number(month), body);
    }
    replacement() {
        return this.appService.getReplacement();
    }
    plans(query) {
        return this.appService.getPlans(query);
    }
    createPlan(body) {
        return this.appService.createPlan(body);
    }
    updatePlanStatus(id, body) {
        return this.appService.updatePlanStatus(id, body);
    }
    completion() {
        return this.appService.getCompletion();
    }
    updateCompletion(internId, body) {
        return this.appService.updateCompletion(internId, body);
    }
    organization() {
        return this.appService.getOrganization();
    }
    notifications() {
        return this.appService.getNotifications();
    }
    importExcel() {
        return this.appService.importExcel(process.env.EXCEL_PATH ?? '/Users/syilla/Downloads/Data Magang Neuron.xlsx');
    }
};
__decorate([
    Post('auth/login'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "login", null);
__decorate([
    Get('dashboard'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "dashboard", null);
__decorate([
    Get('interns'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "interns", null);
__decorate([
    Post('interns'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "createIntern", null);
__decorate([
    Put('interns/:id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "updateIntern", null);
__decorate([
    Delete('interns/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "deleteIntern", null);
__decorate([
    Get('costs'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "costs", null);
__decorate([
    Put('costs/:internId/:year/:month'),
    __param(0, Param('internId')),
    __param(1, Param('year')),
    __param(2, Param('month')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "updateCost", null);
__decorate([
    Get('replacement'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "replacement", null);
__decorate([
    Get('plans'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "plans", null);
__decorate([
    Post('plans'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "createPlan", null);
__decorate([
    Put('plans/:id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "updatePlanStatus", null);
__decorate([
    Get('completion'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "completion", null);
__decorate([
    Put('completion/:internId'),
    __param(0, Param('internId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "updateCompletion", null);
__decorate([
    Get('organization'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "organization", null);
__decorate([
    Get('notifications'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "notifications", null);
__decorate([
    Post('import/excel'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "importExcel", null);
AppController = __decorate([
    Controller('api'),
    __metadata("design:paramtypes", [AppService,
        AuthService])
], AppController);
export { AppController };
//# sourceMappingURL=app.controller.js.map