import { Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { Repository } from 'typeorm';
import { errorHandler } from '../utils/error-handler.utils';
import { th } from 'date-fns/locale';
import { endOfDay, isAfter } from 'date-fns';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  create(createCouponDto: CreateCouponDto) {
    return this.couponRepository.save(createCouponDto);
  }

  findAll() {
    return this.couponRepository.find();
  }

  async findOne(id: number) {
    const coupon = await this.couponRepository.findOneBy({ id });

    if (!coupon)
      throw errorHandler(`Coupon with id ${id} not found`, 'Not Found');

    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.findOne(id);
    Object.assign(coupon, updateCouponDto);

    return this.couponRepository.save(coupon);
  }

  async remove(id: number) {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);

    return { message: `Coupon with id ${id} deleted successfully` };
  }

  async applyCoupon(name: string) {
    const coupon = await this.couponRepository.findOneBy({ name });
    if (!coupon)
      throw errorHandler(`Coupon with name ${name} not found`, 'Not Found');

    const currentDay = new Date();
    const expirationDate = endOfDay(coupon.expirationDate);

    if (isAfter(currentDay, expirationDate))
      throw errorHandler('Coupon expired', 'Unprocessable Entity Exception');

    return {
      message: 'Coupon applied successfully',
      ...coupon,
    };
  }
}
