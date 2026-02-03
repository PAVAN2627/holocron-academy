const rawTamboKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

export const TAMBO_PUBLIC_API_KEY =
  rawTamboKey && rawTamboKey.trim().length > 0 ? rawTamboKey.trim() : null;
