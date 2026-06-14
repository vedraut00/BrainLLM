"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";

async function orgId(): Promise<string> {
  return (await store.getOrCreateDefaultOrg()).id;
}

/** Connect a help-center source and ingest → generate draft skills. (Can take ~30–60s.) */
export async function ingestAction(formData: FormData): Promise<void> {
  const url = String(formData.get("url") ?? "").trim();
  // Clamp server-side — HTML min/max aren't enforced for direct action calls.
  const max = Math.min(25, Math.max(1, Math.floor(Number(formData.get("max")) || 8)));
  if (!url) redirect("/connect?error=missing-url");
  try {
    new URL(url);
  } catch {
    redirect("/connect?error=bad-url");
  }
  let result;
  try {
    result = await store.ingestHelpCenter(await orgId(), url, max);
  } catch {
    redirect("/connect?error=ingest-failed");
  }
  revalidatePath("/skills");
  revalidatePath("/dashboard");
  redirect(`/skills?ingested=${result.skillsCreated}`);
}

export async function approveAction(formData: FormData): Promise<void> {
  const id = String(formData.get("skillId") ?? "");
  await store.approveSkill(await orgId(), id, "founder@dashboard");
  revalidatePath(`/skills/${id}`);
  revalidatePath("/skills");
  revalidatePath("/publish");
}

export async function archiveAction(formData: FormData): Promise<void> {
  const id = String(formData.get("skillId") ?? "");
  await store.archiveSkill(await orgId(), id);
  revalidatePath(`/skills/${id}`);
  revalidatePath("/skills");
}

export async function regenerateAction(formData: FormData): Promise<void> {
  const id = String(formData.get("skillId") ?? "");
  await store.regenerateSkill(await orgId(), id);
  revalidatePath(`/skills/${id}`);
  revalidatePath("/skills");
}

export async function saveEditAction(formData: FormData): Promise<void> {
  const id = String(formData.get("skillId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const bodyMd = String(formData.get("bodyMd") ?? "");
  await store.saveEdit(await orgId(), id, { title, description, bodyMd }, "user");
  revalidatePath(`/skills/${id}`);
  revalidatePath("/skills");
}

export async function detectStaleAction(): Promise<void> {
  await store.detectStaleness(await orgId());
  revalidatePath("/skills");
  revalidatePath("/dashboard");
  redirect("/skills?checked=1");
}
