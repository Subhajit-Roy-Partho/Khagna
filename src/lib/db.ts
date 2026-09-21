import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

export function getDb(): Client {
  if (_client) return _client;
  const url =
    process.env.tursoURL ||
    process.env.TURSO_DATABASE_URL ||
    process.env.TURSO_URL ||
    "";
  const authToken =
    process.env.tursoAPIkey ||
    process.env.TURSO_AUTH_TOKEN ||
    process.env.TURSO_API_KEY ||
    "";
  if (!url) throw new Error("Missing Turso URL (tursoURL in .env)");
  _client = createClient({ url, authToken });
  return _client;
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  address TEXT DEFAULT '',
  lat REAL NOT NULL DEFAULT 0,
  lng REAL NOT NULL DEFAULT 0,
  phone TEXT DEFAULT '',
  is_online INTEGER DEFAULT 0,
  image_url TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_en TEXT NOT NULL,
  name_bn TEXT DEFAULT '',
  name_alt TEXT DEFAULT '',
  category TEXT DEFAULT 'grocery',
  image_url TEXT DEFAULT '',
  base_unit TEXT DEFAULT 'kg'
);
CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES items(id),
  store_id INTEGER NOT NULL REFERENCES stores(id),
  price REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  quality INTEGER DEFAULT 3,
  stock_level TEXT DEFAULT 'in_stock',
  is_online INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual',
  updated_at TEXT DEFAULT (datetime('now')),
  note TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bank TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  annual_fee REAL DEFAULT 0,
  rating REAL DEFAULT 0,
  apply_url TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS card_benefits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  category TEXT NOT NULL,
  merchant_place TEXT DEFAULT '',
  reward_rate REAL DEFAULT 0,
  reward_type TEXT DEFAULT 'cashback',
  cap TEXT DEFAULT '',
  description TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  price_id INTEGER,
  item_id INTEGER,
  store_id INTEGER,
  old_price REAL,
  new_price REAL NOT NULL,
  comment TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER,
  item_id INTEGER,
  text TEXT NOT NULL,
  tag TEXT DEFAULT 'info',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_prices_item ON prices(item_id);
CREATE INDEX IF NOT EXISTS idx_prices_store ON prices(store_id);
CREATE INDEX IF NOT EXISTS idx_benefits_card ON card_benefits(card_id);
CREATE INDEX IF NOT EXISTS idx_benefits_cat ON card_benefits(category);
`;

export async function initDb() {
  const db = getDb();
  const statements = SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const sql of statements) {
    await db.execute(sql);
  }
  return true;
}

// ---------- Types ----------
export type Store = {
  id: number;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  is_online: number;
  image_url: string;
};

export type Item = {
  id: number;
  name_en: string;
  name_bn: string;
  name_alt: string;
  category: string;
  image_url: string;
  base_unit: string;
};

export type PriceRow = {
  id: number;
  item_id: number;
  store_id: number;
  price: number;
  unit: string;
  quality: number;
  stock_level: string;
  is_online: number;
  source: string;
  updated_at: string;
  note: string;
  store_name?: string;
  store_city?: string;
  store_lat?: number;
  store_lng?: number;
  item_name_en?: string;
};

export type Card = {
  id: number;
  name: string;
  bank: string;
  image_url: string;
  annual_fee: number;
  rating: number;
  apply_url: string;
};

export type CardBenefit = {
  id: number;
  card_id: number;
  category: string;
  merchant_place: string;
  reward_rate: number;
  reward_type: string;
  cap: string;
  description: string;
  card_name?: string;
  bank?: string;
};
