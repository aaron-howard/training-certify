CREATE TABLE "rate_limit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."certification_category";--> statement-breakpoint
CREATE TYPE "public"."certification_category" AS ENUM('AI', 'AppDynamics', 'Business Applications', 'Channel/Partner', 'Cloud', 'Collaboration', 'Cybersecurity', 'Data', 'Data Center', 'Design', 'DevNet', 'DevOps', 'Dynamics 365', 'Enterprise', 'Field Technician', 'IT', 'Meraki', 'Modern Workplace', 'Networking', 'Power Platform', 'Project Management', 'Security', 'Service Provider', 'Support Technician');--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "category" SET DATA TYPE "public"."certification_category" USING "category"::"public"."certification_category";--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "difficulty" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."certification_difficulty";--> statement-breakpoint
CREATE TYPE "public"."certification_difficulty" AS ENUM('Advanced', 'Associate', 'Beginner', 'Cybersecurity', 'Expert', 'Financial App', 'Information Technology', 'Intermediate', 'IT Finance', 'Networking', 'Professional', 'Project Management', 'ServiceNow', 'ServiceNow*', 'Software and Quality', 'Virtualization');--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "difficulty" SET DATA TYPE "public"."certification_difficulty" USING "difficulty"::"public"."certification_difficulty";--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "resource_type" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "resource_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "vendor_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "vendor_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "vendor_logo" SET DATA TYPE varchar(2048);--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "validity_period" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "price" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE "public"."notification_type" USING "type"::"public"."notification_type";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "severity" SET DEFAULT 'info'::"public"."notification_severity";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "severity" SET DATA TYPE "public"."notification_severity" USING "severity"::"public"."notification_severity";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "certification_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "team_requirements" ALTER COLUMN "certification_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "manager_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "user_certification_proofs" ALTER COLUMN "file_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "user_certification_proofs" ALTER COLUMN "file_url" SET DATA TYPE varchar(2048);--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "certification_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "certification_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "vendor_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "certification_number" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "issue_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "expiration_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."certification_status";--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "status" SET DATA TYPE "public"."certification_status" USING "status"::"public"."certification_status";--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "document_url" SET DATA TYPE varchar(2048);--> statement-breakpoint
ALTER TABLE "user_certifications" ALTER COLUMN "assigned_by_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "user_teams" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'User'::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "avatar_url" SET DATA TYPE varchar(2048);--> statement-breakpoint
CREATE INDEX "rate_limit_logs_identifier_idx" ON "rate_limit_logs" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "rate_limit_logs_timestamp_idx" ON "rate_limit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "rate_limit_logs_identifier_timestamp_idx" ON "rate_limit_logs" USING btree ("identifier","timestamp");--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "renewal_cycle_positive" CHECK ("certifications"."renewal_cycle" IS NULL OR "certifications"."renewal_cycle" > 0);--> statement-breakpoint
ALTER TABLE "team_requirements" ADD CONSTRAINT "target_count_positive" CHECK ("team_requirements"."target_count" > 0);