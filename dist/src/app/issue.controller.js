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
import { PrismaService } from '../prisma/prisma.service.js';
let IssueController = class IssueController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getIssues(year, month, division, status) {
        let startDate;
        let endDate;
        if (year) {
            const y = parseInt(year);
            if (month) {
                const m = parseInt(month) - 1;
                startDate = new Date(y, m, 1);
                endDate = new Date(y, m + 1, 0);
            }
            else {
                startDate = new Date(y, 0, 1);
                endDate = new Date(y, 11, 31);
            }
        }
        const where = {};
        if (startDate && endDate) {
            where.reportedDate = { gte: startDate, lte: endDate };
        }
        if (division) {
            where.intern = { division };
        }
        if (status) {
            where.status = status;
        }
        return this.prisma.internIssue.findMany({
            where,
            include: {
                intern: {
                    select: { id: true, name: true, division: true, team: true, institution: true },
                },
            },
            orderBy: { reportedDate: 'desc' },
        });
    }
    async createIssue(data) {
        return this.prisma.internIssue.create({
            data: {
                internId: data.internId,
                type: data.type,
                description: data.description,
                reportedDate: new Date(data.reportedDate),
                followUpAction: data.followUpAction,
                status: data.status || 'OPEN',
                resolvedDate: data.status === 'RESOLVED' ? new Date() : null,
            },
        });
    }
    async updateIssue(id, data) {
        return this.prisma.internIssue.update({
            where: { id },
            data: {
                type: data.type,
                description: data.description,
                followUpAction: data.followUpAction,
                status: data.status,
                resolvedDate: data.status === 'RESOLVED' ? new Date() : null,
            },
        });
    }
    async deleteIssue(id) {
        return this.prisma.internIssue.delete({
            where: { id },
        });
    }
    async getAnalytics(year, month) {
        let startDate;
        let endDate;
        if (!year) {
            const d = new Date();
            year = d.getFullYear().toString();
            month = (d.getMonth() + 1).toString();
        }
        const y = parseInt(year);
        if (month) {
            const m = parseInt(month) - 1;
            startDate = new Date(y, m, 1);
            endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
        }
        else {
            startDate = new Date(y, 0, 1);
            endDate = new Date(y, 11, 31, 23, 59, 59, 999);
        }
        // 1. Total Active Interns in this period
        const activeInterns = await this.prisma.intern.findMany({
            where: {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
            select: { id: true },
        });
        const totalActive = activeInterns.length;
        // 2. Issues in this period
        const issues = await this.prisma.internIssue.findMany({
            where: {
                reportedDate: { gte: startDate, lte: endDate },
            },
            include: {
                intern: { select: { id: true, division: true, team: true, institution: true } },
            },
        });
        const totalIssues = issues.length;
        const unresolvedIssues = issues.filter((i) => i.status !== 'RESOLVED').length;
        // Count unique interns with issues
        const uniqueInternIds = new Set(issues.map((i) => i.internId));
        const internsWithIssues = uniqueInternIds.size;
        // Issue Rate %
        const issueRate = totalActive > 0 ? (internsWithIssues / totalActive) * 100 : 0;
        // Aggregations
        const byType = issues.reduce((acc, issue) => {
            const types = Array.isArray(issue.type) ? issue.type : [issue.type];
            for (const t of types) {
                acc[t] = (acc[t] || 0) + 1;
            }
            return acc;
        }, {});
        const byDivision = issues.reduce((acc, issue) => {
            const div = issue.intern.division;
            acc[div] = (acc[div] || 0) + 1;
            return acc;
        }, {});
        const byInstitution = issues.reduce((acc, issue) => {
            const inst = issue.intern.institution || 'Lainnya';
            acc[inst] = (acc[inst] || 0) + 1;
            return acc;
        }, {});
        // Format chart data
        const chartByType = Object.entries(byType).map(([name, value]) => ({ name, value }));
        const chartByDivision = Object.entries(byDivision)
            .map(([name, value]) => ({ name, value: value }))
            .sort((a, b) => b.value - a.value);
        // Top 5 institutions
        const chartByInstitution = Object.entries(byInstitution)
            .map(([name, value]) => ({ name, value: value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        return {
            summary: {
                totalActive,
                totalIssues,
                unresolvedIssues,
                internsWithIssues,
                issueRate,
            },
            charts: {
                byType: chartByType,
                byDivision: chartByDivision,
                byInstitution: chartByInstitution,
            },
        };
    }
};
__decorate([
    Get(),
    __param(0, Query('year')),
    __param(1, Query('month')),
    __param(2, Query('division')),
    __param(3, Query('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], IssueController.prototype, "getIssues", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IssueController.prototype, "createIssue", null);
__decorate([
    Put(':id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IssueController.prototype, "updateIssue", null);
__decorate([
    Delete(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IssueController.prototype, "deleteIssue", null);
__decorate([
    Get('analytics'),
    __param(0, Query('year')),
    __param(1, Query('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IssueController.prototype, "getAnalytics", null);
IssueController = __decorate([
    Controller('api/issues'),
    __metadata("design:paramtypes", [PrismaService])
], IssueController);
export { IssueController };
//# sourceMappingURL=issue.controller.js.map