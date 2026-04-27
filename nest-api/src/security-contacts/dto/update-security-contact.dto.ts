import { PartialType } from '@nestjs/mapped-types';
import { CreateSecurityContactDto } from './create-security-contact.dto';

export class UpdateSecurityContactDto extends PartialType(CreateSecurityContactDto) {}
