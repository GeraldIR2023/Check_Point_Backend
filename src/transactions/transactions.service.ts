import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindManyOptions, Repository } from 'typeorm';
import {
  Transaction,
  TransactionContents,
} from './entities/transaction.entity';
import { Product } from '../products/entities/product.entity';
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { errorHandler } from '../utils/error-handler.utils';
import { CouponsService } from '../coupons/coupons.service';
import { Coupon } from '../coupons/entities/coupon.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionContents)
    private readonly transactionContentsRepository: Repository<TransactionContents>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly couponService: CouponsService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, user: User) {
    await this.productRepository.manager.transaction(
      async (transactionEntityManager) => {
        const transaction = new Transaction();
        transaction.user = user;

        const total = createTransactionDto.contents.reduce(
          (total, item) => total + item.quantity * item.price,
          0,
        );
        transaction.total = total;

        if (createTransactionDto.coupon) {
          const coupon = await this.couponService.applyCoupon(
            createTransactionDto.coupon,
          );

          const discount = (coupon.percentage / 100) * total;
          transaction.discount = discount;
          transaction.coupon = coupon.name;
          transaction.total -= discount;
        }

        await transactionEntityManager.save(transaction);

        for (const contents of createTransactionDto.contents) {
          const product = await transactionEntityManager.findOneBy(Product, {
            id: contents.productId,
          });

          const errors: string[] = [];

          if (!product) {
            errors.push(`Product with id ${contents.productId} not found`);
            throw new NotFoundException(errors);
          }

          if (!product.isPreOrder && contents.quantity > product.inventory) {
            errors.push(
              `Article ${product.name} exceeds the available quantity`,
            );
            throw new BadRequestException(errors);
          }
          product.inventory -= contents.quantity;

          const transactionContent = new TransactionContents();
          transactionContent.price = contents.price;
          transactionContent.product = product;
          transactionContent.quantity = contents.quantity;
          transactionContent.transaction = transaction;

          await transactionEntityManager.save(transactionContent);
        }
      },
    );

    return { message: 'Sale stored successfully' };
  }

  findAll(transactionDate?: string) {
    const options: FindManyOptions<Transaction> = {
      relations: {
        contents: true,
        user: true,
      },
    };

    if (transactionDate) {
      const date = parseISO(transactionDate);

      if (!isValid(date))
        throw errorHandler('Invalid date format', 'Bad Request');

      const start = startOfDay(date);
      const end = endOfDay(date);

      options.where = {
        transactionDate: Between(start, end),
      };
    }
    return this.transactionRepository.find(options);
  }

  async findOne(id: number) {
    const transaction = await this.transactionRepository.findOne({
      where: {
        id,
      },
      relations: {
        contents: true,
      },
    });

    if (!transaction)
      throw errorHandler(`Transaction with id ${id} not found`, 'Not Found');

    return transaction;
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.transactionRepository.findOne({
      where: {
        id,
      },
      relations: {
        contents: { product: true },
      },
    });

    if (!transaction)
      throw errorHandler(`Transaction with id ${id} not found`, 'Not Found');

    await this.transactionRepository.manager.transaction(
      async (transactionManager) => {
        //*Return the inventory
        for (const currentContent of transaction.contents) {
          const product = currentContent.product;
          product.inventory += currentContent.quantity;
          await transactionManager.save(product);
        }

        //*Remove current content
        await transactionManager.delete(TransactionContents, {
          transaction: { id },
        });

        //*Add new content
        const newContents: TransactionContents[] = [];
        let newTotal = 0;

        const contents = updateTransactionDto.contents;

        if (!contents) throw errorHandler('Content not found', 'Not Found');

        for (const item of contents) {
          const product = await transactionManager.findOneBy(Product, {
            id: item.productId,
          });

          if (!product)
            throw errorHandler(`Product with id ${id} not found`, 'Not Found');

          //*Validate stock
          if (item.quantity > product.inventory) {
            throw errorHandler(
              `Article ${product.name} exceeds the available quantity`,
              'Bad Request',
            );
          }

          //*Update inventory
          product.inventory -= item.quantity;
          await transactionManager.save(product);

          //*New total
          newTotal += item.quantity * item.price;

          //*New content instance
          const content = new TransactionContents();
          content.product = product;
          content.quantity = item.quantity;
          content.price = item.price;
          content.transaction = transaction;
          newContents.push(content);
        }

        let discount = 0;
        const coupon = updateTransactionDto.coupon;

        if (coupon) {
          const appliedCoupon = await transactionManager.findOneBy(Coupon, {
            name: coupon,
          });

          if (!appliedCoupon)
            throw errorHandler(
              `Coupon ${coupon} is invalid or expired`,
              'Bad Request',
            );

          discount = newTotal * (appliedCoupon.percentage / 100);
        }

        transaction.total = newTotal - discount;
        transaction.discount = discount;
        transaction.coupon = coupon ?? '';

        await transactionManager.save(transaction);
        await transactionManager.save(TransactionContents, newContents);
      },
    );

    return { message: 'Transaction updated successfully' };
  }

  async remove(id: number) {
    const transaction = await this.findOne(id);

    if (!transaction)
      throw errorHandler(`Transaction with id ${id} not found`, 'Not Found');

    for (const contents of transaction.contents) {
      const product = await this.productRepository.findOneBy({
        id: contents.product.id,
      });

      if (product) {
        product.inventory += contents.quantity;
        await this.productRepository.save(product);
      }

      const transactionContents =
        await this.transactionContentsRepository.findOneBy({ id: contents.id });

      if (transactionContents) {
        await this.transactionContentsRepository.remove(transactionContents);
      }
    }
    await this.transactionRepository.remove(transaction);

    return { message: 'Transaction removed successfully' };
  }

  async findByUser(userId: number) {
    return await this.transactionRepository.find({
      where: { user: { id: userId } },
      relations: {
        contents: {
          product: true,
        },
      },
      order: {
        transactionDate: 'DESC',
      },
    });
  }
}
