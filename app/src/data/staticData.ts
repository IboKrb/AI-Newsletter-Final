export const staticIssue = {
  id: 1,
  issueNumber: 1,
  title: "AI Newsletter #1 – OpenAI Hardware, Google Workspace AI & DeepSeek-V4",
  slug: "issue-1-april-2026",
  summary: "Die erste Ausgabe mit den heißesten KI-News: OpenAI plant ein Smartphone, Google rüstet Workspace mit Gemini auf, DeepMind-Gründer sammelt 1,1 Mrd. ein und DeepSeek-V4 überrascht mit Frontier-Leistung zum Bruchteil der Kosten.",
  tier: "both",
  isPublished: true,
  publishDate: new Date("2026-04-29"),
  createdAt: new Date("2026-04-29"),
  updatedAt: new Date("2026-04-29"),
};

export const staticNews = [
  {
    id: 1,
    issueId: 1,
    headline: "OpenAI plant AI-Smartphone – Apps sollen durch Agents ersetzt werden",
    summary: "Laut Analyst Ming-Chi Kuo arbeitet OpenAI mit MediaTek, Qualcomm und Luxshare an einem Smartphone, das statt Apps auf AI-Agents setzt. Massenproduktion erst 2028 erwartet.",
    sourceName: "TechCrunch",
    sourceUrl: "https://techcrunch.com/2026/04/27/openai-could-be-making-a-phone-with-ai-agents-replacing-apps/",
    category: "product",
    imageUrl: "/assets/news-openai-phone.jpg",
    publishedAt: new Date("2026-04-27"),
    createdAt: new Date("2026-04-29"),
  },
  {
    id: 2,
    issueId: 1,
    headline: "Google Workspace wird zum AI-Office-Intern: Gemini übernimmt Sheets, Docs & E-Mails",
    summary: "Workspace Intelligence automatisiert Aufgaben in Gmail, Calendar, Chat und Drive. Nutzer können Sheets per Prompt erstellen und 9x schneller ausfüllen lassen.",
    sourceName: "TechCrunch",
    sourceUrl: "https://techcrunch.com/2026/04/22/google-updates-workspace-to-make-ai-your-new-office-intern/",
    category: "product",
    imageUrl: "/assets/news-google-workspace.jpg",
    publishedAt: new Date("2026-04-22"),
    createdAt: new Date("2026-04-29"),
  },
  {
    id: 3,
    issueId: 1,
    headline: "DeepMind-Veteran David Silver sammelt 1,1 Mrd. für 'Superlearner'-KI ohne menschliche Daten",
    summary: "Ineffable Intelligence will Reinforcement Learning nutzen, um eine KI zu bauen, die eigenständig aus Erfahrung lernt – vergleichbar mit AlphaZero, aber für alle Intelligenz.",
    sourceName: "TechCrunch",
    sourceUrl: "https://techcrunch.com/2026/04/27/deepminds-david-silver-just-raised-1-1b-to-build-an-ai-that-learns-without-human-data/",
    category: "funding",
    imageUrl: "/assets/news-ineffable.jpg",
    publishedAt: new Date("2026-04-27"),
    createdAt: new Date("2026-04-29"),
  },
  {
    id: 4,
    issueId: 1,
    headline: "Das große AI-Monetarisierung-Squeeze: Die gratis-AI-Ära endet",
    summary: "Anthropic drosselt OpenClaw-Agenten, OpenAI führt Werbung in ChatGPT ein. Token-Preise steigen, Unternehmen migrieren zu Open-Source-Modellen oder self-hosting.",
    sourceName: "The Verge",
    sourceUrl: "https://www.theverge.com/ai-artificial-intelligence/917380/ai-monetization-anthropic-openai-token-economics-revenue",
    category: "industry",
    imageUrl: "/assets/news-monetization.jpg",
    publishedAt: new Date("2026-04-29"),
    createdAt: new Date("2026-04-29"),
  },
  {
    id: 5,
    issueId: 1,
    headline: "MIT Technology Review: '10 Things That Matter in AI Right Now'",
    summary: "Die brandneue Liste zeigt die wichtigsten AI-Trends 2026: World Models, militärische KI-Einsatzräume, Humanoid-Roboter-Daten, Agent-Orchestrierung und mehr.",
    sourceName: "MIT Technology Review",
    sourceUrl: "https://www.prnewswire.com/news-releases/mit-technology-review-launches-new-list-of-10-things-that-matter-in-ai-right-now-302750238.html",
    category: "breakthrough",
    imageUrl: "/assets/news-mit-10things.jpg",
    publishedAt: new Date("2026-04-14"),
    createdAt: new Date("2026-04-29"),
  },
  {
    id: 6,
    issueId: 1,
    headline: "DeepSeek-V4 liefert nahezu State-of-the-Art zum 1/6 der Kosten von Opus 4.7",
    summary: "Das neue Modell übertrifft GPT-5.5 und Claude Opus 4.7 bei einem Bruchteil der Kosten. Open-Source-Ansatz treibt Enterprise-Adoption voran.",
    sourceName: "VentureBeat",
    sourceUrl: "https://venturebeat.com/ai/deepseek-v4-arrives-with-near-state-of-the-art-intelligence-at-1-6th-the-cost-of-opus-4-7-gpt-5-5/",
    category: "research",
    imageUrl: "/assets/news-deepseek-v4.jpg",
    publishedAt: new Date("2026-04-29"),
    createdAt: new Date("2026-04-29"),
  },
  {
    id: 7,
    issueId: 1,
    headline: "Microsoft & OpenAI beenden Exklusiv-Deal – AWS und Google Cloud freigeschaltet",
    summary: "Historische Neuordnung: OpenAI darf Modelle nun auch auf AWS Bedrock und Google Cloud anbieten. Microsoft behält API-Exklusivität, verzichtet auf Revenue-Share.",
    sourceName: "Ars Technica / VentureBeat",
    sourceUrl: "https://venturebeat.com/ai/microsoft-and-openai-gut-their-exclusive-deal-freeing-openai-to-sell-on-aws-and-google-cloud/",
    category: "industry",
    imageUrl: "/assets/news-ms-openai.jpg",
    publishedAt: new Date("2026-04-29"),
    createdAt: new Date("2026-04-29"),
  },
];

export const staticTools = [
  { id: 1, issueId: 1, name: "Plurai", description: "Vibe-train Evals und Guardrails tailored to your use case. API-first Tool für AI-Evaluierung.", category: "Developer Tools", url: "https://www.producthunt.com/products/plurai", imageUrl: "/assets/tool-plurai.jpg", voteCount: 96, isNew: true },
  { id: 2, issueId: 1, name: "KarmaBox", description: "Run your own Claude Code in your pocket. Mobile AI-Coding-Agent für unterwegs.", category: "Productivity", url: "https://www.producthunt.com/products/karmabox", imageUrl: "/assets/tool-karmabox.jpg", voteCount: 35, isNew: true },
  { id: 3, issueId: 1, name: "CodeHealth MCP Server", description: "Keep AI-generated code healthy and maintainable. MCP-Server für Code-Qualitätssicherung.", category: "Developer Tools", url: "https://www.producthunt.com/products/codehealth-mcp-server-by-codescene", imageUrl: "/assets/tool-codehealth.jpg", voteCount: 35, isNew: true },
  { id: 4, issueId: 1, name: "Netlify Database", description: "Ship data-driven apps without breaking flow. Integrierte DB für AI-Apps direkt in Netlify.", category: "Developer Tools", url: "https://www.producthunt.com/products/netlify-database", imageUrl: "/assets/tool-netlify-db.jpg", voteCount: 3, isNew: true },
  { id: 5, issueId: 1, name: "Devin for Terminal", description: "Local CLI coding agent with deep Devin Cloud integration. Autonome Code-Generierung im Terminal.", category: "Software Engineering", url: "https://www.producthunt.com/products/devin-for-terminal", imageUrl: "/assets/tool-devin.jpg", voteCount: 2, isNew: true },
];

export const staticPrompt = {
  id: 1,
  issueId: 1,
  title: "Der 'World-Class Expert' Prompt für komplexe Analysen",
  prompt: `Du bist [ROLLE: Senior-Strategieberater bei McKinsey mit 20 Jahren Erfahrung in {Branche}]. 

AUFGABE: Analysiere {Thema} aus drei Perspektiven:
1. Strategische Positionierung (Marktchancen, Wettbewerbsvorteile)
2. Operative Umsetzbarkeit (Ressourcen, Timeline, Risiken)  
3. Innovation & Zukunftssicherheit (technologische Trends, Disruptionspotenzial)

FORMAT:
- Executive Summary (3 Bullet Points)
- Detaillierte Analyse pro Perspektive
- Konkrete Handlungsempfehlungen mit Priorisierung (High/Medium/Low)
- Risiko-Matrix

SPRACHSTIL: Präzise, datenbasiert, ohne Füllwörter. Nutze Frameworks wie Porter's Five Forces oder Blue Ocean Strategy wo passend.`,
  description: "Dieser Prompt nutzt Role-Playing + strukturierte Perspektiven + erzwungenes Format für konsultative Spitzenqualität. Ideal für Geschäftsstrategien, Due Diligence oder Produktentscheidungen.",
  useCase: "Strategie & Beratung",
  model: "Claude Opus 4.7 / GPT-5.5",
  exampleOutput: "Executive Summary:\n• Markt wächst 23% p.a., aber 3 etablierte Player kontrollieren 70%\n• AI-Automatisierung ermöglicht 40% Kostensenkung bei Customer Success\n• Regulatorische Risiken in EU erfordern proaktive Compliance-Strategie",
  tags: '["strategie","business","analyse","expertenmodus"]',
  createdAt: new Date("2026-04-29"),
};

export const staticTutorials = [
  {
    id: 1,
    issueId: 1,
    title: "Claude Projects: Dein ultimativer Custom Workspace & Knowledge Base Guide",
    description: "Wie du Claude Projects nutzt, um 200K-Token-Kontextfenster maximal auszuschöpfen. Von PDF-Libraries über CSV-Datasets bis zu Style Guides – alles im Hintergrund referenzierbar.",
    tool: "Claude (Anthropic)",
    difficulty: "intermediate",
    content: "## Claude Projects Setup Guide\n\n### 1. Projektstruktur anlegen\n- Erstelle getrennte Projekte für verschiedene Workflows (Code, Content, Research)\n- Nutze aussagekräftige Namen und konsistente Tag-Strukturen\n\n### 2. Knowledge Base befüllen\n- Upload: PDF-Dokumentationen, Architekturdiagramme, Style Guides\n- CSV-Datasets für datengesteuerte Analysen\n- Max 200K Token pro Projekt nutzen\n\n### 3. Kontext-Sync mit Claude Code CLI\n- Projekte synchronisieren sich mit Claude Code CLI\n- MCP (Model Context Protocol) für externe Tool-Integration\n- Project Memory: Claude speichert erfolgreiche Debugging-Versuche\n\n### 4. Prompt-Engineering für Projects\n- Beginne jede Session mit: 'Referenziere das [Dokument] im Knowledge Base'\n- Nutze spezifische Seitenangaben: 'Basierend auf Seite 42 des Audit-Reports...'\n\n### 5. Best Practices\n- Regelmäßige Wartung: Entferne obsolete Dokumente\n- Versionierung: Nutze Datum im Dokumentennamen\n- Team-Sharing: Exportiere erfolgreiche Prompt-Patterns",
    videoUrl: "https://www.youtube.com/watch?v=gVsjjUIbE9k",
    imageUrl: "/assets/tutorial-claude.jpg",
    estimatedTime: "25 min",
    createdAt: new Date("2026-04-29"),
  },
];

export const staticPodcasts = [
  { id: 1, issueId: 1, title: "Latent Space", host: "Swyx & Alessio Fanelli", description: "Der Podcast für AI Engineers, Builder und Founders. Anthropic Engineers, Hugging Face Devs, LangChain Architects.", episodeTitle: "Supercharging Developer Productivity", duration: "~60 min", spotifyUrl: "https://open.spotify.com/show/latentspace", appleUrl: "https://podcasts.apple.com/podcast/latentspace", youtubeUrl: "https://youtube.com/latentspace", imageUrl: "/assets/podcast-latent-space.jpg", createdAt: new Date("2026-04-29") },
  { id: 2, issueId: 1, title: "The TWIML AI Podcast", host: "Sam Charrington", description: "Verbindet cutting-edge Research mit praktischer Enterprise-Implementation.", episodeTitle: "Nightshade: Data Poisoning to Fight Generative AI", duration: "~45 min", spotifyUrl: "https://open.spotify.com/show/twiml", appleUrl: "https://podcasts.apple.com/podcast/twiml", youtubeUrl: "https://youtube.com/twiml", imageUrl: "/assets/podcast-twiml.jpg", createdAt: new Date("2026-04-29") },
];

export const staticVideos = [
  { id: 1, issueId: 1, title: "Claude Projects: The Ultimate Custom Workspace Guide 2026", creator: "AI Coding Tutorials", description: "Deep Dive in Claude Projects – Knowledge Base Upload, MCP-Integration, Project Memory.", youtubeUrl: "https://www.youtube.com/watch?v=gVsjjUIbE9k", thumbnailUrl: "/assets/video-claude-projects.jpg", duration: "35 min", createdAt: new Date("2026-04-29") },
  { id: 2, issueId: 1, title: "Claude Code Tutorial for Beginners – Complete 2026 Guide", creator: "Code With Mukesh", description: "Von Plan Mode über Subagents bis zu Custom Skills.", youtubeUrl: "https://www.youtube.com/watch?v=claude-code-2026", thumbnailUrl: "/assets/video-claude-code.jpg", duration: "42 min", createdAt: new Date("2026-04-29") },
];

export const staticReads = [
  { id: 1, issueId: 1, title: "10 Things That Matter in AI Right Now – MIT Technology Review", author: "MIT Technology Review Editorial Team", description: "Die brandneue jährliche Liste der wichtigsten AI-Entwicklungen. World Models, Agent Orchestration, Humanoid Data und mehr.", url: "https://www.technologyreview.com/2026/04/14/1135298/coming-soon-10-things-that-matter-in-ai-right-now/", source: "MIT Technology Review", readTime: "15 min", imageUrl: "/assets/read-mit.jpg", createdAt: new Date("2026-04-29") },
  { id: 2, issueId: 1, title: "Four AI Research Trends Enterprise Teams Should Watch in 2026", author: "VentureBeat Research Team", description: "Continual Learning, Titans Memory Architecture, Nested Learning und Agent-Orchestrierung.", url: "https://venturebeat.com/technology/four-ai-research-trends-enterprise-teams-should-watch-in-2026", source: "VentureBeat", readTime: "8 min", imageUrl: "/assets/read-venturebeat.jpg", createdAt: new Date("2026-04-29") },
  { id: 3, issueId: 1, title: "Mastering AI Prompts: 10 Proven Techniques for Stunning Image Generation", author: "GPT-Image Blog", description: "Von der Photography Approach über Fantasy World Building bis zum Weighted Control.", url: "https://gpt-image.com/blogs/mastering-ai-prompts-10-proven-techniques", source: "GPT-Image", readTime: "12 min", imageUrl: "/assets/read-prompts.jpg", createdAt: new Date("2026-04-29") },
];

export const staticImageGens = [
  { id: 1, issueId: 1, title: "Die Photography Approach: Fotorealistische AI-Bilder mit Kamera-Parametern", tool: "Midjourney V7 / DALL-E 3", prompt: "Portrait of a young entrepreneur in a modern office, shot on a Sony α7 III with an 85mm lens at F/1.4 aperture. Soft natural lighting from a large window creates beautiful bokeh in the background. Professional headshot quality, sharp focus on the eyes.", technique: "Kamera-Parameter & Licht-Setup", description: "Spezifiziere Kamera-Body, Objektiv, Blende und Lichtquelle. Die KI reproduziert professionelle Setup-Logik erstaunlich genau.", imageUrl: "/assets/imgen-photography.jpg", tips: '["Nenne spezifische Kameras: Sony α7 III, Canon EOS R5","Objektiv + Blende erzeugen realistischen Bokeh","Lichtquelle definieren: soft natural light, golden hour","Qualitäts-Keywords: professional headshot, sharp focus","Negative Prompts: --no blurry, extra fingers, watermark"]', createdAt: new Date("2026-04-29") },
  { id: 2, issueId: 1, title: "Fantasy World Builder: Epische Szenen mit Künstler-Referenzen", tool: "Midjourney V7", prompt: "A majestic dragon coiled around an ancient castle tower, illuminated by ethereal moonlight casting dramatic shadows across weathered stone. In the style of Frank Frazetta's heroic fantasy paintings, with rich contrasts and epic composition.", technique: "Künstler-Referenzen & Atmosphäre", description: "Künstler-Namen sind mächtige Shortcuts. 'Frazetta' kapselt Stil, Stimmung und Komposition.", imageUrl: "/assets/imgen-fantasy.jpg", tips: '["Referenziere bekannte Künstler: Frank Frazetta, Greg Rutkowski","Atmosphärische Layer: ethereal moonlight, dramatic shadows","Stil-Keywords: oil painting, cinematic composition","Midjourney Parameter: --s 750","Kombiniere 2-3 Künstler für Hybrid-Stile"]', createdAt: new Date("2026-04-29") },
];
