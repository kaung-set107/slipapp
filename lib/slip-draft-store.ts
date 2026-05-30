import type { SlipFormValues } from "@/lib/slip";

const slipDrafts = new Map<string, SlipFormValues>();

export function saveSlipDraft(values: SlipFormValues) {
  const id = `slip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  slipDrafts.set(id, values);
  return id;
}

export function getSlipDraft(id: string) {
  return slipDrafts.get(id) ?? null;
}
