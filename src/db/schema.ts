import {serial, text, timestamp, pgTable, numeric, pgEnum, integer} from "drizzle-orm/pg-core"

export const Drug_Type = pgEnum('type', ['tablet', 'capsule', 'syrup']);

export const drug = pgTable("drug",{
  id: serial("id").primaryKey(),
  name: text("name"),
  single_generic_url: text("single_generic_url"),
  combination_generic_url: text("combination_generic_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const single_generic = pgTable("single_generic",{
  id: serial("id").primaryKey(),
  name: text("name"),
  manufacturer: text("manufacturer"),
  price: numeric("price"),
  type: Drug_Type("type"),
  price_url: text("price_url"),
  drug_id: integer('drug_id').references(() => drug.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const combination_generic = pgTable("combination_generic",{
  id: serial("id").primaryKey(),
  name: text("name"),
  manufacturer: text("manufacturer"),
  constituent_drugs: text("constituent_drugs").array(),
  price: numeric("price"),
  type: Drug_Type("type"),
  price_url: text("price_url"),
  drug_id: integer('drug_id').references(() => drug.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})