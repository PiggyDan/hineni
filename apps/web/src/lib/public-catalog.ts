import "server-only";

export async function loadPublicData<T>(query: () => Promise<T>): Promise<{ data: T | null; unavailable: boolean }> {
  try { return { data: await query(), unavailable: false }; }
  catch { return { data: null, unavailable: true }; }
}

export function externalLinks(value: unknown): { provider: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || typeof item.url !== "string") return [];
    try {
      const url = new URL(item.url);
      return url.protocol === "https:" && !url.username && !url.password ? [{ provider: typeof item.provider === "string" ? item.provider : url.hostname, url: url.href }] : [];
    } catch { return []; }
  });
}
