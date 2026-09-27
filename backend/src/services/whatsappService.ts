import { FinancerSettings } from "../types";

/**
 * Personal WhatsApp deep-link generator (spec section 3 & 4).
 * This NEVER sends anything automatically - it only builds a
 * https://wa.me/<phone>?text=<message> link. The financer must
 * press Send themselves inside their own WhatsApp app.
 */
export interface WhatsAppMessageVars {
  customer_name: string;
  amount_due: string | number;
  next_payment_date: string;
  outstanding: string | number;
  late_fee: string | number;
  total_due: string | number;
  business_name: string;
}

export function fillTemplate(template: string, vars: WhatsAppMessageVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: keyof WhatsAppMessageVars) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`
  );
}

export function normalizePhoneForWa(phone: string): string {
  // wa.me requires digits only, with country code, no + or spaces
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppLink(
  phone: string,
  language: "en" | "hi",
  settings: FinancerSettings,
  vars: WhatsAppMessageVars
): { url: string; message: string } {
  const template = language === "hi" ? settings.whatsappDefaultMessageHi : settings.whatsappDefaultMessageEn;
  const message = fillTemplate(template, vars);
  const url = `https://wa.me/${normalizePhoneForWa(phone)}?text=${encodeURIComponent(message)}`;
  return { url, message };
}
