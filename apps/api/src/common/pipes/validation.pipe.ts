import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { flattenError, type ZodType } from 'zod';

import { ERROR_CODES } from '@app/common/filter/error-messages';

export class ZodValidationPipe<TOutput> implements PipeTransform {
  constructor(private readonly schema: ZodType<TOutput>) {}

  transform(value: unknown): TOutput {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const flat = flattenError(result.error);
      throw new BadRequestException({
        message: ERROR_CODES.VALIDATION_ERROR,
        errors: {
          ...flat.fieldErrors,
          ...(flat.formErrors.length ? { _form: flat.formErrors } : {}),
        },
      });
    }

    return result.data;
  }
}
