import { z } from "zod";

export const FanoutOptionsSchema = z.object({
  concurrency: z.number().int().positive().default(4),
  stopOnError: z.boolean().default(false),
});

export type FanoutOptions = z.infer<typeof FanoutOptionsSchema>;

export type FanoutResult<T> = {
  index: number;
  value: T;
  status: "fulfilled" | "rejected";
  error?: Error;
};

export type FanoutSummary<T> = {
  results: FanoutResult<T>[];
  fulfilled: number;
  rejected: number;
  total: number;
};

export async function fanout<T>(
  items: T[],
  fn: (item: T, index: number) => Promise<void>,
  options: Partial<FanoutOptions> = {}
): Promise<FanoutSummary<T>> {
  const opts = FanoutOptionsSchema.parse(options);
  const results: FanoutResult<T>[] = [];
  let aborted = false;

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += opts.concurrency) {
    chunks.push(items.slice(i, i + opts.concurrency));
  }

  for (const chunk of chunks) {
    if (aborted) break;

    const settled = await Promise.allSettled(
      chunk.map((item, localIdx) => {
        const globalIdx = results.length + localIdx;
        return fn(item, globalIdx).then(
          () => ({ index: globalIdx, value: item, status: "fulfilled" as const }),
          (err: unknown) => ({ index: globalIdx, value: item, status: "rejected" as const, error: err instanceof Error ? err : new Error(String(err)) })
        );
      })
    );

    for (const s of settled) {
      if (s.status === "fulfilled") {
        results.push(s.value);
        if (s.value.status === "rejected" && opts.stopOnError) {
          aborted = true;
        }
      }
    }
  }

  const fulfilled = results.filter((r) => r.status === "fulfilled").length;
  const rejected = results.filter((r) => r.status === "rejected").length;

  return { results, fulfilled, rejected, total: results.length };
}

export function formatFanoutSummary<T>(summary: FanoutSummary<T>): string {
  return `fanout: ${summary.total} items — ${summary.fulfilled} ok, ${summary.rejected} failed`;
}
