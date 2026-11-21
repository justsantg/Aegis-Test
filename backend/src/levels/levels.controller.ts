import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { LevelsService } from './levels.service';

@ApiTags('Levels')
@Controller({
  path: 'levels',
  version: '1',
})
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  @ApiQuery({ name: 'languageId', required: false, type: Number })
  async findAll(@Query('languageId') languageId?: number) {
    return this.levelsService.findAll(
      languageId ? Number(languageId) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.levelsService.findOne(id);
  }
}
