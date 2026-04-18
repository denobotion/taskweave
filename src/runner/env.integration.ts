import { resolveEnv, maskEnv, interpolateEnv, EnvOverride, ResolvedEnv } from "./env";
import { TaskDefinition } from "../schema/task";

export interface TaskEnvContext {
  env: ResolvedEnv;
  forProcess: () => Record<string, string>;
  sanitize: (output: string) => string;
}

export function buildTaskEnv(
  task: TaskDefinition,
  extraOverrides: EnvOverride = {}
): TaskEnvContext {
  const taskEnv: EnvOverride = {
    ...(task.env ?? {}),
    ...extraOverrides,
  };

  const secrets: string[] = (task as any).secrets ?? [];

  const env = resolveEnv(process.env as Record<string, string>, taskEnv, secrets);

  return {
    env,
    forProcess: () => ({ ...env.vars }),
    sanitize: (output: string) => maskEnv(env, output),
  };
}

export function resolveTaskCommand(
  command: string,
  envCtx: TaskEnvContext
): string {
  return interpolateEnv(command, envCtx.env);
}
