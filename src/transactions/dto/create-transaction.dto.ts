import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TransactionContentsDto {
  @IsNotEmpty({ message: 'ProductId cannot be empty' })
  @IsInt({ message: 'Invalid Product' })
  productId: number;

  @IsNotEmpty({ message: 'Quantity cannot be empty' })
  @IsInt({ message: 'Invalid Quantity' })
  quantity: number;

  @IsNotEmpty({ message: 'Price cannot be empty' })
  @IsNumber({}, { message: 'Invalid Price' })
  price: number;
}

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'Total cannot be empty' })
  @IsNumber({}, { message: 'Invalid Total' })
  total: number;

  @IsOptional()
  @IsString()
  coupon: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Contents cannot be empty' })
  @ValidateNested()
  @Type(() => TransactionContentsDto)
  contents: TransactionContentsDto[];
}
