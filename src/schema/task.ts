import { z } from 'zod';

export const InputSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

export const ConditionSchema = z.object({
  when: z.string(),
  then: z.string(),
  otherwise: z.string().optional(),
});

export const StepSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  command: z.string(),
  inputs: InputSchema.optional(),
  condition: ConditionSchema.optional(),
  continueOnError: z.boolean().default(false),
  timeout: z.number().positive().optional(),
});

export const TaskSchema = z.object({
  version: z.literal('1.0'),
  name: z.string(),
  description: z.string().optional(),
  inputs: InputSchema.optional(),
  steps: z.array(StepSchema).min(1),
});

export type Input = z.infer<typeof InputSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Task = z.infer<typeof TaskSchema>;
