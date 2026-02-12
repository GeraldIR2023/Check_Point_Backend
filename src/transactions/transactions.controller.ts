import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createTransactionDto: CreateTransactionDto, @Req() req) {
    return this.transactionsService.create(createTransactionDto, req.user);
  }

  @Get('my-orders')
  @UseGuards(AuthGuard)
  findMyOrders(@Req() req) {
    return this.transactionsService.findByUser(req.user);
  }

  @Get()
  findAll(@Query('transactionDate') transactionDate: string) {
    return this.transactionsService.findAll(transactionDate);
  }

  @Get(':id')
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.transactionsService.remove(+id);
  }
}
