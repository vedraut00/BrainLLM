/**
 * GET /api/export — download the org's approved skills as a .zip of SKILL.md
 * files (+ a skills.json manifest). This is the browser "Ship" action.
 */
import JSZip from "jszip";
import { store } from "@/lib/store";
import { skillToMarkdown } from "@/lib/publish";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const org = store.getOrCreateDefaultOrg();
  const views = store.getPublishedSkills(org.id);

  const zip = new JSZip();
  const manifest = views.map((v) => {
    zip.file(`${v.skill.slug}/SKILL.md`, skillToMarkdown(v));
    return {
      slug: v.skill.slug,
      title: v.current.title,
      description: v.current.description,
      status: v.skill.status,
    };
  });
  zip.file("skills.json", JSON.stringify({ org: org.slug, skills: manifest }, null, 2));

  const buf = await zip.generateAsync({ type: "arraybuffer" });
  return new Response(buf, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="brain-skills-${org.slug}.zip"`,
    },
  });
}
