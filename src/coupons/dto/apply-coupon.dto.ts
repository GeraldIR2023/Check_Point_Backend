import { IsNotEmpty } from 'class-validator';

export class ApplyCouponDto {
  @IsNotEmpty({ message: "Coupon's name is required" })
  coupon_name: string;
}
