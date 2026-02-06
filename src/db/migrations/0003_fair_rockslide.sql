CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_type_id_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_is_dismissed_idx" ON "notifications" USING btree ("user_id","is_dismissed");--> statement-breakpoint
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "teams_manager_id_idx" ON "teams" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "user_certifications_expiration_date_idx" ON "user_certifications" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "user_certifications_user_id_status_idx" ON "user_certifications" USING btree ("user_id","status");