/**
 * Production MCP endpoint — /mcp/<token> — served by the Next.js app itself, so
 * the whole product deploys as ONE Vercel service (no separate MCP host).
 * Uses the SDK's web-standard (Fetch Request/Response) transport in stateless
 * JSON mode, which suits serverless. Same skills/tools as the local server.
 */
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildMcpServer } from "@/mcp/build-server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

function rpcError(status: number, code: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const org = store.getOrgByToken(token);
  if (!org) return rpcError(401, -32001, "Invalid MCP token.");

  const server = buildMcpServer(org.id);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — each request is self-contained (serverless-friendly)
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({ ok: true, note: "POST JSON-RPC here with an MCP client (initialize, tools/list, …)." }),
    { headers: { "Content-Type": "application/json" } },
  );
}
