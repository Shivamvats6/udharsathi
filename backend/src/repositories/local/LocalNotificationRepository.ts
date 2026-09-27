import { NotificationRepository } from "../interfaces";
import { AppNotification } from "../../types";
import { LocalJsonStore } from "./LocalJsonStore";
import { generateId, nowISO } from "../../utils/id";

const store = new LocalJsonStore<AppNotification>("notifications", []);

export class LocalNotificationRepository implements NotificationRepository {
  async findAll(): Promise<AppNotification[]> {
    const rows = await store.all();
    return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  async create(data: Omit<AppNotification, "id" | "createdAt" | "read">): Promise<AppNotification> {
    const rec: AppNotification = { ...data, id: generateId("notif"), createdAt: nowISO(), read: false };
    return store.insert(rec);
  }
  async markRead(id: string): Promise<void> {
    await store.update(id, { read: true });
  }
}
