import type * as schema from "@db/schema";

/**
 * Kuratierte Demo-Inhalte für den öffentlichen Demo-Zugang.
 * Alle Beiträge beschreiben echte Tools, Paper, Podcasts und Videos und
 * verlinken auf die realen Originalquellen (Stand: Oktober 2026 geprüft).
 */

type Category = (typeof schema.categoryEnum.enumValues)[number];
type ArticleStatus = (typeof schema.statusEnum.enumValues)[number];

export interface DemoArticle {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  relevanceScore: number;
  status?: ArticleStatus;
}

export interface DemoRunPlan {
  category: Category;
  durationSec: number;
  /** Wiederholungen, die mit einem Gemini-Ratenlimit (429) fehlschlagen */
  failedReps?: number[];
  repetitions?: number;
  duplicates: number;
}

const p = (...paragraphs: string[]) => paragraphs.join("\n\n");
const asset = (name: string) => `/assets/${name}.jpg`;
const youtube = (id: string) => ({
  sourceUrl: `https://www.youtube.com/watch?v=${id}`,
  imageUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
});

export const DEMO_ARTICLES: Record<Category, DemoArticle[]> = {
  news: [
    {
      title: "Model Context Protocol etabliert sich als Standard für KI-Agenten",
      summary:
        "Das offene Protokoll MCP verbindet KI-Assistenten mit Tools, Datenbanken und APIs – und wird inzwischen von zahlreichen Anbietern und Entwicklungsumgebungen unterstützt.",
      content: p(
        "Das Model Context Protocol (MCP) wurde Ende 2024 von Anthropic als offener Standard vorgestellt. Die Idee: Statt für jede KI-Anwendung eigene Integrationen zu bauen, stellen sogenannte MCP-Server Werkzeuge, Datenquellen und Prompts über eine einheitliche Schnittstelle bereit. Jeder MCP-fähige Client – etwa ein Chat-Assistent, ein Code-Editor oder ein Agent im Terminal – kann diese Fähigkeiten direkt nutzen.",
        "Inzwischen gibt es MCP-Server für GitHub, Datenbanken, Dateisysteme, Browser-Automatisierung und viele SaaS-Dienste. Auch große Anbieter und Entwicklungsumgebungen haben MCP-Unterstützung integriert, wodurch sich das Protokoll zum De-facto-Standard für agentische Workflows entwickelt hat.",
        "Für Teams bedeutet das: Eine Integration, einmal als MCP-Server gebaut, funktioniert mit vielen KI-Clients. Wichtig bleibt ein bewusster Umgang mit Berechtigungen – jeder angebundene Server erweitert, was ein Agent tun darf.",
      ),
      tags: ["mcp", "agents", "anthropic", "open-standard", "integration"],
      sourceName: "Model Context Protocol",
      sourceUrl: "https://modelcontextprotocol.io/",
      imageUrl: asset("news-ms-openai"),
      relevanceScore: 96,
    },
    {
      title: "EU AI Act: Welche Pflichten jetzt gelten – und was noch kommt",
      summary:
        "Die europäische KI-Verordnung tritt stufenweise in Kraft. Ein Überblick über Verbote, Pflichten für Allzweck-KI-Modelle und den Fahrplan für Hochrisiko-Systeme.",
      content: p(
        "Der AI Act ist das erste umfassende KI-Gesetz der EU und verfolgt einen risikobasierten Ansatz: Je höher das Risiko eines KI-Systems, desto strenger die Anforderungen. Die Verordnung ist am 1. August 2024 in Kraft getreten, ihre Regeln greifen aber gestaffelt.",
        "Seit Februar 2025 sind bestimmte Praktiken verboten, etwa Social Scoring oder manipulative Systeme, die Schwächen von Menschen ausnutzen. Zudem müssen Unternehmen für ausreichende KI-Kompetenz ihrer Mitarbeitenden sorgen. Seit August 2025 gelten Pflichten für Anbieter von Allzweck-KI-Modellen (GPAI), darunter technische Dokumentation und Transparenz zu Trainingsdaten.",
        "Für Hochrisiko-Anwendungen – etwa im Personalwesen, in der Bildung oder in kritischer Infrastruktur – sind umfangreiche Anforderungen an Risikomanagement, Datenqualität und menschliche Aufsicht vorgesehen. Wer KI-Systeme entwickelt oder einsetzt, sollte eine Bestandsaufnahme machen und die eigenen Anwendungsfälle einer Risikoklasse zuordnen.",
      ),
      tags: ["eu-ai-act", "regulierung", "compliance", "policy"],
      sourceName: "EU-Kommission – Digital Strategy",
      sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
      imageUrl: asset("news-monetization"),
      relevanceScore: 92,
    },
    {
      title: "Open-Weight-Modelle schließen zur Spitze auf",
      summary:
        "Frei verfügbare Modelle wie DeepSeek, Qwen, Llama, Mistral oder gpt-oss liefern für viele Aufgaben konkurrenzfähige Ergebnisse – und lassen sich selbst betreiben.",
      content: p(
        "Noch vor wenigen Jahren lagen offene Sprachmodelle deutlich hinter den proprietären Systemen der großen Labore. Dieser Abstand ist spürbar kleiner geworden. Modellfamilien wie DeepSeek, Qwen, Llama und Mistral sowie OpenAIs gpt-oss werden mit offenen Gewichten veröffentlicht und können lokal oder in der eigenen Cloud betrieben werden.",
        "Für Unternehmen ist das vor allem aus drei Gründen interessant: Datenschutz (Daten verlassen die eigene Infrastruktur nicht), Kostenkontrolle bei hohem Volumen und die Möglichkeit, Modelle per Fine-Tuning auf eigene Aufgaben zu spezialisieren.",
        "Der zentrale Umschlagplatz für diese Modelle ist Hugging Face. Dort lassen sich Modelle nach Größe, Lizenz und Aufgabe filtern. Ein Blick auf die Lizenz lohnt sich: Nicht jedes „offene“ Modell erlaubt jede kommerzielle Nutzung.",
      ),
      tags: ["open-source", "llm", "deepseek", "qwen", "self-hosting"],
      sourceName: "Hugging Face",
      sourceUrl: "https://huggingface.co/models",
      imageUrl: asset("news-deepseek-v4"),
      relevanceScore: 90,
    },
    {
      title: "Stanford AI Index: Der große Datenreport zum Stand der KI",
      summary:
        "Der jährliche Bericht des Stanford Institute for Human-Centered AI bündelt Daten zu Forschung, Leistungsfähigkeit, Kosten, Wirtschaft und Regulierung von KI.",
      content: p(
        "Wer sich einen fundierten Überblick über die Entwicklung der künstlichen Intelligenz verschaffen will, kommt am AI Index Report kaum vorbei. Das Stanford Institute for Human-Centered Artificial Intelligence (HAI) veröffentlicht ihn jedes Jahr und stützt sich dabei auf umfangreiche, frei zugängliche Datensätze.",
        "Der Bericht verfolgt unter anderem, wie schnell Modelle bei Benchmarks aufholen, wie sich Trainings- und Inferenzkosten entwickeln, wohin Investitionen fließen, wie Unternehmen KI tatsächlich einsetzen und welche Gesetze weltweit verabschiedet werden.",
        "Besonders wertvoll ist der Report für Entscheider, Journalistinnen und Studierende, die Aussagen über KI mit belastbaren Zahlen untermauern möchten. Grafiken und Rohdaten stehen zum Download bereit.",
      ),
      tags: ["report", "forschung", "stanford", "trends", "daten"],
      sourceName: "Stanford HAI",
      sourceUrl: "https://hai.stanford.edu/ai-index",
      imageUrl: asset("read-venturebeat"),
      relevanceScore: 80,
    },
    {
      title: "Arena AI: Wie Community-Votings KI-Modelle vergleichbar machen",
      summary:
        "Auf der Plattform – früher als LMArena bzw. Chatbot Arena bekannt – bewerten Nutzer anonymisierte Modellantworten im direkten Vergleich. Daraus entsteht eines der meistbeachteten KI-Rankings.",
      content: p(
        "Benchmarks mit festen Testfragen haben ein Problem: Modelle können gezielt auf sie optimiert werden. Arena AI, ursprünglich als Chatbot Arena aus einem Forschungsprojekt an der UC Berkeley entstanden, setzt deshalb auf menschliche Urteile. Nutzer stellen eine beliebige Frage, erhalten zwei Antworten von anonymen Modellen und stimmen ab, welche besser ist.",
        "Aus einer sehr großen Zahl solcher Paarvergleiche wird – ähnlich wie beim Elo-System im Schach – eine Rangliste berechnet. Neben dem allgemeinen Ranking gibt es Bestenlisten für Teilbereiche wie Programmieren, Bildgenerierung oder Vision.",
        "Das Ranking ist ein guter Indikator dafür, welche Modelle Menschen im Alltag bevorzugen. Für konkrete Einsatzzwecke ersetzt es aber keine eigenen Tests mit realistischen Aufgaben aus dem eigenen Anwendungsfall.",
      ),
      tags: ["benchmark", "leaderboard", "evaluation", "llm"],
      sourceName: "Arena AI",
      sourceUrl: "https://arena.ai/",
      imageUrl: asset("tool-codehealth"),
      relevanceScore: 84,
      status: "review",
    },
  ],

  tools: [
    {
      title: "Claude Code: Agentisches Programmieren im Terminal",
      summary:
        "Anthropics Coding-Agent liest die Codebasis, bearbeitet Dateien, führt Befehle aus und erledigt Git-Workflows – im Terminal, in der IDE oder im Browser.",
      content: p(
        "Claude Code ist ein agentisches Coding-Werkzeug von Anthropic. Anders als klassische Autovervollständigung arbeitet es aufgabenorientiert: Man beschreibt in natürlicher Sprache, was erreicht werden soll – etwa ein Feature umsetzen, einen Bug beheben oder Tests ergänzen – und der Agent erkundet selbstständig das Projekt, plant die Änderungen und setzt sie um.",
        "Dabei kann Claude Code Dateien lesen und schreiben, Shell-Befehle ausführen, Tests laufen lassen und Commits oder Pull Requests vorbereiten. Über das Model Context Protocol lassen sich zusätzliche Werkzeuge anbinden, zum Beispiel Issue-Tracker oder Datenbanken.",
        "Neben dem Terminal ist Claude Code auch als Erweiterung für gängige IDEs, als Desktop-App und im Web verfügbar. Berechtigungen für Dateizugriffe und Befehle lassen sich fein steuern, sodass Entwickler die Kontrolle behalten.",
      ),
      tags: ["claude-code", "coding", "agent", "cli", "developer-tools"],
      sourceName: "Anthropic",
      sourceUrl: "https://claude.com/product/claude-code",
      imageUrl: asset("tools-hero"),
      relevanceScore: 95,
    },
    {
      title: "Cursor: Der KI-native Code-Editor",
      summary:
        "Der auf VS Code basierende Editor integriert KI in jeden Arbeitsschritt – von intelligenter Autovervollständigung bis zum Agenten, der Änderungen über mehrere Dateien hinweg umsetzt.",
      content: p(
        "Cursor ist ein Code-Editor, der von Grund auf um KI-Funktionen herum gebaut wurde. Weil er auf VS Code basiert, lassen sich vorhandene Erweiterungen, Themes und Tastenkürzel weiter nutzen – der Umstieg fällt entsprechend leicht.",
        "Im Alltag stechen drei Funktionen hervor: Die Tab-Vervollständigung schlägt nicht nur die nächste Zeile, sondern zusammenhängende Änderungen vor. Im Chat kann man Fragen zur eigenen Codebasis stellen, wobei Cursor relevante Dateien als Kontext einbezieht. Und im Agent-Modus setzt die KI größere Aufgaben eigenständig über mehrere Dateien hinweg um und führt bei Bedarf Terminal-Befehle aus.",
        "Cursor unterstützt Modelle verschiedener Anbieter, sodass sich je nach Aufgabe zwischen schnellen und besonders leistungsfähigen Modellen wählen lässt.",
      ),
      tags: ["cursor", "editor", "coding", "agent", "vscode"],
      sourceName: "Cursor",
      sourceUrl: "https://cursor.com/",
      imageUrl: asset("tool-karmabox"),
      relevanceScore: 91,
    },
    {
      title: "Gemini Notebook: Recherche mit den eigenen Quellen",
      summary:
        "Googles Recherche-Werkzeug – bekannt geworden als NotebookLM – beantwortet Fragen auf Basis hochgeladener Dokumente, mit Quellenverweisen und Audio-Zusammenfassungen.",
      content: p(
        "Gemini Notebook, ursprünglich als NotebookLM gestartet, verfolgt einen anderen Ansatz als klassische Chatbots: Statt aus dem allgemeinen Trainingswissen zu antworten, stützt es sich auf die Quellen, die man selbst hinzufügt – etwa PDFs, Google Docs, Webseiten oder YouTube-Videos.",
        "Antworten enthalten Verweise auf die passenden Textstellen, sodass sich Aussagen schnell überprüfen lassen. Das reduziert das Risiko erfundener Fakten und macht das Tool besonders nützlich für Studium, Recherche und die Einarbeitung in neue Themen.",
        "Beliebt sind außerdem die Audio-Zusammenfassungen: Aus den Quellen entsteht ein podcastähnliches Gespräch zweier KI-Stimmen, das die wichtigsten Punkte erklärt.",
      ),
      tags: ["notebooklm", "gemini", "google", "recherche", "rag"],
      sourceName: "Google",
      sourceUrl: "https://notebook.google/",
      imageUrl: asset("news-google-workspace"),
      relevanceScore: 88,
    },
    {
      title: "Ollama: Sprachmodelle lokal auf dem eigenen Rechner",
      summary:
        "Mit einem einzigen Befehl lassen sich offene Modelle wie Llama, Gemma, Qwen oder Mistral herunterladen und lokal ausführen – inklusive API für eigene Anwendungen.",
      content: p(
        "Ollama macht den Betrieb großer Sprachmodelle auf dem eigenen Rechner so einfach wie die Installation eines Programms. Nach dem Setup genügt ein Befehl wie „ollama run llama3.2“, um ein Modell herunterzuladen und direkt im Terminal mit ihm zu chatten.",
        "Im Hintergrund stellt Ollama eine lokale REST-API bereit, die auch mit dem OpenAI-Format kompatibel ist. Bestehende Anwendungen lassen sich dadurch oft mit minimalen Änderungen auf ein lokales Modell umstellen. Über sogenannte Modelfiles können Systemprompts und Parameter angepasst werden.",
        "Der Vorteil: Daten verlassen den eigenen Rechner nicht, es fallen keine API-Kosten an und Experimente funktionieren auch offline. Für größere Modelle ist allerdings eine leistungsfähige GPU oder viel Arbeitsspeicher empfehlenswert.",
      ),
      tags: ["ollama", "lokal", "open-source", "llm", "datenschutz"],
      sourceName: "Ollama",
      sourceUrl: "https://ollama.com/",
      imageUrl: asset("tool-plurai"),
      relevanceScore: 87,
    },
  ],

  prompts: [
    {
      title: "Few-Shot-Prompting: Mit Beispielen zu konsistenten Ergebnissen",
      summary:
        "Zwei bis fünf gut gewählte Beispiele im Prompt zeigen dem Modell Format, Tonalität und Detailtiefe – oft wirkungsvoller als lange Erklärungen.",
      content: p(
        "Beim Few-Shot-Prompting gibt man dem Modell vor der eigentlichen Aufgabe einige Beispiele mit Eingabe und gewünschter Ausgabe. Das Modell erkennt daraus das Muster und überträgt es auf den neuen Fall.",
        "Vorlage:\nKlassifiziere das Kundenfeedback als positiv, neutral oder negativ.\nFeedback: Die Lieferung kam einen Tag früher als erwartet. → positiv\nFeedback: Das Produkt ist okay, aber nichts Besonderes. → neutral\nFeedback: Der Support hat nach zwei Wochen nicht geantwortet. → negativ\nFeedback: {neues Feedback} →",
        "Tipps aus der Praxis: Die Beispiele sollten die Bandbreite realer Fälle abdecken, auch Grenzfälle. Achte auf ein einheitliches Format – das Modell übernimmt es exakt. Und variiere die Reihenfolge der Kategorien, damit das Modell nicht einfach die Position der Beispiele imitiert.",
      ),
      tags: ["few-shot", "prompt-engineering", "klassifikation", "vorlage"],
      sourceName: "Prompt Engineering Guide",
      sourceUrl: "https://www.promptingguide.ai/techniques/fewshot",
      imageUrl: asset("tool-devin"),
      relevanceScore: 89,
    },
    {
      title: "Prompts mit XML-Tags strukturieren",
      summary:
        "Klare Abschnitte für Anweisungen, Kontext und Beispiele helfen Modellen, lange Prompts korrekt zu interpretieren – eine Technik, die Anthropic ausdrücklich empfiehlt.",
      content: p(
        "Je länger ein Prompt wird, desto leichter verschwimmen Anweisungen, Hintergrundinformationen und Beispiele. Eine einfache Abhilfe: Inhalte mit XML-artigen Tags voneinander trennen. Die Tag-Namen sind frei wählbar, sollten aber sprechend sein.",
        "Vorlage:\n<aufgabe>Fasse den Vertrag für die Geschäftsführung zusammen.</aufgabe>\n<kontext>Wir sind ein Mittelständler mit 80 Mitarbeitenden.</kontext>\n<vertrag>{Vertragstext}</vertrag>\n<format>Maximal fünf Stichpunkte, Risiken zuerst.</format>",
        "Der Vorteil: Das Modell erkennt eindeutig, welcher Text Instruktion und welcher nur Material ist. Zudem lassen sich Antworten ebenfalls in Tags anfordern (z. B. <zusammenfassung>), was die automatische Weiterverarbeitung im Code erleichtert.",
      ),
      tags: ["xml", "prompt-engineering", "claude", "struktur", "vorlage"],
      sourceName: "Claude Docs",
      sourceUrl:
        "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
      imageUrl: asset("hero-ai-newsletter"),
      relevanceScore: 86,
    },
    {
      title: "Chain-of-Thought: Das Modell Schritt für Schritt denken lassen",
      summary:
        "Wer ein Modell vor der Antwort seine Zwischenschritte formulieren lässt, erhält bei Rechen-, Logik- und Planungsaufgaben deutlich zuverlässigere Ergebnisse.",
      content: p(
        "Chain-of-Thought-Prompting wurde 2022 in einem viel zitierten Paper von Forschenden bei Google beschrieben: Zeigt man einem Sprachmodell Beispiele, in denen der Lösungsweg ausformuliert ist, steigt die Trefferquote bei mehrstufigen Aufgaben deutlich.",
        "In der Praxis genügt oft eine einfache Anweisung:\nDenke Schritt für Schritt nach, bevor du antwortest. Schreibe deine Überlegungen in <gedanken> und das Ergebnis in <antwort>.",
        "Moderne Reasoning-Modelle haben diese Fähigkeit bereits eingebaut und „denken“ intern, bevor sie antworten. Bei Standardmodellen und komplexen Aufgaben – etwa Kalkulationen, Fehleranalysen oder dem Abwägen von Optionen – bleibt die explizite Aufforderung aber ein wirkungsvolles Werkzeug. Nachteil: mehr Tokens und etwas längere Antwortzeiten.",
      ),
      tags: ["chain-of-thought", "reasoning", "prompt-engineering", "forschung"],
      sourceName: "arXiv",
      sourceUrl: "https://arxiv.org/abs/2201.11903",
      imageUrl: asset("news-ineffable"),
      relevanceScore: 85,
    },
  ],

  tutorials: [
    {
      title: "RAG-Grundlagen: Eigene Dokumente an ein Sprachmodell anbinden",
      summary:
        "Retrieval-Augmented Generation verbindet ein LLM mit einer Wissensbasis. Die Schritte im Überblick – von Chunking über Embeddings bis zur Antwort mit Quellen.",
      content: p(
        "Sprachmodelle kennen nur, was in ihren Trainingsdaten stand. Retrieval-Augmented Generation (RAG) löst dieses Problem, indem relevante Informationen zur Laufzeit gesucht und dem Modell als Kontext mitgegeben werden.",
        "Der typische Ablauf:\n1. Laden: Dokumente (PDFs, Wiki-Seiten, Tickets) einlesen.\n2. Chunking: Texte in Abschnitte von einigen hundert Tokens zerlegen.\n3. Embeddings: Jeden Abschnitt in einen Vektor umwandeln und in einer Vektordatenbank speichern.\n4. Retrieval: Zur Nutzerfrage die ähnlichsten Abschnitte suchen.\n5. Generierung: Frage und Fundstellen an das LLM übergeben – mit der Anweisung, nur auf dieser Basis zu antworten und Quellen zu nennen.",
        "Frameworks wie LangChain oder LlamaIndex nehmen viel Boilerplate ab. Die Qualität hängt aber vor allem von gutem Chunking, passenden Metadaten und einer ehrlichen Evaluierung mit echten Fragen ab.",
      ),
      tags: ["rag", "embeddings", "vektordatenbank", "langchain", "tutorial"],
      sourceName: "LangChain Docs",
      sourceUrl: "https://docs.langchain.com/oss/python/langchain/rag",
      imageUrl: asset("tool-netlify-db"),
      relevanceScore: 90,
    },
    {
      title: "Erste Schritte mit der Claude API in Python",
      summary:
        "Vom API-Key bis zur ersten Antwort in wenigen Minuten: So bindest du Claude über das offizielle Python-SDK in eigene Anwendungen ein.",
      content: p(
        "Für den Einstieg brauchst du ein Konto auf der Claude-Plattform und einen API-Key, den du als Umgebungsvariable ANTHROPIC_API_KEY hinterlegst. Anschließend wird das SDK installiert:\npip install anthropic",
        'Ein minimaler Aufruf:\nimport anthropic\nclient = anthropic.Anthropic()\nmessage = client.messages.create(\n    model="claude-sonnet-5-5",\n    max_tokens=1024,\n    messages=[{"role": "user", "content": "Erkläre RAG in drei Sätzen."}],\n)\nprint(message.content[0].text)',
        "Von hier aus lässt sich die Anwendung schrittweise ausbauen: Ein Systemprompt legt Rolle und Stil fest, Streaming sorgt für schnelle Rückmeldung in der Oberfläche, und mit Tool Use kann das Modell eigene Funktionen aufrufen – etwa eine Datenbankabfrage.",
      ),
      tags: ["claude", "api", "python", "sdk", "tutorial"],
      sourceName: "Claude Platform Docs",
      sourceUrl: "https://platform.claude.com/docs/en/get-started",
      imageUrl: asset("video-claude-projects"),
      relevanceScore: 88,
    },
    {
      title: "Lokaler KI-Chat mit Ollama und Open WebUI",
      summary:
        "In drei Schritten zur eigenen, datenschutzfreundlichen ChatGPT-Alternative: Modell lokal starten, Oberfläche per Docker installieren, loslegen.",
      content: p(
        "Open WebUI ist eine Open-Source-Weboberfläche, die sich wie ein moderner KI-Chat anfühlt, aber mit lokalen Modellen arbeitet. Zusammen mit Ollama entsteht so in wenigen Minuten ein vollständig lokaler Assistent.",
        "Schritt 1: Ollama installieren und ein Modell laden, z. B. „ollama pull llama3.2“.\nSchritt 2: Open WebUI per Docker starten:\ndocker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main\nSchritt 3: http://localhost:3000 öffnen, Admin-Konto anlegen und das Modell auswählen.",
        "Open WebUI bietet Chatverläufe, das Hochladen von Dokumenten für RAG, Benutzerverwaltung und die Anbindung weiterer Modelle über OpenAI-kompatible APIs – ideal für Teams, die KI nutzen möchten, ohne vertrauliche Daten an externe Dienste zu senden.",
      ),
      tags: ["ollama", "open-webui", "docker", "lokal", "tutorial"],
      sourceName: "Open WebUI Docs",
      sourceUrl: "https://docs.openwebui.com/",
      imageUrl: asset("tutorial-claude"),
      relevanceScore: 84,
    },
  ],

  podcasts: [
    {
      title: "Latent Space: Der Podcast für AI Engineers",
      summary:
        "swyx und Alessio Fanelli sprechen mit Gründern, Forschenden und Praktikern über Modelle, Agenten, Infrastruktur und die Praxis des AI Engineering.",
      content: p(
        "Latent Space hat sich zu einer wichtigen Anlaufstelle für alle entwickelt, die KI-Anwendungen bauen. Die Hosts swyx (Shawn Wang) und Alessio Fanelli führen ausführliche Gespräche mit den Menschen hinter bekannten Modellen, Frameworks und Startups.",
        "Inhaltlich geht es weniger um Schlagzeilen als um Details: Wie werden Agenten evaluiert? Welche Architektur steckt hinter einem erfolgreichen Coding-Tool? Wo liegen die Grenzen aktueller Modelle im Produktivbetrieb? Ergänzt werden die Interviews durch Konferenz-Zusammenfassungen und Analysen im begleitenden Newsletter.",
        "Tipp für den Einstieg: Mit einer Episode zu einem Tool beginnen, das man selbst nutzt – so werden die technischen Hintergründe sofort greifbar.",
      ),
      tags: ["podcast", "ai-engineering", "agents", "interviews"],
      sourceName: "Latent Space",
      sourceUrl: "https://www.latent.space/podcast",
      imageUrl: asset("podcast-latent-space"),
      relevanceScore: 86,
    },
    {
      title: "The TWIML AI Podcast: Machine Learning im Gespräch",
      summary:
        "Seit vielen Jahren interviewt Sam Charrington führende Köpfe aus Forschung und Industrie – von neuen Modellarchitekturen bis zu KI im Unternehmenseinsatz.",
      content: p(
        "This Week in Machine Learning & AI, kurz TWIML, gehört zu den langlebigsten Podcasts der KI-Szene. Host Sam Charrington spricht mit Forschenden, Ingenieurinnen und Führungskräften über aktuelle Arbeiten und deren praktische Bedeutung.",
        "Die Bandbreite der Themen ist groß: Reinforcement Learning, Sprachmodelle, Computer Vision, KI-Sicherheit, MLOps oder der Einsatz von Machine Learning in Medizin und Industrie. Viele Folgen gehen tief in einzelne Forschungsarbeiten und erklären Methoden verständlich.",
        "Der Podcast eignet sich besonders für Hörer mit technischem Hintergrund, die über die täglichen Produktankündigungen hinausblicken möchten. Ein umfangreiches Archiv erleichtert die Suche nach Themen.",
      ),
      tags: ["podcast", "machine-learning", "forschung", "interviews"],
      sourceName: "TWIML",
      sourceUrl: "https://twimlai.com/podcast/twimlai/",
      imageUrl: asset("podcast-twiml"),
      relevanceScore: 80,
    },
    {
      title: "Hard Fork: Tech und KI jede Woche eingeordnet",
      summary:
        "Kevin Roose und Casey Newton diskutieren im Podcast der New York Times die wichtigsten Entwicklungen aus dem Silicon Valley – mit viel Fokus auf künstliche Intelligenz.",
      content: p(
        "Hard Fork verbindet Nachrichten mit Einordnung und Humor. Kevin Roose, Tech-Kolumnist der New York Times, und Casey Newton, Gründer des Newsletters Platformer, besprechen jede Woche, was in der Tech-Welt passiert ist – und was es für Gesellschaft, Arbeit und Politik bedeutet.",
        "KI ist dabei ein Dauerthema: Interviews mit Führungskräften großer KI-Labore, Selbstversuche mit neuen Tools und Diskussionen über Regulierung und Sicherheit wechseln sich ab.",
        "Für alle, die nicht jede technische Detailfrage verfolgen, aber verstehen wollen, warum bestimmte Entwicklungen wichtig sind, ist Hard Fork ein unterhaltsamer Wochenüberblick.",
      ),
      tags: ["podcast", "tech-news", "gesellschaft", "interviews"],
      sourceName: "The New York Times",
      sourceUrl: "https://www.nytimes.com/column/hard-fork",
      imageUrl: asset("news-openai-phone"),
      relevanceScore: 78,
    },
  ],

  videos: [
    {
      title: "Let's build GPT: Ein Sprachmodell von Grund auf programmieren",
      summary:
        "In knapp zwei Stunden baut Andrej Karpathy einen kleinen GPT in Python und PyTorch – Zeile für Zeile erklärt, vom Tokenizer bis zum Self-Attention-Block.",
      content: p(
        "Andrej Karpathy, Mitgründer von OpenAI und früherer KI-Chef bei Tesla, gilt als einer der besten Erklärer im Bereich Deep Learning. In diesem Video entwickelt er live ein generatives Sprachmodell nach dem Vorbild von GPT.",
        "Ausgangspunkt ist ein kleiner Datensatz mit Shakespeare-Texten. Schritt für Schritt entstehen Tokenisierung, ein erstes Bigramm-Modell, Self-Attention, Multi-Head-Attention, Feed-Forward-Schichten und schließlich ein vollständiger Transformer, der neuen „Shakespeare“-Text erzeugt.",
        "Wer grundlegende Python-Kenntnisse mitbringt, versteht danach, was in großen Sprachmodellen tatsächlich passiert. Der zugehörige Code ist öffentlich verfügbar und lädt zum Experimentieren ein.",
      ),
      tags: ["video", "transformer", "gpt", "pytorch", "deep-learning"],
      sourceName: "YouTube – Andrej Karpathy",
      ...youtube("kCc8FmEb1nY"),
      relevanceScore: 94,
    },
    {
      title: "Transformers visuell erklärt – 3Blue1Brown",
      summary:
        "Grant Sanderson zeigt mit seinen typischen Animationen, wie Transformer-Modelle Text verarbeiten: Tokens, Embeddings, Attention und die Vorhersage des nächsten Wortes.",
      content: p(
        "Der YouTube-Kanal 3Blue1Brown ist bekannt dafür, Mathematik mit eleganten Animationen verständlich zu machen. In diesem Kapitel seiner Deep-Learning-Reihe widmet sich Grant Sanderson der Technologie hinter modernen Sprachmodellen.",
        "Das Video erklärt, wie Text in Tokens zerlegt und in hochdimensionale Vektoren übersetzt wird, warum Richtungen in diesem Raum Bedeutung tragen und wie das Modell am Ende eine Wahrscheinlichkeitsverteilung für das nächste Token berechnet. Die folgenden Kapitel vertiefen den Attention-Mechanismus und die Rolle der MLP-Schichten.",
        "Ideal für alle, die ein intuitives Verständnis von LLMs suchen – ganz ohne Code, aber mit erstaunlich viel Tiefgang.",
      ),
      tags: ["video", "transformer", "llm", "visualisierung", "mathematik"],
      sourceName: "YouTube – 3Blue1Brown",
      ...youtube("wjZofJX0v4M"),
      relevanceScore: 90,
    },
    {
      title: "Intro to Large Language Models – der 1-Stunden-Überblick",
      summary:
        "Was ist ein LLM, wie wird es trainiert und wohin entwickelt sich die Technologie? Andrej Karpathys Vortrag für ein breites Publikum.",
      content: p(
        "In diesem einstündigen Vortrag erklärt Andrej Karpathy ohne Fachjargon, was hinter Systemen wie ChatGPT steckt. Er beschreibt ein Sprachmodell zunächst als zwei Dateien – die Parameter und den Code, der sie ausführt – und zeigt dann, wie aus riesigen Textmengen im Pretraining ein „Dokumenten-Generator“ wird.",
        "Anschließend geht es um Fine-Tuning zum hilfreichen Assistenten, um Skalierungsgesetze, den Einsatz von Werkzeugen wie Browser und Code-Interpreter sowie um die Vision von LLMs als Kern eines neuen Betriebssystems.",
        "Der letzte Teil widmet sich Sicherheitsfragen wie Jailbreaks, Prompt Injection und Data Poisoning. Ein idealer Einstieg für alle, die KI-Projekte verantworten oder verstehen wollen, wie die Technik funktioniert.",
      ),
      tags: ["video", "llm", "grundlagen", "sicherheit", "vortrag"],
      sourceName: "YouTube – Andrej Karpathy",
      ...youtube("zjkBMFhNj_g"),
      relevanceScore: 89,
    },
    {
      title: "Deep Dive into LLMs like ChatGPT: Vom Datensatz zum Assistenten",
      summary:
        "Ein über dreistündiger Deep Dive: vom Internet-Datensatz über Tokenisierung und Pretraining bis zu Reinforcement Learning und Halluzinationen.",
      content: p(
        "Mit diesem Video richtet sich Andrej Karpathy an alle, die ein vollständiges mentales Modell davon entwickeln möchten, wie Assistenten wie ChatGPT entstehen. Er folgt dem gesamten Prozess: Sammeln und Filtern von Webdaten, Tokenisierung, Training des neuronalen Netzes und Inferenz.",
        "Im zweiten Teil geht es um das Post-Training: wie aus einem Basismodell durch Supervised Fine-Tuning ein Assistent wird, warum Modelle halluzinieren, wie Werkzeugnutzung hilft und welche Rolle Reinforcement Learning für „denkende“ Modelle spielt.",
        "Trotz der Länge bleibt der Vortrag gut zugänglich – Programmierkenntnisse sind nicht nötig. Über die Kapitelmarken lassen sich einzelne Abschnitte gezielt ansehen.",
      ),
      tags: ["video", "llm", "training", "reinforcement-learning", "grundlagen"],
      sourceName: "YouTube – Andrej Karpathy",
      ...youtube("7xTGNNLPyMI"),
      relevanceScore: 87,
    },
  ],

  reads: [
    {
      title: "Building Effective Agents: Was erfolgreiche KI-Agenten ausmacht",
      summary:
        "Anthropic fasst Erfahrungen aus vielen Kundenprojekten zusammen: Einfache, kombinierbare Muster schlagen oft komplexe Frameworks.",
      content: p(
        "In diesem vielbeachteten Beitrag unterscheidet Anthropic zwischen Workflows, bei denen LLMs und Werkzeuge über fest definierte Pfade orchestriert werden, und Agenten, die ihren Lösungsweg selbst steuern. Die zentrale Empfehlung: mit der einfachsten Lösung beginnen und Komplexität nur dann hinzufügen, wenn sie messbar bessere Ergebnisse bringt.",
        "Der Artikel beschreibt bewährte Bausteine wie Prompt Chaining, Routing, Parallelisierung, Orchestrator-Worker-Muster sowie Evaluator-Optimizer-Schleifen – jeweils mit Beispielen, wann sie sinnvoll sind.",
        "Besonders lesenswert ist der Abschnitt über das Design von Werkzeugen: Gut dokumentierte, schwer falsch zu benutzende Tool-Schnittstellen sind für den Erfolg eines Agenten oft wichtiger als der Prompt selbst.",
      ),
      tags: ["agents", "anthropic", "architektur", "best-practices", "workflows"],
      sourceName: "Anthropic Engineering",
      sourceUrl: "https://www.anthropic.com/engineering/building-effective-agents",
      imageUrl: asset("video-claude-code"),
      relevanceScore: 95,
    },
    {
      title: "LLM Powered Autonomous Agents – Lilian Wengs Standardwerk",
      summary:
        "Planung, Gedächtnis und Werkzeugnutzung: Der ausführliche Blogartikel ordnet die Bausteine autonomer Agenten systematisch ein.",
      content: p(
        "Lilian Weng, damals Forscherin bei OpenAI, veröffentlichte 2023 einen Überblicksartikel, der bis heute als Referenz für KI-Agenten gilt. Sie beschreibt ein Agentensystem als Zusammenspiel aus einem Sprachmodell als „Gehirn“ und drei zentralen Komponenten.",
        "Planung: Aufgaben in Teilschritte zerlegen und aus Fehlern lernen – etwa mit Chain-of-Thought, Tree of Thoughts oder ReAct. Gedächtnis: Kurzzeitgedächtnis über den Kontext und Langzeitgedächtnis über externe Vektorspeicher. Werkzeugnutzung: APIs, Suchmaschinen oder Code-Ausführung erweitern, was das Modell leisten kann.",
        "Zahlreiche Fallstudien und Literaturverweise machen den Artikel zu einem idealen Startpunkt für alle, die sich tiefer mit Agentenarchitekturen beschäftigen wollen.",
      ),
      tags: ["agents", "planung", "memory", "tool-use", "forschung"],
      sourceName: "Lil'Log",
      sourceUrl: "https://lilianweng.github.io/posts/2023-06-23-agent/",
      imageUrl: asset("news-mit-10things"),
      relevanceScore: 88,
    },
    {
      title: "Attention Is All You Need: Das Paper hinter dem KI-Boom",
      summary:
        "2017 stellten Forschende von Google die Transformer-Architektur vor. Fast jedes heutige Sprachmodell baut auf dieser Idee auf.",
      content: p(
        "Mit dem Paper „Attention Is All You Need“ präsentierten Ashish Vaswani und Kollegen eine Architektur, die vollständig auf rekurrente und konvolutionale Schichten verzichtete. Stattdessen setzte der Transformer auf Self-Attention: Jedes Wort einer Sequenz kann direkt auf alle anderen Wörter Bezug nehmen.",
        "Ursprünglich für maschinelle Übersetzung entwickelt, hatte der Ansatz zwei entscheidende Vorteile: Er erfasste weitreichende Zusammenhänge besser und ließ sich deutlich effizienter parallel auf GPUs trainieren. Genau diese Skalierbarkeit machte später Modelle wie BERT, GPT und ihre Nachfolger möglich.",
        "Das Paper ist erstaunlich kompakt und auch heute noch lesenswert – insbesondere die Abschnitte zu Multi-Head-Attention und Positional Encoding, die in nahezu jedem modernen LLM weiterleben.",
      ),
      tags: ["transformer", "attention", "paper", "forschung", "grundlagen"],
      sourceName: "arXiv",
      sourceUrl: "https://arxiv.org/abs/1706.03762",
      imageUrl: asset("read-mit"),
      relevanceScore: 90,
    },
  ],

  image_gen: [
    {
      title: "Fotorealistische Porträts: Kamera, Objektiv und Licht im Prompt",
      summary:
        "Mit Begriffen aus der Fotografie lassen sich Bildgeneratoren präzise steuern – von der Brennweite über die Blende bis zur Lichtstimmung.",
      content: p(
        "Bildgeneratoren wie Midjourney oder Stable Diffusion wurden mit riesigen Mengen an Fotos samt Beschreibungen trainiert. Deshalb reagieren sie gut auf das Vokabular von Fotografinnen und Fotografen.",
        "Prompt-Formel:\n[Motiv], [Umgebung], fotografiert mit [Kamera], [Objektiv], [Blende], [Licht], [Stimmung]\n\nBeispiel:\nPorträt einer Fotografin in ihrem Studio, Softboxen im Hintergrund, Vollformatkamera, 85 mm Objektiv, f/1.8, weiches Fensterlicht von links, natürliche Hauttöne, ruhige Atmosphäre",
        "Tipps: Eine lange Brennweite (85–135 mm) mit offener Blende erzeugt den typischen Porträt-Look mit unscharfem Hintergrund. Lichtangaben wie „golden hour“ oder „Rembrandt-Licht“ verändern die Wirkung stärker als zusätzliche Adjektive. Und weniger ist oft mehr – widersprüchliche Stilangaben verwässern das Ergebnis.",
      ),
      tags: ["image-generation", "fotografie", "prompt-engineering", "porträt", "midjourney"],
      sourceName: "Midjourney Docs",
      sourceUrl: "https://docs.midjourney.com/",
      imageUrl: asset("imgen-photography"),
      relevanceScore: 88,
    },
    {
      title: "Konsistente Fantasy-Welten mit Stil-Referenzen",
      summary:
        "Statt den Stil jedes Mal neu zu beschreiben, übertragen Stil-Referenzen die Ästhetik eines Beispielbildes auf neue Motive – ideal für Serien und Storyboards.",
      content: p(
        "Wer eine Bildserie erstellt – etwa Illustrationen für ein Buch oder Konzeptkunst für ein Spiel – kämpft oft mit Inkonsistenz: Jedes neue Bild sieht ein wenig anders aus. Stil-Referenzen lösen dieses Problem. In Midjourney wird dazu ein Referenzbild über den Parameter --sref angegeben, dessen Farbpalette, Lichtstimmung und Pinselführung auf neue Motive übertragen werden.",
        "Beispiel:\nEin Drache wacht über einer Turmruine im Gebirge, Sturmwolken, dramatisches Gegenlicht --sref [Bild-URL] --ar 16:9",
        "Über das Stilgewicht lässt sich steuern, wie stark die Referenz das Ergebnis prägt. Kombiniert mit einer festen Beschreibung für wiederkehrende Figuren entstehen stimmige Serien, die wie aus einem Guss wirken.",
      ),
      tags: ["image-generation", "midjourney", "fantasy", "stil", "konsistenz"],
      sourceName: "Midjourney Docs",
      sourceUrl: "https://docs.midjourney.com/",
      imageUrl: asset("imgen-fantasy"),
      relevanceScore: 85,
    },
    {
      title: "Negative Prompts und Seeds in Stable Diffusion",
      summary:
        "Zwei unterschätzte Stellschrauben: Negative Prompts schließen unerwünschte Elemente aus, feste Seeds machen Ergebnisse reproduzierbar.",
      content: p(
        "Bei offenen Bildmodellen wie Stable Diffusion hat man mehr Kontrolle als bei vielen Web-Diensten. Zwei Werkzeuge sind dabei besonders hilfreich.",
        "Negative Prompts beschreiben, was nicht im Bild auftauchen soll – etwa „unscharf, verzerrte Hände, Text, Wasserzeichen, Überbelichtung“. Statt das Positive immer weiter zu präzisieren, lenkt man das Modell so gezielt von typischen Fehlern weg.",
        "Der Seed bestimmt das Ausgangsrauschen, aus dem das Bild entsteht. Mit gleichem Seed und gleichen Einstellungen erhält man dasselbe Ergebnis – ideal, um einzelne Wörter im Prompt zu verändern und deren Wirkung zu vergleichen. In der Bibliothek diffusers von Hugging Face werden dafür negative_prompt und ein torch.Generator mit festem Seed übergeben.",
      ),
      tags: ["stable-diffusion", "negative-prompt", "seed", "diffusers", "image-generation"],
      sourceName: "Hugging Face Diffusers",
      sourceUrl: "https://huggingface.co/docs/diffusers/index",
      imageUrl: asset("read-prompts"),
      relevanceScore: 82,
      status: "draft",
    },
  ],
};

/** Rotations-Pool: zusätzliche (Nicht-Standard-)Quellen, die in Läufen wechseln. */
export const DEMO_ROTATING_SOURCES: Partial<Record<Category, { name: string; url: string }[]>> = {
  news: [
    { name: "The Decoder", url: "https://the-decoder.de/" },
    { name: "heise online – KI", url: "https://www.heise.de/thema/Kuenstliche-Intelligenz" },
    { name: "t3n – Künstliche Intelligenz", url: "https://t3n.de/tag/kuenstliche-intelligenz/" },
  ],
  tools: [{ name: "GitHub – ollama/ollama", url: "https://github.com/ollama/ollama" }],
  tutorials: [{ name: "GitHub – open-webui/open-webui", url: "https://github.com/open-webui/open-webui" }],
};

/** Zusätzlich per Web-Grounding entdeckte Quellen (neben den Artikel-Quellen). */
export const DEMO_EXTRA_DISCOVERED: Partial<Record<Category, string[]>> = {
  news: ["https://www.wired.com/tag/artificial-intelligence/", "https://the-decoder.de/"],
  tools: ["https://github.com/ollama/ollama"],
  tutorials: ["https://github.com/open-webui/open-webui"],
};

/**
 * Der Demo-Batch („Alle ausführen“): ein Lauf je Kategorie, nacheinander
 * abgearbeitet. Gefunden = gespeichert + Duplikate (wie in der echten Engine).
 */
export const DEMO_BATCH: DemoRunPlan[] = [
  { category: "news", durationSec: 74, duplicates: 2 },
  { category: "tools", durationSec: 61, duplicates: 1 },
  { category: "prompts", durationSec: 48, duplicates: 1 },
  { category: "tutorials", durationSec: 112, duplicates: 0, repetitions: 2, failedReps: [1] },
  { category: "podcasts", durationSec: 52, duplicates: 1 },
  { category: "videos", durationSec: 44, duplicates: 1 },
  { category: "reads", durationSec: 57, duplicates: 1 },
  { category: "image_gen", durationSec: 46, duplicates: 0 },
];

/** Realistische Fehlermeldung nach ausgeschöpften Retries (Gemini Free-Tier). */
export const DEMO_RATE_LIMIT_ERROR =
  'API 429 (retry): {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits."';
