import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';

@ApiTags('Owners')
@ApiBearerAuth()
@Controller('owners')
@UseGuards(JwtAuthGuard)
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new owner' })
  create(@Request() req, @Body() createOwnerDto: CreateOwnerDto) {
    return this.ownersService.create(req.user.sub, createOwnerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all owners' })
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('city') city?: string,
  ) {
    const filters: any = {};
    if (search) filters.search = search;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (city) filters.city = city;

    return this.ownersService.findAll(req.user.sub, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get owner statistics' })
  getStats(@Request() req) {
    return this.ownersService.getStats(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get owner by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.ownersService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update owner' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateOwnerDto: UpdateOwnerDto,
  ) {
    return this.ownersService.update(id, req.user.sub, updateOwnerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete owner' })
  remove(@Param('id') id: string, @Request() req) {
    return this.ownersService.remove(id, req.user.sub);
  }
}
