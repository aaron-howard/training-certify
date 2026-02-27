-- Add official_site_url to certifications for "Official Site" link in catalog detail modal
--> statement-breakpoint
ALTER TABLE "certifications" ADD COLUMN IF NOT EXISTS "official_site_url" varchar(2048);
