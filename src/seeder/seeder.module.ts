import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { SeederService } from './seeder.service';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import {
  Transaction,
  TransactionContents,
} from '../transactions/entities/transaction.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Product,
      Category,
      Transaction,
      TransactionContents,
      Coupon,
    ]),
    TransactionsModule,
    CouponsModule,
  ],
  providers: [SeederService],
})
export class SeederModule {}
