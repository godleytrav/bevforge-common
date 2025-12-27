import { proxyOsRequest, RequestContext } from "../../../lib/os-proxy";

export const GET = (request: RequestContext) =>
  proxyOsRequest(request, "/api/os/endpoints");
