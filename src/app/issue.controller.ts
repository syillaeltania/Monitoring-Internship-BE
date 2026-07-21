import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('api/issues')
export class IssueController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getIssues(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('division') division?: string,
    @Query('status') status?: string,
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (year) {
      const y = parseInt(year);
      if (month) {
        const m = parseInt(month) - 1;
        startDate = new Date(y, m, 1);
        endDate = new Date(y, m + 1, 0);
      } else {
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31);
      }
    }

    const where: any = {};
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

  @Post()
  async createIssue(@Body() data: any) {
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

  @Put(':id')
  async updateIssue(@Param('id') id: string, @Body() data: any) {
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

  @Delete(':id')
  async deleteIssue(@Param('id') id: string) {
    return this.prisma.internIssue.delete({
      where: { id },
    });
  }

  @Get('analytics')
  async getAnalytics(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

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
    } else {
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
    const unresolvedIssues = issues.filter((i: any) => i.status !== 'RESOLVED').length;

    // Count unique interns with issues
    const uniqueInternIds = new Set(issues.map((i: any) => i.internId));
    const internsWithIssues = uniqueInternIds.size;
    
    // Issue Rate %
    const issueRate = totalActive > 0 ? (internsWithIssues / totalActive) * 100 : 0;

    // Aggregations
    const byType = issues.reduce((acc: Record<string, number>, issue: any) => {
      const types = Array.isArray(issue.type) ? issue.type : [issue.type];
      for (const t of types) {
        acc[t] = (acc[t] || 0) + 1;
      }
      return acc;
    }, {});

    const byDivision = issues.reduce((acc: Record<string, number>, issue: any) => {
      const div = issue.intern.division;
      acc[div] = (acc[div] || 0) + 1;
      return acc;
    }, {});

    const byInstitution = issues.reduce((acc: Record<string, number>, issue: any) => {
      const inst = issue.intern.institution || 'Lainnya';
      acc[inst] = (acc[inst] || 0) + 1;
      return acc;
    }, {});

    // Format chart data
    const chartByType = Object.entries(byType).map(([name, value]) => ({ name, value }));
    
    const chartByDivision = Object.entries(byDivision)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);

    // Top 5 institutions
    const chartByInstitution = Object.entries(byInstitution)
      .map(([name, value]) => ({ name, value: value as number }))
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
}
