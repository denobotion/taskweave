import { z } from "zod";

export const ContextValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

export type ContextValue = z.infer<typeof ContextValueSchema>;
export type Context = Record<string, ContextValue>;

export function createContext(initial: Context = {}): Context {
  return { ...initial };
}

export function setContextValue(
  ctx: Context,
  key: string,
  value: ContextValue
): Context {
  return { ...ctx, [key]: value };
}

export function getContextValue(
  ctx: Context,
  key: string
): ContextValue | undefined {
  return ctx[key];
}

export function interpolate(template: string, ctx: Context): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    const value = ctx[key];
    if (value === undefined) {
      return match;
    }
    return String(value);
  });
}

export function mergeContext(base: Context, overrides: Context): Context {
  return { ...base, ...overrides };
}
