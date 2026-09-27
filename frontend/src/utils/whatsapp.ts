import { FinancerSettings } from "@/types";

export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : `{${key}}`));
}

export function normalizePhoneForWa(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/** Builds a personal-WhatsApp deep link. Never sends automatically - user must press Send in WhatsApp. */
export function buildWhatsAppLink(
  phone: string,
  language: "en" | "hi",
  settings: FinancerSettings,
  vars: Record<string, string | number>
): string {
  const template = language === "hi" ? settings.whatsappDefaultMessageHi : settings.whatsappDefaultMessageEn;
  const message = fillTemplate(template, vars);
  return `https://wa.me/${normalizePhoneForWa(phone)}?text=${encodeURIComponent(message)}`;
}
