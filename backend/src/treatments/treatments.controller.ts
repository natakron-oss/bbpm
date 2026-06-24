import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { Treatment } from './treatment.entity';

@Controller('treatments')
export class TreatmentsController {
  constructor(private treatmentsService: TreatmentsService) {}

  @Get()
  findAll(@Query('patientId') patientId?: string) {
    if (patientId) return this.treatmentsService.findByPatient(patientId);
    return this.treatmentsService.findAll();
  }

  @Post()
  create(@Body() body: Partial<Treatment>) {
    return this.treatmentsService.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.treatmentsService.remove(id);
  }
}