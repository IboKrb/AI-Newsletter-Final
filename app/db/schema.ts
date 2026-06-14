import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  bigint,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const tierEnum = pgEnum("tier", ["free", "premium"]);
export const issueTierEnum = pgEnum("issue_tier", ["free", "premium", "both"]);
export const categoryEnum = pgEnum("category", [
  "news",
  "tools",
  "prompts",
  "tutorials",
  "podcasts",
  "videos",
  "reads",
  "image_gen",
]);
export const difficultyEnum = pgEnum("difficulty", ["beginner", "intermediate", "advanced"]);
export const sourceTypeEnum = pgEnum("source_type", ["rss", "api", "website"]);
export const statusEnum = pgEnum("article_status", [
  "draft",
  "review",
  "approved",
  "published",
  "archived",
]);
export const jobTypeEnum = pgEnum("job_type", [
  "weekly_issue",
  "fetch_sources",
  "process_content",
  "send_newsletter",
  "cleanup",
]);
export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export const triggeredByEnum = pgEnum("triggered_by", ["cron", "manual", "api"]);

// ── Users ────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  role: roleEnum("role").default("user").notNull(),
  tier: tierEnum("tier").default("free").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Newsletter Issues ────────────────────────────────────────────
export const newsletterIssues = pgTable("newsletter_issues", {
  id: serial("id").primaryKey(),
  issueNumber: integer("issue_number").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  publishDate: timestamp("publish_date", { withTimezone: true }).defaultNow().notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  tier: issueTierEnum("tier").default("both").notNull(),
  summary: text("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export type NewsletterIssue = typeof newsletterIssues.$inferSelect;
export type InsertNewsletterIssue = typeof newsletterIssues.$inferInsert;

// ── News Items (Legacy) ──────────────────────────────────────────
export const newsItems = pgTable("news_items", {
  id: serial("id").primaryKey(),
  issueId: bigint("issue_id", { mode: "number" }).notNull(),
  headline: varchar("headline", { length: 500 }).notNull(),
  summary: text("summary").notNull(),
  sourceName: varchar("source_name", { length: 100 }).notNull(),
  sourceUrl: text("source_url").notNull(),
  category: categoryEnum("category").default("news").notNull(),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type NewsItem = typeof newsItems.$inferSelect;
export type InsertNewsItem = typeof newsItems.$inferInsert;

// ── Tool Recommendations (Legacy) ────────────────────────────────
export const toolRecommendations = pgTable("tool_recommendations", {
  id: serial("id").primaryKey(),
  issueId: bigint("issue_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  voteCount: integer("vote_count").default(0),
  isNew: boolean("is_new").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ToolRecommendation = typeof toolRecommendations.$inferSelect;
export type InsertToolRecommendation = typeof toolRecommendations.$inferInsert;

// ── Prompt Recommendations (Legacy) ──────────────────────────────
export const promptRecommendations = pgTable("prompt_recommendations", {
  id: serial("id").primaryKey(),
  issueId: bigint("issue_id", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(),
  description: text("description").notNull(),
  useCase: varchar("use_case", { length: 100 }).notNull(),
  model: varchar("model", { length: 50 }).default("Claude / ChatGPT").notNull(),
  exampleOutput: text("example_output"),
  tags: text("tags"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PromptRecommendation = typeof promptRecommendations.$inferSelect;
export type InsertPromptRecommendation = typeof promptRecommendations.$inferInsert;

// ── Tutorials (Legacy) ───────────────────────────────────────────
export const tutorials = pgTable("tutorials", {
  id: serial("id").primaryKey(),
  issueId: bigint("issue_id", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  tool: varchar("tool", { length: 100 }).notNull(),
  difficulty: difficultyEnum("difficulty").default("intermediate").notNull(),
  content: text("content").notNull(),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  estimatedTime: varchar("estimated_time", { length: 50 }).default("10 min").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Tutorial = typeof tutorials.$inferSelect;
export type InsertTutorial = typeof tutorials.$inferInsert;

// ── Podcasts (Legacy) ────────────────────────────────────────────
export const podcasts = pgTable("podcasts", {
  id: serial("id").primaryKey(),
  issueId: bigint("issue_id", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  host: varchar("host", { length: 255 }).notNull(),
  description: text("description").notNull(),
  episodeTitle: varchar("episode_title", { length: 255 }),
  duration: varchar("duration", { length: 50 }),
  spotifyUrl: text("spotify_url"),
  appleUrl: text("apple_url"),
  youtubeUrl: text("youtube_url"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Podcast = typeof podcasts.$inferSelect;
export type InsertPodcast = typeof podcasts.$inferInsert;

// ── Videos (Legacy) ──────────────────────────────────────────────
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  issueId: bigint("issue_id", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  creator: varchar("creator", { length: 255 }).notNull(),
  description: text("description").notNull(),
  youtubeUrl: text("youtube_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: varchar("duration", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

// ── Reads (Legacy) ───────────────────────────────────────────────
export const reads = pgTable("reads", {
  id: serial("id").primaryKey(),
  issueId: bigint("issue_id", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  readTime: varchar("read_time", { length: 50 }).default("5 min").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Read = typeof reads.$inferSelect;
export type InsertRead = typeof reads.$inferInsert;

// ── Image Generation Prompt Training (Legacy) ─────────────────────
export const imageGenTrainings = pgTable("image_gen_trainings", {
  id: serial("id").primaryKey(),
  issueId: bigint("issue_id", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  tool: varchar("tool", { length: 50 }).default("Midjourney").notNull(),
  prompt: text("prompt").notNull(),
  technique: varchar("technique", { length: 100 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  tips: text("tips"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ImageGenTraining = typeof imageGenTrainings.$inferSelect;
export type InsertImageGenTraining = typeof imageGenTrainings.$inferInsert;

// ── Subscribers ──────────────────────────────────────────────────
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  tier: tierEnum("tier").default("free").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  preferences: text("preferences"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

// ═══════════════════════════════════════════════════════════════
// NEUE TABELLEN (für KI-gestützte Content-Erzeugung)
// ═══════════════════════════════════════════════════════════════

// ── Sources ──────────────────────────────────────────────────────
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  type: sourceTypeEnum("type").default("website").notNull(),
  category: categoryEnum("category").default("news").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  // Standard-Quellen werden bei jedem Durchlauf verwendet (max ~5/Kategorie).
  // Nicht-Standard-Quellen bilden den Rotations-Pool (LRU über lastUsedAt).
  isStandard: boolean("is_standard").default(false).notNull(),
  priority: integer("priority").default(0).notNull(),
  notes: text("notes"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Source = typeof sources.$inferSelect;
export type InsertSource = typeof sources.$inferInsert;

// ── Articles ─────────────────────────────────────────────────────
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  issueId: bigint("issue_id", { mode: "number" }),
  sourceId: bigint("source_id", { mode: "number" }).notNull(),

  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary").notNull(),

  category: categoryEnum("category").notNull(),
  tags: text("tags"),

  sourceName: varchar("source_name", { length: 100 }).notNull(),
  sourceUrl: text("source_url").notNull(),

  publishedAt: timestamp("published_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),

  contentHash: varchar("content_hash", { length: 64 }).notNull().unique(),
  status: statusEnum("status").default("draft").notNull(),

  relevanceScore: integer("relevance_score").default(0).notNull(),

  aiModel: varchar("ai_model", { length: 50 }),
  aiProcessedAt: timestamp("ai_processed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

// ── Jobs ─────────────────────────────────────────────────────────
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  type: jobTypeEnum("type").notNull(),
  status: jobStatusEnum("status").default("pending").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  resultSummary: text("result_summary"),
  triggeredBy: triggeredByEnum("triggered_by").default("cron").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// ── Settings (Key-Value, z.B. Gemini-Token aus der UI) ───────────
export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

// ═══════════════════════════════════════════════════════════════
// WORKFLOW SYSTEM (Editierbare Templates + wiederholungsbasierte Läufe)
// ═══════════════════════════════════════════════════════════════

export const workflowRunStatusEnum = pgEnum("workflow_run_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "partial",
  "cancelled",
]);

export const runSourceKindEnum = pgEnum("run_source_kind", [
  "standard",
  "rotating",
  "discovered",
  "manual",
]);

export const runLogLevelEnum = pgEnum("run_log_level", [
  "info",
  "progress",
  "success",
  "error",
]);

// ── Workflow Templates (die "gebauten" Workflows, editierbar) ─────
export const workflowTemplates = pgTable("workflow_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: categoryEnum("category").default("news").notNull(),
  description: text("description"),
  // Editierbare Prompts
  systemPrompt: text("system_prompt").notNull(),
  userPrompt: text("user_prompt").notNull(),
  // Konfiguration
  repetitions: integer("repetitions").default(3).notNull(),
  maxArticles: integer("max_articles").default(10).notNull(),
  useGrounding: boolean("use_grounding").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = typeof workflowTemplates.$inferInsert;

// ── Workflow Runs (Durchläufe / Verlauf) ─────────────────────────
export const workflowRuns = pgTable("workflow_runs", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => workflowTemplates.id),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  category: categoryEnum("category").default("news").notNull(),
  status: workflowRunStatusEnum("status").default("pending").notNull(),
  repetitionsTotal: integer("repetitions_total").default(1).notNull(),
  repetitionsDone: integer("repetitions_done").default(0).notNull(),
  progressPercent: integer("progress_percent").default(0).notNull(),
  articlesFound: integer("articles_found").default(0).notNull(),
  articlesSaved: integer("articles_saved").default(0).notNull(),
  duplicatesSkipped: integer("duplicates_skipped").default(0).notNull(),
  triggeredBy: triggeredByEnum("triggered_by").default("manual").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type WorkflowRun = typeof workflowRuns.$inferSelect;
export type InsertWorkflowRun = typeof workflowRuns.$inferInsert;

// ── Workflow Run Sources (welche Quellen pro Lauf genutzt wurden) ─
export const workflowRunSources = pgTable("workflow_run_sources", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull().references(() => workflowRuns.id),
  name: varchar("name", { length: 500 }).notNull(),
  url: text("url"),
  kind: runSourceKindEnum("kind").default("standard").notNull(),
  repetition: integer("repetition"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type WorkflowRunSource = typeof workflowRunSources.$inferSelect;
export type InsertWorkflowRunSource = typeof workflowRunSources.$inferInsert;

// ── Workflow Run Logs (Live-Monitoring + Verlauf) ────────────────
export const workflowRunLogs = pgTable("workflow_run_logs", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull().references(() => workflowRuns.id),
  repetition: integer("repetition"),
  level: runLogLevelEnum("level").default("info").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type WorkflowRunLog = typeof workflowRunLogs.$inferSelect;
export type InsertWorkflowRunLog = typeof workflowRunLogs.$inferInsert;
