/**
 * Builds an MCP server populated with one org's published skills.
 * Shared by the local standalone server (src/mcp/server.ts) and the production
 * Next.js route (src/app/mcp/[token]/route.ts) so there's a single definition.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../lib/store";
import { skillToMarkdown } from "../lib/publish";

export async function buildMcpServer(orgId: string): Promise<McpServer> {
  const org = await store.getOrg(orgId);
  const views = await store.getPublishedSkills(orgId);
  const server = new McpServer(
    { name: `company-brain/${org?.slug ?? orgId}`, version: "0.1.0" },
    { capabilities: { resources: {}, tools: {} } },
  );

  for (const v of views) {
    server.registerResource(
      v.skill.slug,
      `skill://${v.skill.slug}`,
      { title: v.current.title, description: v.current.description, mimeType: "text/markdown" },
      async (uri) => ({
        contents: [{ uri: uri.href, mimeType: "text/markdown", text: skillToMarkdown(v) }],
      }),
    );
  }

  server.registerTool(
    "list_skills",
    {
      title: "List approved skills",
      description: "List this company's human-approved skills (slug, title, and when to use each).",
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            views.map((v) => ({
              slug: v.skill.slug,
              title: v.current.title,
              when_to_use: v.current.description,
              status: v.skill.status,
            })),
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.registerTool(
    "get_skill",
    {
      title: "Get a skill",
      description: "Return the full approved SKILL.md (procedure + sources) for a given skill slug.",
      inputSchema: { slug: z.string().describe("the skill slug, from list_skills") },
    },
    async ({ slug }) => {
      const v = views.find((x) => x.skill.slug === slug);
      if (!v) {
        return {
          content: [{ type: "text", text: `No approved skill with slug "${slug}". Call list_skills first.` }],
          isError: true,
        };
      }
      return { content: [{ type: "text", text: skillToMarkdown(v) }] };
    },
  );

  return server;
}
