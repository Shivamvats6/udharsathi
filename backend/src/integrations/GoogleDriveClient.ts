import { google } from "googleapis";
import { Readable } from "stream";
import { getDriveAuth } from "./GoogleSheetsClient";
import { env } from "../config/env";

/**
 * Handles Google Drive backups per spec section 26:
 *   FinancerApp/Backups/backup_YYYY-MM-DD.json
 */
function getDrive() {
  return google.drive({ version: "v3", auth: getDriveAuth() as any });
}

async function findOrCreateFolder(name: string, parentId?: string): Promise<string> {
  const drive = getDrive();
  const q = [
    `name='${name.replace(/'/g, "\\'")}'`,
    "mimeType='application/vnd.google-apps.folder'",
    "trashed=false",
    parentId ? `'${parentId}' in parents` : undefined,
  ]
    .filter(Boolean)
    .join(" and ");

  const res = await drive.files.list({ q, fields: "files(id, name)" });
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });
  return created.data.id!;
}

async function getBackupsFolderId(): Promise<string> {
  const appFolder = await findOrCreateFolder(env.DRIVE_APP_FOLDER_NAME || "FinancerApp");
  return findOrCreateFolder("Backups", appFolder);
}

export async function backupNow(payload: object): Promise<{ fileId: string; fileName: string }> {
  const drive = getDrive();
  const folderId = await getBackupsFolderId();
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `backup_${dateStr}.json`;
  const jsonString = JSON.stringify(payload, null, 2);

  const media = { mimeType: "application/json", body: Readable.from([jsonString]) };
  const file = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media,
    fields: "id, name",
  });
  return { fileId: file.data.id!, fileName: file.data.name! };
}

export async function listBackups(): Promise<{ id: string; name: string; createdTime?: string | null }[]> {
  const drive = getDrive();
  const folderId = await getBackupsFolderId();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime desc",
  });
  return (res.data.files ?? []) as any;
}

export async function restoreBackup(fileId: string): Promise<any> {
  const drive = getDrive();
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "json" });
  return res.data;
}
