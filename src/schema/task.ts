import { z } from "zod";

export const StepSchema = z.object({
  name: z.string(),
  run: z.string(),
  condition: z.string().optional(),
  retries: z.number().int().min(0).default(0),
  timeout: z.string().optional(),
  continueOnError: z.boolean().default(false),
});

export const TaskDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputs: z.record(z.string(), z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  secrets: z.array(z.string()).optional(),
  steps: z.array(StepSchema),
  dependsOn: z.array(z.string()).optional(),
  watch: z.array(z.string()).optional(),
  cache: z
    .object({
      key: z.string(),
      paths: z.array(z.string()),
    })
    .optional(),
});

export type StepDefinition = z.infer<typeof StepSchema>;
export type TaskDefinition = z.infer<typeof TaskDefinitionSchema>;
