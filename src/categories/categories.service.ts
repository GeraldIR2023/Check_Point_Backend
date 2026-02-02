import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { errorHandler } from '../utils/error-handler.utils';
import { FindManyOptions, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const categoryExist = await this.categoryRepository.findOneBy({
      name: createCategoryDto.name,
    });

    if (categoryExist)
      throw errorHandler('Category already exists', 'Conflict Exception');

    return this.categoryRepository.save(createCategoryDto);
  }

  findAll() {
    return this.categoryRepository.find();
  }

  async findOne(
    id: number,
    products?: string,
    take: number = 12,
    skip: number = 0,
  ) {
    const category = await this.categoryRepository.findOneBy({ id });

    if (!category) throw errorHandler('Category not found', 'Not Found');

    if (products === 'true') {
      const [productsData, total] = await this.productRepository.findAndCount({
        where: { category: { id } },
        order: { id: 'DESC' },
        take: take,
        skip: skip,
      });

      return {
        ...category,
        products: productsData,
        totalProducts: total,
      };
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOneBy({ id });

    if (!category)
      throw errorHandler('Category not found', 'Conflict Exception');

    category.name = updateCategoryDto.name;

    return await this.categoryRepository.save(category);
  }

  async remove(id: number) {
    const category = await this.categoryRepository.findOneBy({ id });

    if (!category)
      throw errorHandler('Category not found', 'Conflict Exception');

    await this.categoryRepository.remove(category);
    return 'Category deleted';
  }
}
