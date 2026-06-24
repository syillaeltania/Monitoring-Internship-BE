import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { AppService } from './app.service.js';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Post('auth/login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('dashboard')
  dashboard(@Query() query: Record<string, string>) {
    return this.appService.getDashboard(query);
  }

  @Get('interns')
  interns(@Query() query: Record<string, string>) {
    return this.appService.getInterns(query);
  }

  @Post('interns')
  createIntern(@Body() body: Record<string, unknown>) {
    return this.appService.createIntern(body);
  }

  @Put('interns/:id')
  updateIntern(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.appService.updateIntern(id, body);
  }

  @Delete('interns/:id')
  deleteIntern(@Param('id') id: string) {
    return this.appService.deleteIntern(id);
  }

  @Get('costs')
  costs(@Query() query: Record<string, string>) {
    return this.appService.getCosts(query);
  }

  @Put('costs/:internId/:year/:month')
  updateCost(
    @Param('internId') internId: string,
    @Param('year') year: string,
    @Param('month') month: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.appService.updateMonthlyCost(internId, Number(year), Number(month), body);
  }

  @Get('replacement')
  replacement() {
    return this.appService.getReplacement();
  }

  @Get('plans')
  plans(@Query() query: Record<string, string>) {
    return this.appService.getPlans(query);
  }

  @Post('plans')
  createPlan(@Body() body: Record<string, unknown>) {
    return this.appService.createPlan(body);
  }

  @Put('plans/:id')
  updatePlanStatus(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.appService.updatePlanStatus(id, body);
  }

  @Get('completion')
  completion() {
    return this.appService.getCompletion();
  }

  @Put('completion/:internId')
  updateCompletion(@Param('internId') internId: string, @Body() body: Record<string, unknown>) {
    return this.appService.updateCompletion(internId, body);
  }

  @Get('organization')
  organization() {
    return this.appService.getOrganization();
  }

  @Get('notifications')
  notifications() {
    return this.appService.getNotifications();
  }

  @Post('import/excel')
  importExcel() {
    return this.appService.importExcel(process.env.EXCEL_PATH ?? '/Users/syilla/Downloads/Data Magang Neuron.xlsx');
  }
}
