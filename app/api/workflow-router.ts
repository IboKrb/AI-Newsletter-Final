import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import * as engine from "./services/workflow-engine";
import { getPublicSettings, setSetting } from "./services/settings";
import { getAiClient } from "./services/ai-client";
import { restartWeeklyCronjob } from "./services/scheduler";

const categoryEnum = z.enum([
  "news",
  "tools",
  "prompts",
  "tutorials",
  "podcasts",
  "videos",
  "reads",
  "image_gen",
]);

export const workflowRouter = createRouter({
  // ── Templates ──────────────────────────────────────────────────
  listTemplates: adminQuery.query(() => engine.listTemplates()),

  getTemplate: adminQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => engine.getTemplate(input.id)),

  createTemplate: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        category: categoryEnum,
        description: z.string().optional(),
        systemPrompt: z.string().min(1),
        userPrompt: z.string().min(1),
        repetitions: z.number().int().min(1).max(10).default(1),
        maxArticles: z.number().int().min(1).max(50).default(10),
        useGrounding: z.boolean().default(true),
        autoPublish: z.boolean().default(true),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(({ input }) => engine.createTemplate(input)),

  updateTemplate: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: categoryEnum.optional(),
        description: z.string().optional(),
        systemPrompt: z.string().min(1).optional(),
        userPrompt: z.string().min(1).optional(),
        repetitions: z.number().int().min(1).max(10).optional(),
        maxArticles: z.number().int().min(1).max(50).optional(),
        useGrounding: z.boolean().optional(),
        autoPublish: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return engine.updateTemplate(id, data);
    }),

  deleteTemplate: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await engine.deleteTemplate(input.id);
      return { success: true };
    }),

  // ── Sources ────────────────────────────────────────────────────
  listSources: adminQuery
    .input(z.object({ category: categoryEnum.optional() }).optional())
    .query(({ input }) => engine.listSources(input?.category)),

  addSource: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
        category: categoryEnum.default("news"),
        isStandard: z.boolean().default(false),
        priority: z.number().int().default(0),
        notes: z.string().optional(),
      }),
    )
    .mutation(({ input }) => engine.addSource(input)),

  updateSource: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        url: z.string().url().optional(),
        category: categoryEnum.optional(),
        isStandard: z.boolean().optional(),
        isActive: z.boolean().optional(),
        priority: z.number().int().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return engine.updateSource(id, data);
    }),

  deleteSource: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await engine.deleteSource(input.id);
      return { success: true };
    }),

  setSourceStandard: adminQuery
    .input(z.object({ id: z.number(), isStandard: z.boolean() }))
    .mutation(({ input }) => engine.setStandard(input.id, input.isStandard)),

  // ── Runs ───────────────────────────────────────────────────────
  listRuns: adminQuery
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(({ input }) => engine.listRuns(input?.limit ?? 50)),

  getRun: adminQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => engine.getRun(input.id)),

  startRun: adminQuery
    .input(z.object({ templateId: z.number(), extraSourceIds: z.array(z.number()).optional() }))
    .mutation(async ({ input }) => {
      const runId = await engine.startRun(input.templateId, { extraSourceIds: input.extraSourceIds });
      return { runId };
    }),

  startMultiple: adminQuery
    .input(z.object({ templateIds: z.array(z.number()).min(1) }))
    .mutation(async ({ input }) => {
      const runIds = await engine.startMultiple(input.templateIds);
      return { runIds };
    }),

  // Alle Workflows auf einmal ausführen
  startAll: adminQuery.mutation(async () => {
    const templates = await engine.listTemplates();
    const runIds = await engine.startMultiple(templates.map((t) => t.id));
    return { runIds, total: templates.length };
  }),

  cancelRun: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await engine.cancelRun(input.id);
      return { success: true };
    }),

  // ── Settings (Gemini-Token etc.) ───────────────────────────────
  getSettings: adminQuery.query(() => getPublicSettings()),

  updateSettings: adminQuery
    .input(
      z.object({
        apiKey: z.string().optional(),
        model: z.string().optional(),
        baseUrl: z.string().optional(),
        grounding: z.boolean().optional(),
        testMode: z.boolean().optional(),
        cronEnabled: z.boolean().optional(),
        cronDay: z.number().int().min(0).max(6).optional(),
        cronHour: z.number().int().min(0).max(23).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.apiKey !== undefined && input.apiKey !== "") await setSetting("ai_api_key", input.apiKey);
      if (input.model !== undefined) await setSetting("ai_model", input.model);
      if (input.baseUrl !== undefined) await setSetting("ai_base_url", input.baseUrl);
      if (input.grounding !== undefined) await setSetting("ai_grounding_enabled", String(input.grounding));
      if (input.testMode !== undefined) await setSetting("test_mode", String(input.testMode));

      let cronChanged = false;
      if (input.cronEnabled !== undefined) { await setSetting("cron_enabled", String(input.cronEnabled)); cronChanged = true; }
      if (input.cronDay !== undefined) { await setSetting("cron_day", String(input.cronDay)); cronChanged = true; }
      if (input.cronHour !== undefined) { await setSetting("cron_hour", String(input.cronHour)); cronChanged = true; }
      // Cron sofort neu anwenden (greift im Production-Betrieb)
      if (cronChanged) await restartWeeklyCronjob();

      return getPublicSettings();
    }),

  testConnection: adminQuery.mutation(async () => {
    try {
      const client = await getAiClient();
      const sample = await client.chatCompletion(
        "Antworte ausschließlich mit dem Wort: OK",
        undefined,
        0,
      );
      return { ok: true, sample: sample.slice(0, 200) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }),
});
