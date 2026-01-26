import { IsDateString, IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateCouponDto {
  @IsNotEmpty({ message: "Coupon's name is required" })
  name: string;

  @IsNotEmpty({ message: 'Discount cannot be empty' })
  @IsInt({ message: 'Discount must be between 1 and 0' })
  @Max(100, { message: 'The maximum discount is 100' })
  @Min(1, { message: 'The minimum discount is 1' })
  percentage: number;

  @IsNotEmpty({ message: 'Date cannot be empty' })
  @IsDateString({}, { message: 'Invalid date format' })
  expirationDate: Date;
}
