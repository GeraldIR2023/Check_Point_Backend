import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { errorHandler } from '../utils/error-handler.utils';
import { FindManyOptions, In, IsNull, Not, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const category = await this.categoryRepository.findOneBy({
      id: createProductDto.categoryId,
    });

    if (!category) throw errorHandler('Category not found', 'Not Found');

    return this.productRepository.save({
      ...createProductDto,
      category,
    });
  }

  async findAll(
    categoryId: number | null,
    platform: string | null,
    take: number,
    skip: number,
  ) {
    const options: FindManyOptions<Product> = {
      relations: {
        category: true,
      },
      order: {
        id: 'DESC',
      },
      take,
      skip,
    };

    const where: any = {};

    if (categoryId) {
      where.category = { id: categoryId };
    }

    if (platform) {
      where.platform = In([platform, 'Multi']);
    }

    if (Object.keys(where).length > 0) {
      options.where = where;
    }

    const [products, total] =
      await this.productRepository.findAndCount(options);

    return {
      products,
      total,
    };
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!product)
      throw errorHandler(`Product with id: ${id} not found`, 'Not Found');

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);

    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOneBy({
        id: updateProductDto.categoryId,
      });

      if (!category) throw errorHandler('Category not found', 'Not Found');

      product.category = category;
    }

    return this.productRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);

    if (!product)
      throw errorHandler(`Product with id: ${id} not found`, 'Not Found');

    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully' };
  }

  async homeProducts() {
    const [featured, specialOffers, preOrders, newArrivals] = await Promise.all(
      [
        this.productRepository.find({
          where: { isFeatured: true },
          take: 4,
          relations: { category: true },
        }),
        this.productRepository.find({
          where: { discountPrice: Not(IsNull()) },
          take: 4,
        }),
        this.productRepository.find({ where: { isPreOrder: true }, take: 4 }),
        this.productRepository.find({
          where: { isPreOrder: false },
          order: { addedAt: 'DESC' },
          take: 8,
        }),
      ],
    );

    return {
      featured,
      specialOffers,
      preOrders,
      newArrivals,
    };
  }
}
