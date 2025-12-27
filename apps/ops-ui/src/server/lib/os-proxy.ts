export type RequestContext = Request | { request: Request };

type ProxyOptions = {
  method?: string;
  path: string;
  request: Request;
};

const DEFAULT_OS_BASE_URL = "http://localhost:8080";

const resolveRequest = (input: RequestContext): Request =>
  input instanceof Request ? input : input.request;

const buildProxyOptions = async ({ method, path, request }: ProxyOptions) => {
  const headers = new Headers();
  const authHeader = request.headers.get("Authorization");
  const contentType = request.headers.get("Content-Type");

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const init: RequestInit = {
    method: method ?? request.method,
    headers,
  };

  if (init.method && !["GET", "HEAD"].includes(init.method)) {
    init.body = await request.arrayBuffer();
  }

  const baseUrl = process.env.OS_BASE_URL ?? DEFAULT_OS_BASE_URL;
  const originalUrl = new URL(request.url);
  const targetUrl = new URL(path, baseUrl);
  targetUrl.search = originalUrl.search;

  return { init, targetUrl };
};

export const proxyOsRequest = async (
  input: RequestContext,
  path: string,
  method?: string
): Promise<Response> => {
  try {
    const request = resolveRequest(input);
    const { init, targetUrl } = await buildProxyOptions({
      method,
      path,
      request,
    });

    const response = await fetch(targetUrl, init);
    const payload = await response.arrayBuffer();
    const headers = new Headers(response.headers);

    return new Response(payload, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "OS backend unavailable";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};
