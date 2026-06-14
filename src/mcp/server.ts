/**
 * Local standalone MCP server (dev convenience) — `npm run mcp`.
 * Each org gets a token-authed endpoint /mcp/<mcpToken> exposing its APPROVED
 * skills as MCP resources + list_skills/get_skill tools (shared builder in
 * ./build-server). Production serves the same thing from the Next.js route at
 * src/app/mcp/[token]/route.ts (one deployable app).
 */
import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { store } from "../lib/store";
import { buildMcpServer } from "./build-server";

const PORT = Number(process.env.CB_MCP_PORT ?? 8787);

interface Session {
  transport: StreamableHTTPServerTransport;
  orgId: string;
}
const sessions = new Map<string, Session>();

function header(req: IncomingMessage, name: string): string | undefined {
  const h = req.headers[name];
  return Array.isArray(h) ? h[0] : h;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return undefined;
  }
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

const rpcError = (code: number, message: string) => ({ jsonrpc: "2.0" as const, error: { code, message }, id: null });

const httpServer = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    if (url.pathname === "/health") return sendJson(res, 200, { ok: true });

    const match = url.pathname.match(/^\/mcp\/([A-Za-z0-9]+)\/?$/);
    if (!match) return sendJson(res, 404, rpcError(-32004, "Not found. Use /mcp/<token>."));
    const org = store.getOrgByToken(match[1]!);
    if (!org) return sendJson(res, 401, rpcError(-32001, "Invalid MCP token."));

    const sessionId = header(req, "mcp-session-id");

    if (req.method === "POST") {
      const body = await readBody(req);
      const existing = sessionId ? sessions.get(sessionId) : undefined;
      if (existing) {
        if (existing.orgId !== org.id) return sendJson(res, 403, rpcError(-32003, "Session/token mismatch."));
        await existing.transport.handleRequest(req, res, body);
        return;
      }
      if (!sessionId && isInitializeRequest(body)) {
        let transport!: StreamableHTTPServerTransport;
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (sid: string) => {
            sessions.set(sid, { transport, orgId: org.id });
          },
        });
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid) sessions.delete(sid);
        };
        const server = buildMcpServer(org.id);
        await server.connect(transport);
        await transport.handleRequest(req, res, body);
        return;
      }
      return sendJson(res, 400, rpcError(-32000, "Bad Request: missing session. Send initialize first."));
    }

    if (req.method === "GET" || req.method === "DELETE") {
      const existing = sessionId ? sessions.get(sessionId) : undefined;
      if (!existing || existing.orgId !== org.id) return sendJson(res, 400, rpcError(-32000, "No valid session."));
      await existing.transport.handleRequest(req, res);
      return;
    }

    res.writeHead(405, { Allow: "POST, GET, DELETE" });
    res.end();
  } catch (err) {
    if (!res.headersSent) sendJson(res, 500, rpcError(-32603, err instanceof Error ? err.message : "Internal error"));
  }
});

httpServer.listen(PORT, () => {
  const org = store.getOrCreateDefaultOrg();
  console.log(`\n🧠 Company Brain MCP server (local) on http://localhost:${PORT}`);
  console.log(`   Default org endpoint:  http://localhost:${PORT}/mcp/${org.mcpToken}`);
  console.log(`   Published skills:      ${store.getPublishedSkills(org.id).length}`);
  console.log(`   (Ctrl+C to stop · production serves the same thing from the Next /mcp/<token> route)\n`);
});
