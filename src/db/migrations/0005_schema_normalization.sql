-- Migration: Schema normalization (vendors table, date columns, drop denormalized fields, notification FKs)
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendors" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo" varchar(2048),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "vendors" ("id", "name", "logo", "created_at")
SELECT DISTINCT "vendor_id", "vendor_name", "vendor_logo", NOW()
FROM "certifications"
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "certifications" DROP COLUMN IF EXISTS "vendor_name";
--> statement-breakpoint
ALTER TABLE "certifications" DROP COLUMN IF EXISTS "vendor_logo";
--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certifications_vendor_id_idx" ON "certifications" USING btree ("vendor_id");
--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "issue_date" TYPE date USING ("issue_date"::date);
--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "expiration_date" TYPE date USING ("expiration_date"::date);
--> statement-breakpoint
ALTER TABLE "user_certifications" DROP COLUMN IF EXISTS "days_until_expiration";
--> statement-breakpoint
ALTER TABLE "user_certifications" DROP COLUMN IF EXISTS "certification_name";
--> statement-breakpoint
ALTER TABLE "user_certifications" DROP COLUMN IF EXISTS "vendor_name";
--> statement-breakpoint
UPDATE "notifications" n SET "certification_id" = NULL WHERE n."certification_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "certifications" c WHERE c."id" = n."certification_id");
--> statement-breakpoint
UPDATE "notifications" n SET "user_certification_id" = NULL WHERE n."user_certification_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "user_certifications" uc WHERE uc."id" = n."user_certification_id");
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_certification_id_user_certifications_id_fk" FOREIGN KEY ("user_certification_id") REFERENCES "public"."user_certifications"("id") ON DELETE no action ON UPDATE no action;
