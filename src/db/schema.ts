import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// export const Drug_Type = pgEnum("type", [
//   "tablet",
//   "capsule",
//   "syrup",
//   "injection",
// ]);

export const drug = pgTable("drug", {
  id: serial("id").primaryKey(),
  name: text("name"),
  single_generic_url: text("single_generic_url"),
  combination_generic_url: text("combination_generic_url"),
  processed_single: boolean("processed_single").default(false),
  processed_combination: boolean("processed_combination").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const single_generic = pgTable("single_generic", {
  id: serial("id").primaryKey(),
  name: text("name"),
  manufacturer: text("manufacturer"),
  price: numeric("price"),
  type: text("type"),
  price_url: text("price_url"),
  drug_id: integer("drug_id").references(() => drug.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const combination_generic = pgTable("combination_generic", {
  id: serial("id").primaryKey(),
  name: text("name"),
  manufacturer: text("manufacturer"),
  constituent_drugs: text("constituent_drugs").array(),
  price: numeric("price"),
  type: text("type"),
  price_url: text("price_url"),
  drug_id: integer("drug_id").references(() => drug.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
