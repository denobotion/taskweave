import { z } from 'zod';

export const StepSchema = z.object({
  command: z.string().min(1),
  continueOnError: z.boolean().optional(),
  env: z.record(z.string()).optional(),
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(StepSchema).min(1),
  condition: z
    .enum(['always', 'never', 'on_success', 'on_failure'])
    .optional(),
  inputs: z.record(z.string()).optional(),
  dependsOn: z.array(z.string()).optional(),
});

export type Step = z.infer<typeof StepSchema>;
export type Task = z.infer<typeof TaskSchema>;
