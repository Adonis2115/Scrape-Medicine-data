DO $$ BEGIN
 CREATE TYPE "type" AS ENUM('tablet', 'capsule', 'syrup');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "combination_generic" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"manufacturer" text,
	"constituent_drugs" text[],
	"price" numeric,
	"type" "type",
	"price_url" text,
	"drug_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drug" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"single_generic_url" text,
	"combination_generic_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "single_generic" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"manufacturer" text,
	"price" numeric,
	"type" "type",
	"price_url" text,
	"drug_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "combination_generic" ADD CONSTRAINT "combination_generic_drug_id_drug_id_fk" FOREIGN KEY ("drug_id") REFERENCES "drug"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "single_generic" ADD CONSTRAINT "single_generic_drug_id_drug_id_fk" FOREIGN KEY ("drug_id") REFERENCES "drug"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
