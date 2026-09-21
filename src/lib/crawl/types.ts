// Shared types for the Khagna grocery crawler (Tempe AZ focus).

export type RetailerId = "walmart" | "samsclub" | "costco" | "frys" | "target";

export type CrawledOffer = {
  retailer: RetailerId;
  /** Retailer product page URL (also stored in prices.note for provenance). */
  url: string;
  title: string;
  brand: string;
  /** Display price, e.g. 4.98 */
  price: number;
  /** Normalized unit for our prices table: kg | g | lb | oz | piece */
  unit: "kg" | "g" | "lb" | "oz" | "piece";
  /** Human pack size, e.g. "5 lb bag", "12 ct". */
  sizeText: string;
  /** Direct product image URL from the retailer (hotlinked, never re-uploaded). */
  imageUrl: string;
  inStock: boolean;
  /** Where the data came from: json-ld | embedded-json | dom | llm */
  via: string;
};

export type CrawlAttempt = {
  retailer: RetailerId;
  query: string;
  status: "ok" | "blocked" | "error" | "empty";
  offers: Omit<CrawledOffer, "retailer">[];
  error?: string;
  sampleUrl?: string;
  /** Why we believe this is a bot-wall, when status === 'blocked'. */
  blockReason?: string;
};

export type PipelineSummary = {
  retailers: RetailerId[];
  queries: string[];
  attempts: CrawlAttempt[];
  storesUpserted: number;
  itemsUpserted: number;
  pricesUpserted: number;
  dryRun: boolean;
};

export type TempeStoreSeed = {
  key: string;
  retailer: RetailerId | "other";
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
};

export type CatalogEntry = {
  key: string;
  query: string;
  name_en: string;
  name_bn: string;
  name_alt: string;
  category: string;
  base_unit: "kg" | "piece";
};
