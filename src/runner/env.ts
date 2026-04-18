import { z } from "zod";

export const EnvOverrideSchema = z.record(z.string(), z.string());
export type EnvOverride = z.infer<typeof EnvOverrideSchema>;

export interface ResolvedEnv {
  vars: Record<string, string>;
  masked: Set<string>;
}

export function resolveEnv(
  base: NodeJS.ProcessEnv,
  overrides: EnvOverride = {},
  secrets: string[] = []
): ResolvedEnv {
  const vars: Record<string, string> = {};

  for (const [k, v] of Object.entries(base)) {
    if (v !== undefined) vars[k] = v;
  }

  for (const [k, v] of Object.entries(overrides)) {
    vars[k] = v;
  }

  const masked = new Set(secrets);
  return { vars, masked };
}

export function maskEnv(
  env: ResolvedEnv,
  output: string
): string {
  let result = output;
  for (const key of env.masked) {
    const val = env.vars[key];
    if (val && val.length > 0) {
      result = result.split(val).join("[MASKED]");
    }
  }
  return result;
}

export function interpolateEnv(
  template: string,
  env: ResolvedEnv
): string {
  return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
    return env.vars[key] ?? "";
  });
}
