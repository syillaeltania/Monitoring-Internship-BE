import { PrismaService } from '../prisma/prisma.service.js';
export declare class IssueController {
    private prisma;
    constructor(prisma: PrismaService);
    getIssues(year?: string, month?: string, division?: string, status?: string): Promise<({
        intern: {
            id: string;
            name: string;
            division: string;
            team: string;
            institution: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.IssueType[];
        internId: string;
        description: string;
        reportedDate: Date;
        followUpAction: string | null;
        status: import("@prisma/client").$Enums.IssueStatus;
        resolvedDate: Date | null;
    })[]>;
    createIssue(data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.IssueType[];
        internId: string;
        description: string;
        reportedDate: Date;
        followUpAction: string | null;
        status: import("@prisma/client").$Enums.IssueStatus;
        resolvedDate: Date | null;
    }>;
    updateIssue(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.IssueType[];
        internId: string;
        description: string;
        reportedDate: Date;
        followUpAction: string | null;
        status: import("@prisma/client").$Enums.IssueStatus;
        resolvedDate: Date | null;
    }>;
    deleteIssue(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.IssueType[];
        internId: string;
        description: string;
        reportedDate: Date;
        followUpAction: string | null;
        status: import("@prisma/client").$Enums.IssueStatus;
        resolvedDate: Date | null;
    }>;
    getAnalytics(year?: string, month?: string): Promise<{
        summary: {
            totalActive: number;
            totalIssues: number;
            unresolvedIssues: number;
            internsWithIssues: number;
            issueRate: number;
        };
        charts: {
            byType: {
                name: string;
                value: number;
            }[];
            byDivision: {
                name: string;
                value: number;
            }[];
            byInstitution: {
                name: string;
                value: number;
            }[];
        };
    }>;
}
