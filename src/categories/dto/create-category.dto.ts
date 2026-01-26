import { IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: "Categorie's name is required" })
  name: string;
}
