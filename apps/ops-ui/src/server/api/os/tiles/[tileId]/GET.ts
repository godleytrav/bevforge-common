import { proxyOsRequest, RequestContext } from "../../../../lib/os-proxy";

export const GET = (request: RequestContext) => {
  const resolved = request instanceof Request ? request : request.request;
  const path = new URL(resolved.url).pathname;
  return proxyOsRequest(request, path);
};
