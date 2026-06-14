/**
 * MCP test client — proves an external MCP-capable agent can consume an org's
 * published skills over the network. Connects to the running server, lists
 * tools + resources, reads a resource, and calls the get_skill tool.
 *
 *   1) start the server:  npm run mcp
 *   2) in another shell:  npm run mcp:test
 */
import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { store } from "../lib/store";

const PORT = Number(process.env.CB_MCP_PORT ?? 8787);

async function main(): Promise<void> {
  const org = store.getOrCreateDefaultOrg();
  const endpoint = process.argv[2] ?? `http://localhost:${PORT}/mcp/${org.mcpToken}`;
  console.log(`\n🔌 Connecting MCP client to ${endpoint}\n`);

  const client = new Client({ name: "cb-test-client", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(endpoint));
  await client.connect(transport);
  console.log("✓ Connected + initialized.\n");

  const tools = await client.listTools();
  console.log(`Tools (${tools.tools.length}): ${tools.tools.map((t) => t.name).join(", ")}`);

  const resources = await client.listResources();
  console.log(`Resources (${resources.resources.length}):`);
  for (const r of resources.resources) console.log(`   • ${r.uri}  — ${r.name}`);

  console.log(`\n── call tool: list_skills ──`);
  const listed = await client.callTool({ name: "list_skills", arguments: {} });
  const listedText =
    Array.isArray(listed.content) && listed.content[0]?.type === "text" ? String(listed.content[0].text) : "";
  console.log(listedText);

  const firstSlug = (() => {
    try {
      return (JSON.parse(listedText) as Array<{ slug: string }>)[0]?.slug;
    } catch {
      return undefined;
    }
  })();

  if (firstSlug) {
    console.log(`── call tool: get_skill { slug: "${firstSlug}" } ──`);
    const got = await client.callTool({ name: "get_skill", arguments: { slug: firstSlug } });
    const gotText = Array.isArray(got.content) && got.content[0]?.type === "text" ? got.content[0].text : "";
    console.log(gotText.slice(0, 500) + (gotText.length > 500 ? "\n... [truncated]" : ""));
  }

  if (resources.resources[0]) {
    console.log(`\n── read resource: ${resources.resources[0].uri} ──`);
    const read = await client.readResource({ uri: resources.resources[0].uri });
    const text = read.contents[0] && "text" in read.contents[0] ? String(read.contents[0].text) : "";
    console.log(text.slice(0, 300) + (text.length > 300 ? "\n... [truncated]" : ""));
  }

  await client.close();
  console.log(`\n✓ MCP round-trip OK — an agent can read approved skills from this endpoint.\n`);
}

main().catch((err) => {
  console.error("\n✗ MCP client test failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
