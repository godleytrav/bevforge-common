import { proxyOsRequest, RequestContext } from "../../../lib/os-proxy";

export const POST = (request: RequestContext) =>
  proxyOsRequest(request, "/api/os/command", "POST");
