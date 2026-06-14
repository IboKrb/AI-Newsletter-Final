import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  newsletterIssues,
  newsItems,
  toolRecommendations,
  promptRecommendations,
  tutorials,
  podcasts,
  videos,
  reads,
  imageGenTrainings,
  subscribers,
  articles,
  sources,
  jobs,
} from "@db/schema";
import { eq, desc, and, or, like, sql, inArray } from "drizzle-orm";
import { hashContent } from "./services/dedupe";
import { enrichTags } from "./services/tagger";

export const newsletterRouter = createRouter({
  // Get latest published issue
  getLatest: publicQuery.query(async () => {
    const db = getDb();
    const issue = await db
      .select()
      .from(newsletterIssues)
      .where(and(
        eq(newsletterIssues.isPublished, true),
      ))
      .orderBy(desc(newsletterIssues.issueNumber))
      .limit(1);

    if (!issue.length) return null;
    return issue[0];
  }),

  // Get issue by slug
  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const issue = await db
        .select()
        .from(newsletterIssues)
        .where(eq(newsletterIssues.slug, input.slug))
        .limit(1);

      if (!issue.length) return null;
      return issue[0];
    }),

  // List all published issues
  listIssues: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(newsletterIssues)
      .where(eq(newsletterIssues.isPublished, true))
      .orderBy(desc(newsletterIssues.issueNumber));
  }),

  // Get full issue content (news, tools, prompts, etc.)
  getIssueContent: publicQuery
    .input(z.object({ issueId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [news, tools, prompts, tutorialList, podcastList, videoList, readList, imageGens] = await Promise.all([
        db.select().from(newsItems).where(eq(newsItems.issueId, input.issueId)).orderBy(desc(newsItems.id)),
        db.select().from(toolRecommendations).where(eq(toolRecommendations.issueId, input.issueId)).orderBy(desc(toolRecommendations.id)),
        db.select().from(promptRecommendations).where(eq(promptRecommendations.issueId, input.issueId)).orderBy(desc(promptRecommendations.id)),
        db.select().from(tutorials).where(eq(tutorials.issueId, input.issueId)).orderBy(desc(tutorials.id)),
        db.select().from(podcasts).where(eq(podcasts.issueId, input.issueId)).orderBy(desc(podcasts.id)),
        db.select().from(videos).where(eq(videos.issueId, input.issueId)).orderBy(desc(videos.id)),
        db.select().from(reads).where(eq(reads.issueId, input.issueId)).orderBy(desc(reads.id)),
        db.select().from(imageGenTrainings).where(eq(imageGenTrainings.issueId, input.issueId)).orderBy(desc(imageGenTrainings.id)),
      ]);

      return {
        news,
        tools,
        prompts,
        tutorials: tutorialList,
        podcasts: podcastList,
        videos: videoList,
        reads: readList,
        imageGens,
      };
    }),

  // Admin: Create issue
  createIssue: adminQuery
    .input(z.object({
      issueNumber: z.number(),
      title: z.string(),
      slug: z.string(),
      summary: z.string().optional(),
      tier: z.enum(["free", "premium", "both"]).default("both"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(newsletterIssues).values({
        ...input,
        isPublished: false,
      });
      return result;
    }),

  // Admin: Publish issue
  publishIssue: adminQuery
    .input(z.object({ issueId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db
        .update(newsletterIssues)
        .set({ isPublished: true })
        .where(eq(newsletterIssues.id, input.issueId));
    }),

  // Subscribe to newsletter
  subscribe: publicQuery
    .input(z.object({
      email: z.string().email(),
      name: z.string().optional(),
      tier: z.enum(["free", "premium"]).default("free"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      try {
        await db.insert(subscribers).values({
          ...input,
          isActive: true,
          preferences: JSON.stringify({
            latestNews: true,
            toolRecs: true,
            tutorials: true,
            prompts: true,
          }),
        });
        return { success: true };
      } catch {
        return { success: false, error: "Already subscribed or invalid email" };
      }
    }),

  // Admin: Add news item
  addNews: adminQuery
    .input(z.object({
      issueId: z.number(),
      headline: z.string(),
      summary: z.string(),
      sourceName: z.string(),
      sourceUrl: z.string(),
      category: z.enum(["news", "tools", "prompts", "tutorials", "podcasts", "videos", "reads", "image_gen"]).default("news"),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(newsItems).values(input);
    }),

  // Admin: Add tool recommendation
  addTool: adminQuery
    .input(z.object({
      issueId: z.number(),
      name: z.string(),
      description: z.string(),
      category: z.string(),
      url: z.string(),
      imageUrl: z.string().optional(),
      voteCount: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(toolRecommendations).values(input);
    }),

  // Admin: Add prompt recommendation
  addPrompt: adminQuery
    .input(z.object({
      issueId: z.number(),
      title: z.string(),
      prompt: z.string(),
      description: z.string(),
      useCase: z.string(),
      model: z.string().optional(),
      exampleOutput: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(promptRecommendations).values(input);
    }),

  // Admin: Add tutorial
  addTutorial: adminQuery
    .input(z.object({
      issueId: z.number(),
      title: z.string(),
      description: z.string(),
      tool: z.string(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      content: z.string(),
      videoUrl: z.string().optional(),
      imageUrl: z.string().optional(),
      estimatedTime: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(tutorials).values(input);
    }),

  // Admin: Add podcast
  addPodcast: adminQuery
    .input(z.object({
      issueId: z.number(),
      title: z.string(),
      host: z.string(),
      description: z.string(),
      episodeTitle: z.string().optional(),
      duration: z.string().optional(),
      spotifyUrl: z.string().optional(),
      appleUrl: z.string().optional(),
      youtubeUrl: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(podcasts).values(input);
    }),

  // Admin: Add video
  addVideo: adminQuery
    .input(z.object({
      issueId: z.number(),
      title: z.string(),
      creator: z.string(),
      description: z.string(),
      youtubeUrl: z.string(),
      thumbnailUrl: z.string().optional(),
      duration: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(videos).values(input);
    }),

  // Admin: Add read
  addRead: adminQuery
    .input(z.object({
      issueId: z.number(),
      title: z.string(),
      author: z.string(),
      description: z.string(),
      url: z.string(),
      source: z.string(),
      readTime: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(reads).values(input);
    }),

  // Admin: Add image gen training
  addImageGen: adminQuery
    .input(z.object({
      issueId: z.number(),
      title: z.string(),
      tool: z.string().optional(),
      prompt: z.string(),
      technique: z.string(),
      description: z.string(),
      imageUrl: z.string().optional(),
      tips: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(imageGenTrainings).values(input);
    }),

  // ═══════════════════════════════════════════════════════════════
  // NEUE ROUTEN (KI-gestützte Content-Erzeugung + Artikel-Mgmt)
  // ═══════════════════════════════════════════════════════════════

  // Admin: Artikel manuell anlegen
  createArticle: adminQuery
    .input(z.object({
      title: z.string().min(3),
      summary: z.string().min(1),
      content: z.string().min(1),
      category: z.enum(["news", "tools", "prompts", "tutorials", "podcasts", "videos", "reads", "image_gen"]),
      sourceName: z.string().min(1),
      sourceUrl: z.string().url(),
      tags: z.array(z.string()).optional(),
      status: z.enum(["draft", "review", "approved", "published", "archived"]).default("draft"),
      relevanceScore: z.number().min(0).max(100).default(50),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const hash = hashContent(input.sourceUrl, input.title);
      const tags = enrichTags(input.title, input.content, input.tags ?? []);

      // Quelle finden oder anlegen
      let sourceId: number;
      const existing = await db.select().from(sources).where(eq(sources.url, input.sourceUrl)).limit(1);
      if (existing.length > 0) {
        sourceId = existing[0].id;
      } else {
        const [src] = await db.insert(sources).values({
          name: input.sourceName,
          url: input.sourceUrl,
          type: "website",
          category: input.category,
        }).returning();
        sourceId = src.id;
      }

      const [article] = await db.insert(articles).values({
        sourceId,
        title: input.title,
        content: input.content,
        summary: input.summary,
        category: input.category,
        tags: JSON.stringify(tags),
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        publishedAt: new Date(),
        contentHash: hash,
        status: input.status,
        relevanceScore: input.relevanceScore,
      }).returning();
      return article;
    }),

  // Admin: Sichtbarkeit umschalten (published = öffentlich, draft = privat)
  setArticleVisibility: adminQuery
    .input(z.object({ id: z.number(), isPublic: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db
        .update(articles)
        .set({ status: input.isPublic ? "published" : "draft" })
        .where(eq(articles.id, input.id));
    }),

  // Admin: Mehrere Artikel löschen
  bulkDeleteArticles: adminQuery
    .input(z.object({ ids: z.array(z.number()).min(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(articles).where(inArray(articles.id, input.ids));
      return { success: true, deleted: input.ids.length };
    }),

  // Admin: Sichtbarkeit für mehrere Artikel umschalten
  bulkSetVisibility: adminQuery
    .input(z.object({ ids: z.array(z.number()).min(1), isPublic: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(articles)
        .set({ status: input.isPublic ? "published" : "draft" })
        .where(inArray(articles.id, input.ids));
      return { success: true, updated: input.ids.length };
    }),

  // Admin: Alle Artikel listen (mit Pagination + Suche)
  listArticles: adminQuery
    .input(z.object({
      status: z.enum(["draft", "review", "approved", "published", "archived"]).optional(),
      category: z.enum(["news", "tools", "prompts", "tutorials", "podcasts", "videos", "reads", "image_gen"]).optional(),
      search: z.string().optional(), // 🔍 Suche nach Titel
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const opts = input ?? ({} as NonNullable<typeof input>);
      const conditions = [];

      if (opts.status) conditions.push(eq(articles.status, opts.status));
      if (opts.category) conditions.push(eq(articles.category, opts.category));
      if (opts.search) {
        conditions.push(like(articles.title, `%${opts.search}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select()
        .from(articles)
        .where(whereClause)
        .orderBy(desc(articles.createdAt))
        .limit(opts.limit)
        .offset(opts.offset);

      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(articles)
        .where(whereClause);

      return { articles: rows, total: Number(countResult[0]?.count ?? 0) };
    }),

  // Admin: Artikel aktualisieren (Status, Issue-Zuordnung, etc.)
  updateArticle: adminQuery
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      summary: z.string().optional(),
      category: z.enum(["news", "tools", "prompts", "tutorials", "podcasts", "videos", "reads", "image_gen"]).optional(),
      tags: z.string().optional(),
      status: z.enum(["draft", "review", "approved", "published", "archived"]).optional(),
      issueId: z.number().nullable().optional(),
      relevanceScore: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      return db
        .update(articles)
        .set(data)
        .where(eq(articles.id, id));
    }),

  // Admin: Artikel löschen
  deleteArticle: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.delete(articles).where(eq(articles.id, input.id));
    }),

  // Admin: Mehrere Artikel zu Issue zuordnen
  assignArticlesToIssue: adminQuery
    .input(z.object({
      articleIds: z.array(z.number()),
      issueId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const articleId of input.articleIds) {
        await db
          .update(articles)
          .set({ issueId: input.issueId, status: "published" })
          .where(eq(articles.id, articleId));
      }
      return { success: true, assigned: input.articleIds.length };
    }),

  // Admin: Alle Jobs listen
  listJobs: adminQuery
    .input(z.object({
      limit: z.number().default(50),
      status: z.enum(["pending", "running", "completed", "failed", "cancelled"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const opts = input ?? ({} as NonNullable<typeof input>);
      const whereClause = opts.status ? eq(jobs.status, opts.status) : undefined;

      return db
        .select()
        .from(jobs)
        .where(whereClause)
        .orderBy(desc(jobs.createdAt))
        .limit(opts.limit);
    }),

  // Admin: Job-Details
  getJob: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  // ═══════════════════════════════════════════════════════════════
  // ÖFFENTLICHE ROUTEN (Library / Suche)
  // ═══════════════════════════════════════════════════════════════

  // Öffentlich: Artikel suchen (Volltextsuche + Filter)
  searchArticles: publicQuery
    .input(z.object({
      query: z.string().min(1),
      category: z.enum(["news", "tools", "prompts", "tutorials", "podcasts", "videos", "reads", "image_gen"]).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [
        eq(articles.status, "published"),
      ];

      // Volltextsuche über title + summary + content
      if (input.query) {
        const q = `%${input.query}%`;
        conditions.push(
          or(
            like(articles.title, q),
            like(articles.summary, q),
            like(articles.content, q)
          )!
        );
      }

      if (input.category) conditions.push(eq(articles.category, input.category));
      if (input.dateFrom) conditions.push(sql`${articles.publishedAt} >= ${new Date(input.dateFrom)}`);
      if (input.dateTo) conditions.push(sql`${articles.publishedAt} <= ${new Date(input.dateTo)}`);

      const whereClause = and(...conditions)!;

      const rows = await db
        .select()
        .from(articles)
        .where(whereClause)
        .orderBy(desc(articles.relevanceScore), desc(articles.publishedAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(articles)
        .where(whereClause);

      return { articles: rows, total: Number(countResult[0]?.count ?? 0) };
    }),

  // Öffentlich: Alle veröffentlichten Artikel listen (ohne Suche)
  listPublishedArticles: publicQuery
    .input(z.object({
      category: z.enum(["news", "tools", "prompts", "tutorials", "podcasts", "videos", "reads", "image_gen"]).optional(),
      limit: z.number().default(25),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const opts = input ?? ({} as NonNullable<typeof input>);
      const conditions = [eq(articles.status, "published")];

      if (opts.category) conditions.push(eq(articles.category, opts.category));

      const whereClause = and(...conditions)!;

      const rows = await db
        .select()
        .from(articles)
        .where(whereClause)
        .orderBy(desc(articles.publishedAt))
        .limit(opts.limit)
        .offset(opts.offset);

      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(articles)
        .where(whereClause);

      return { articles: rows, total: Number(countResult[0]?.count ?? 0) };
    }),
  listByCategory: publicQuery
    .input(z.object({
      category: z.enum(["news", "tools", "prompts", "tutorials", "podcasts", "videos", "reads", "image_gen"]),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(articles)
        .where(and(eq(articles.category, input.category), eq(articles.status, "published")))
        .orderBy(desc(articles.publishedAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(articles)
        .where(and(eq(articles.category, input.category), eq(articles.status, "published")));

      return { articles: rows, total: Number(countResult[0]?.count ?? 0) };
    }),

  // Öffentlich: Alle eindeutigen Tags
  listTags: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({ tags: articles.tags })
      .from(articles)
      .where(eq(articles.status, "published"));

    const tagSet = new Set<string>();
    for (const row of rows) {
      if (row.tags) {
        try {
          const parsed = JSON.parse(row.tags) as string[];
          parsed.forEach((t) => tagSet.add(t));
        } catch { /* ignore invalid JSON */ }
      }
    }
    return Array.from(tagSet).sort();
  }),

  // Öffentlich: Einzelner Artikel
  getArticle: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(articles)
        .where(and(eq(articles.id, input.id), eq(articles.status, "published")))
        .limit(1);
      return rows[0] ?? null;
    }),
});
