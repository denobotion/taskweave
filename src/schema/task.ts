import { z } from 'zod';

export const ConditionSchema = z.object({
  key: z.string(),
  op: z.enum(['eq', 'neq', 'gt', 'lt', 'contains']),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const RetrySchema = z.object({
  attempts: z.number().int().min(1).default(1),
  delay: z.union([z.string(), z.number()]).optional(),
  backoff: z.enum(['fixed', 'exponential']).default('fixed'),
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(1),
  description: z.string().optional(),
  depends: z.array(z.string()).default([]),
  inputs: z.record(z.string()).optional(),
  condition: ConditionSchema.optional(),
  retry: RetrySchema.optional(),
  timeout: z.union([z.string(), z.number()]).optional(),
  env: z.record(z.string()).optional(),
});

export const TaskFileSchema = z.object({
  version: z.string().default('1'),
  tasks: z.array(TaskSchema).min(1),
});

export type Condition = z.infer<typeof ConditionSchema>;
export type Retry = z.infer<typeof RetrySchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TaskFile = z.infer<typeof TaskFileSchema>;
