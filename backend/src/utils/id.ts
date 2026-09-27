import { randomUUID } from "crypto";

export function generateId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
