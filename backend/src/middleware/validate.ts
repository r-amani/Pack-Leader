import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { sendError } from '../utils/api-response';

/**
 * Run an array of express-validator validation chains and
 * return errors if validation fails.
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => {
      if (err.type === 'field') {
        return `${err.path}: ${err.msg}`;
      }
      return err.msg;
    });

    sendError(res, extractedErrors.join('; '), 400);
  };
}
