import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export const watchedRepos = pgTable("watched_repo", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  repoFullName: text("repoFullName").notNull(),
  slackWebhookUrl: text("slackWebhookUrl"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  lastScanAt: timestamp("lastScanAt", { mode: "date" }),
  lastHigh: integer("lastHigh").notNull().default(0),
  lastMedium: integer("lastMedium").notNull().default(0),
  lastFindingIds: jsonb("lastFindingIds").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
});

export const appStats = pgTable("app_stats", {
  id: text("id").primaryKey().default("singleton"),
  totalScans: integer("totalScans").notNull().default(0),
});
