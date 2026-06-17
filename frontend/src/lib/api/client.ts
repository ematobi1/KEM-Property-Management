export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('pms_session') : null;
    if (!raw) return null;
    return (JSON.parse(raw) as { token: string }).token;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string | undefined>,
): Promise<T> {
  const token = getToken();

  let url = `/api${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) params.set(k, v);
    }
    const qs = params.toString();
    if (qs) url = `${url}?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    throw new ApiError(
      res.status,
      err.error?.code ?? 'UNKNOWN',
      err.error?.message ?? 'Request failed',
    );
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export function getWsToken(): string | null {
  return getToken();
}
