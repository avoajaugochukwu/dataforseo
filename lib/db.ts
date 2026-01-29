import { JSONFilePreset } from 'lowdb/node';
import { Low } from 'lowdb';
import path from 'path';
import fs from 'fs';
import type { DbSchema } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const defaultData: DbSchema = {
  blogConfigs: [],
  keywords: [],
  topics: [],
  drafts: [],
};

let dbInstance: Low<DbSchema> | null = null;

export async function getDb(): Promise<Low<DbSchema>> {
  if (dbInstance) {
    await dbInstance.read();
    return dbInstance;
  }

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = await JSONFilePreset<DbSchema>(DB_PATH, defaultData);
  return dbInstance;
}
