import { ZodError } from 'zod';
import { TaskSchema, Task } from './task';

export interface ValidationResult {
  valid: boolean;
  task?: Task;
  errors?: string[];
}

export function validateTask(raw: unknown): ValidationResult {
  const result = TaskSchema.safeParse(raw);

  if (result.success) {
    return { valid: true, task: result.data };
  }

  const errors = formatZodErrors(result.error);
  return { valid: false, errors };
}

function formatZodErrors(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `[${issue.path.join('.')}] ` : '';
    return `${path}${issue.message}`;
  });
}
