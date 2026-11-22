CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`lookup_hash` text NOT NULL,
	`plan_id` text NOT NULL,
	`plan_name` text NOT NULL,
	`unit_price_cents` integer,
	`quantity` integer NOT NULL,
	`account_email` text NOT NULL,
	`contact_type` text NOT NULL,
	`contact_value` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending_confirmation' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_id_unique` ON `orders` (`request_id`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);