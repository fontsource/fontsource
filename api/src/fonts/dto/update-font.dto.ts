import { PartialType } from '@nestjs/mapped-types';
import { CreateFontDto } from './create-font.dto';

export class UpdateFontDto extends PartialType(CreateFontDto) {}
