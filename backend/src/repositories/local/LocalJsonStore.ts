import fs from "fs";
import path from "path";

const DATA_DIR = path.join(__dirname, "..", "..", "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * A tiny file-backed "table". This exists so the app runs immediately
 * without any Google Cloud setup. It implements the exact same shape
 * of operations the Google Sheets repositories use, so switching
 * STORAGE_PROVIDER=google in .env is a drop-in replacement — no
 * controller/service code needs to change.
 */
export class LocalJsonStore<T extends { id: string }> {
  private filePath: string;
  private cache: T[] | null = null;

  constructor(tableName: string, seed: T[] = []) {
    this.filePath = path.join(DATA_DIR, `${tableName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(seed, null, 2));
    }
  }

  private read(): T[] {
    if (this.cache) return this.cache;
    const raw = fs.readFileSync(this.filePath, "utf-8");
    this.cache = raw ? JSON.parse(raw) : [];
    return this.cache!;
  }

  private write(rows: T[]) {
    this.cache = rows;
    fs.writeFileSync(this.filePath, JSON.stringify(rows, null, 2));
  }

  async all(): Promise<T[]> {
    return [...this.read()];
  }

  async findById(id: string): Promise<T | null> {
    return this.read().find((r) => r.id === id) ?? null;
  }

  async findWhere(pred: (row: T) => boolean): Promise<T[]> {
    return this.read().filter(pred);
  }

  async insert(row: T): Promise<T> {
    const rows = this.read();
    rows.push(row);
    this.write(rows);
    return row;
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const rows = this.read();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found`);
    rows[idx] = { ...rows[idx], ...patch };
    this.write(rows);
    return rows[idx];
  }

  async delete(id: string): Promise<void> {
    const rows = this.read().filter((r) => r.id !== id);
    this.write(rows);
  }

  async deleteWhere(pred: (row: T) => boolean): Promise<void> {
    const rows = this.read().filter((r) => !pred(r));
    this.write(rows);
  }
}