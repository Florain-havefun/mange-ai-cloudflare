import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  lookupHash: text("lookup_hash").notNull(),
  planId: text("plan_id").notNull(),
  planName: text("plan_name").notNull(),
  unitPriceCents: integer("unit_price_cents"),
  quantity: integer("quantity").notNull(),
  accountEmail: text("account_email").notNull(),
  contactType: text("contact_type").notNull(),
  contactValue: text("contact_value").notNull(),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("pending_confirmation"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("orders_created_at_idx").on(table.createdAt)]);
