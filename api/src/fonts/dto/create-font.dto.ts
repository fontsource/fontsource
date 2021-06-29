import { IsInt, IsString, IsBoolean } from 'class-validator';
import { Variants } from '../schemas/variants.schema';

export class CreateFontDto {
  @IsString()
  readonly id: string;

  @IsString()
  family: string;

  @IsString({ each: true })
  subsets: string[];

  @IsInt({ each: true })
  weights: number[];

  @IsString({ each: true })
  styles: string[];

  @IsString()
  defSubset: string;

  @IsBoolean()
  variable: boolean;

  @IsString()
  lastModified: string;

  @IsString()
  category: string;

  @IsString()
  type: string;

  variants: Variants[];
}
