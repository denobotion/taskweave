import { createHash, randomBytes } from "crypto";

export interface Token {
  id: string;
  value: string;
  createdAt: number;
  expiresAt: number | null;
  meta: Record<string, string>;
}

export interface TokenStore {
  tokens: Map<string, Token>;
}

export function createTokenStore(): TokenStore {
  return { tokens: new Map() };
}

export function issueToken(
  store: TokenStore,
  meta: Record<string, string> = {},
  ttlMs: number | null = null
): Token {
  const value = randomBytes(32).toString("hex");
  const id = createHash("sha256").update(value).digest("hex").slice(0, 16);
  const now = Date.now();
  const token: Token = {
    id,
    value,
    createdAt: now,
    expiresAt: ttlMs !== null ? now + ttlMs : null,
    meta,
  };
  store.tokens.set(id, token);
  return token;
}

export function revokeToken(store: TokenStore, id: string): boolean {
  return store.tokens.delete(id);
}

export function validateToken(store: TokenStore, id: string): Token | null {
  const token = store.tokens.get(id);
  if (!token) return null;
  if (token.expiresAt !== null && Date.now() > token.expiresAt) {
    store.tokens.delete(id);
    return null;
  }
  return token;
}

export function pruneExpiredTokens(store: TokenStore): number {
  const now = Date.now();
  let pruned = 0;
  for (const [id, token] of store.tokens) {
    if (token.expiresAt !== null && now > token.expiresAt) {
      store.tokens.delete(id);
      pruned++;
    }
  }
  return pruned;
}

export function formatTokenLine(token: Token): string {
  const exp = token.expiresAt ? new Date(token.expiresAt).toISOString() : "never";
  return `[token:${token.id}] created=${new Date(token.createdAt).toISOString()} expires=${exp}`;
}
