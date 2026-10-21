import { BOOKLEAF_KNOWLEDGE_BASE, getContextForCategory } from "./knowledgeBase.js";

const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || "";
const AI_PROVIDER = process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai");
const MODEL_NAME = process.env.AI_MODEL || (AI_PROVIDER === "gemini" ? "gemini-1.5-flash" : AI_PROVIDER === "anthropic" ? "claude-3-haiku-20240307" : "gpt-4o-mini");

/**
 * Intelligent fallback classification based on domain keywords and intents
 */
function fallbackClassification(subject, description) {
  const combined = `${subject} ${description}`.toLowerCase();

  if (/(royalt|payout|payment|earning|bank account|money|cheque|threshold|commission)/.test(combined)) {
    return {
      category: "Royalty & Payments",
      confidence: 0.94,
      reasoning: "Query explicitly concerns royalty payouts, calculation breakdowns, or payment schedule."
    };
  }

  if (/(isbn|barcode|imprint|wrong book|duplicate isbn|metadata|asin)/.test(combined)) {
    return {
      category: "ISBN & Metadata Issues",
      confidence: 0.92,
      reasoning: "Query references ISBN discrepancies, book identification, or imprint cataloging."
    };
  }

  if (/(misprint|defect|binding|blurry|paper quality|damaged|cover tear|ink|color issue|physical copy)/.test(combined)) {
    return {
      category: "Printing & Quality",
      confidence: 0.95,
      reasoning: "Query addresses physical book printing defects, binding quality, or reprint requests."
    };
  }

  if (/(unavailable|out of stock|amazon|flipkart|stock sync|listing|distribution|buy link|delisted)/.test(combined)) {
    return {
      category: "Distribution & Availability",
      confidence: 0.91,
      reasoning: "Query reports marketplace listing status or availability sync problems."
    };
  }

  if (/(typesetting|cover design|proofread|manuscript|proof|status|timeline|stage|progress|in production)/.test(combined)) {
    return {
      category: "Book Status & Production Updates",
      confidence: 0.89,
      reasoning: "Query asks about current milestone status in the publishing pipeline."
    };
  }

  return {
    category: "General Inquiry",
    confidence: 0.82,
    reasoning: "Query relates to general platform policies, profile updates, or account questions."
  };
}

/**
 * Intelligent fallback priority scoring based on business severity
 */
function fallbackPriorityScore(subject, description, category) {
  const combined = `${subject} ${description}`.toLowerCase();

  // Critical indicators: prolonged missing money, urgent launch blocking, escalated ISBN dispute
  if (
    /(haven't received.*(?:month|year)|never received|legal|fraud|escalat|stolen|unacceptable|missing.*thousand|immediate)/.test(combined) &&
    category === "Royalty & Payments"
  ) {
    return {
      priority: "Critical",
      urgencyScore: 92,
      reasoning: "Severe royalty delay or overdue payment impacting author trust; requires immediate management resolution."
    };
  }

  // High indicators: ISBN conflicts (affects sales/distribution), defective shipment of batch copies
  if (
    category === "ISBN & Metadata Issues" ||
    /(wrong isbn|mismatch.*amazon|terrible quality|all copies defective|cannot find book)/.test(combined)
  ) {
    return {
      priority: "High",
      urgencyScore: 78,
      reasoning: "High commercial or catalog impact; catalog mismatch or batch defective print needs prompt action."
    };
  }

  // Medium indicators: General royalties question, stock sync, printing inquiry, production timeline query
  if (
    category === "Printing & Quality" ||
    category === "Distribution & Availability" ||
    category === "Book Status & Production Updates" ||
    category === "Royalty & Payments"
  ) {
    return {
      priority: "Medium",
      urgencyScore: 54,
      reasoning: "Standard operational query requiring investigation with production or distribution partners."
    };
  }

  // Low indicators: Bio edits, general queries, description tweaks
  return {
    priority: "Low",
    urgencyScore: 25,
    reasoning: "Routine informational or non-blocking metadata request."
  };
}

/**
 * Intelligent Fallback Response Drafter
 * Emulates the exact BookLeaf Support Persona matching PDF samples
 */
function fallbackDraftResponse({ authorName, book, subject, description, category }) {
  const authorFirstName = authorName ? authorName.split(" ")[0] : "Author";
  const bookTitle = book?.title ? `"${book.title}"` : "your book";
  const queryLower = `${subject} ${description}`.toLowerCase();

  let body = "";
  let actions = [];

  if (category === "Royalty & Payments") {
    if (/(not received|haven't received|overdue|months? ago|where is my royalty)/.test(queryLower)) {
      const pendingAmount = book?.royalty_pending ? `₹${book.royalty_pending.toLocaleString('en-IN')}` : "your accumulated royalties";
      body = `Dear ${authorFirstName},

I completely understand your frustration regarding your royalty payouts for ${bookTitle}, and I sincerely apologize for the delay and uncertainty this has caused.

To provide clear visibility: at BookLeaf, royalties are calculated on a quarterly cycle and disbursed within 45 days of each quarter ending, subject to our minimum payout threshold of ₹1,000. 

I have reviewed your record for ${bookTitle}. Your current pending royalty stands at ${pendingAmount}. Please ensure your bank account and PAN details are fully verified in your Author Dashboard. 

I have escalated your payout record to our Finance team with high priority to verify the dispatch batch. We will provide you with a concrete transaction update within 48 hours.

Warm regards,
BookLeaf Support Team`;
      actions = [
        "Verify bank account IFSC & account number in author profile",
        "Check quarterly payout ledger against threshold (₹1,000 minimum)",
        "Escalate to Accounts team with 48h resolution SLA"
      ];
    } else {
      // Calculation explanation
      const copiesSold = book?.total_copies_sold ?? "your recent orders";
      const totalEarned = book?.total_royalty_earned ? `₹${book.total_royalty_earned.toLocaleString('en-IN')}` : "your earnings";
      body = `Dear ${authorFirstName},

Thank you for reaching out to us. I understand you have questions regarding the royalty calculation for ${bookTitle}.

We believe in complete transparency with our authors. Under BookLeaf's 80/20 royalty model, 80% of net profit is credited directly to you. Net profit is calculated as:
[MRP - (Printing Cost + Retail Platform Commission + Shipping/Handling)]

For ${bookTitle}, you have sold ${copiesSold} copies totaling ${totalEarned} in earned royalties. Because marketplace fees vary between Amazon India, Flipkart, and global stores, margins differ across channels.

We would be glad to share a detailed line-by-line sales and royalty reconciliation statement. Please let us know if you would like our finance desk to export that spreadsheet for you.

Warm regards,
BookLeaf Support Team`;
      actions = [
        "Generate platform-wise sales reconciliation breakdown",
        "Offer detailed spreadsheet export to author"
      ];
    }
  } else if (category === "ISBN & Metadata Issues") {
    const isbn = book?.isbn || "your registered ISBN";
    body = `Dear ${authorFirstName},

Thank you for bringing this to our attention. We treat any discrepancy with ISBN data with the utmost urgency, as accurate cataloging is vital for your book's sales and discovery.

I have flagged this record for ${bookTitle} (registered ISBN: ${isbn}) directly to our Production and Cataloging leads. Discrepancies between Amazon's listing and physical imprint data are prioritized for immediate correction with Amazon's vendor catalog team.

Our team has initiated an urgent ticket with the retail distributor. We will update you with confirmation and a resolution within 48 hours.

Warm regards,
BookLeaf Production & Support Team`;
    actions = [
      "Escalate to Production/Catalog lead for Amazon catalog override",
      "Verify Bowker/Nielsen metadata feed for ISBN integrity",
      "Follow up with author within 48-hour SLA"
    ];
  } else if (category === "Printing & Quality") {
    body = `Dear ${authorFirstName},

I am truly sorry to hear that the physical copies of ${bookTitle} did not meet our quality standards. We hold our printing partners to strict benchmarks, and receiving misprinted or damaged copies is unacceptable.

Please rest assured that BookLeaf will arrange a 100% free reprint of the defective copies once verified. 

Could you please reply with 2–3 clear photos showing the defects (cover, binding, or misaligned pages)? As soon as our quality control team inspects them, we will dispatch replacement copies within 5–7 business days.

Warm regards,
BookLeaf Quality Assurance Team`;
    actions = [
      "Request photo proof of defective copies",
      "Trigger free reprint order with print facility (In-House / Repro / Epitome)",
      "Set delivery expectation of 5–7 business days post-verification"
    ];
  } else if (category === "Distribution & Availability") {
    body = `Dear ${authorFirstName},

Thank you for informing us about the listing status for ${bookTitle}. 

When a published title shows as "Currently Unavailable" on Amazon or Flipkart, it usually points to an automated inventory synchronization delay between our distributor warehouse and the marketplace fulfillment center.

I have already triggered a manual inventory re-sync with our distribution operations. These updates typically re-index and reflect live on the platform within 24 to 48 hours.

I will personally check the Amazon and Flipkart listing links tomorrow morning and confirm once it is active.

Warm regards,
BookLeaf Distribution Team`;
    actions = [
      "Trigger distributor stock re-sync with Amazon India / Flipkart",
      "Verify listing live status within 24–48 hours"
    ];
  } else if (category === "Book Status & Production Updates") {
    const currentStatus = book?.status || "In Production";
    body = `Dear ${authorFirstName},

Thank you for checking in on the progress of ${bookTitle}.

Your book is currently in the "${currentStatus}" milestone of our publishing pipeline. As a quick overview, each manuscript journeys through: Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Live Distribution.

Production at this stage requires meticulous attention to detail to ensure formatting perfection. We are reviewing the current proof files and expect to move to the next stage within 3–4 business days.

We will keep you closely informed as each milestone completes.

Warm regards,
BookLeaf Editorial & Production Team`;
    actions = [
      "Check production stage status with Typesetter / Designer",
      "Notify author of expected completion date within 3–4 days"
    ];
  } else {
    body = `Dear ${authorFirstName},

Thank you for contacting BookLeaf Author Support regarding ${bookTitle}.

I have received your inquiry: "${subject}". Our operations team is reviewing your request in accordance with our author policies. 

If this is regarding metadata updates (such as book description or author biography), please note that these typically reflect across retail channels within 3–5 business days.

We are here to support your publishing journey. Please let us know if you need any additional assistance.

Warm regards,
BookLeaf Support Team`;
    actions = [
      "Review author inquiry details",
      "Respond or route to specialized department if needed"
    ];
  }

  return {
    content: body,
    suggestedActions: actions,
    modelUsed: "BookLeaf Rule-Based Knowledge Engine (Graceful Degradation)",
    tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  };
}

function getAIConfig() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  let provider = process.env.AI_PROVIDER;
  if (!provider) {
    if (process.env.GEMINI_API_KEY) provider = "gemini";
    else if (process.env.OPENAI_API_KEY) provider = "openai";
    else provider = "fallback";
  }
  const modelName = process.env.AI_MODEL || (provider === "gemini" ? "gemini-3.5-flash" : "gpt-4o-mini");
  return { apiKey, provider, modelName };
}

/**
 * Call Google Gemini LLM with model fallback (gemini-3.5-flash -> gemini-3.5-flash-lite)
 */
async function callGemini(messages, temperature = 0.3) {
  const { apiKey } = getAIConfig();
  if (!apiKey) throw new Error("No Gemini API Key configured");

  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const userMsg = messages.filter((m) => m.role !== "system").map((m) => m.content).join("\n\n");

  const payload = {
    contents: [{ role: "user", parts: [{ text: userMsg }] }],
    generationConfig: { temperature, maxOutputTokens: 1500 }
  };
  if (systemMsg) {
    payload.systemInstruction = { parts: [{ text: systemMsg }] };
  }

  const models = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Gemini API HTTP ${response.status}`);
      }
      return {
        text: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
        modelUsed: model,
        usage: {
          prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: data.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(messages, temperature = 0.3) {
  const { apiKey, modelName } = getAIConfig();
  if (!apiKey) throw new Error("No OpenAI API Key configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName.includes("gpt") ? modelName : "gpt-4o-mini",
      messages,
      temperature,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API failed [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    modelUsed: modelName,
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  };
}

/**
 * Unified LLM Dispatcher
 */
async function callLLM(messages, temperature = 0.3) {
  const { provider, apiKey } = getAIConfig();
  if (!apiKey) {
    throw new Error("No LLM API Key configured");
  }
  if (provider === "gemini") {
    return await callGemini(messages, temperature);
  }
  return await callOpenAI(messages, temperature);
}

function parseJsonFromText(rawText) {
  if (!rawText) throw new Error("Empty text received");

  // 1. Try direct parse
  try {
    return JSON.parse(rawText.trim());
  } catch (_) {}

  // 2. Extract content from markdown block ```json ... ```
  const jsonBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const textToScan = jsonBlock ? jsonBlock[1] : rawText;

  // 3. Extract from first { to last }
  const firstBrace = textToScan.indexOf("{");
  const lastBrace = textToScan.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = textToScan.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {
      try {
        const sanitized = candidate
          .replace(/(?:\r\n|\r|\n)/g, "\\n")
          .replace(/[\u0000-\u001F]+/g, "");
        return JSON.parse(sanitized);
      } catch (e) {}
    }
  }

  throw new Error("Could not parse JSON from model output");
}

/**
 * Main AI Service Exports
 */
export const aiService = {
  /**
   * Auto-classify incoming ticket into one of the 6 canonical categories
   */
  async classifyTicket(subject, description) {
    const { apiKey } = getAIConfig();
    if (!apiKey) {
      return fallbackClassification(subject, description);
    }

    try {
      const prompt = `You are the lead operations classifier for BookLeaf Publishing.
Classify the following author support query into EXACTLY ONE of these categories:
- Royalty & Payments
- ISBN & Metadata Issues
- Printing & Quality
- Distribution & Availability
- Book Status & Production Updates
- General Inquiry

Subject: ${subject}
Description: ${description}

Respond ONLY in valid JSON matching this schema:
{
  "category": "<one of the 6 categories above>",
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<1 concise sentence explaining the classification>"
}`;

      const result = await callLLM([
        { role: "system", content: "You output only clean, valid JSON." },
        { role: "user", content: prompt }
      ], 0.1);

      const parsed = parseJsonFromText(result.text);
      if (BOOKLEAF_KNOWLEDGE_BASE.categories.includes(parsed.category)) {
        return parsed;
      }
      return fallbackClassification(subject, description);
    } catch (err) {
      console.warn("[AI Service] Auto-classification fallback invoked:", err.message);
      return fallbackClassification(subject, description);
    }
  },

  /**
   * Score ticket priority: Critical, High, Medium, Low
   */
  async scorePriority(subject, description, category, book) {
    const { apiKey } = getAIConfig();
    if (!apiKey) {
      return fallbackPriorityScore(subject, description, category);
    }

    try {
      const prompt = `You are BookLeaf Publishing's author support triage officer.
Evaluate the priority of this author query:
Categories available: Critical, High, Medium, Low.
Rules:
- Missing/delayed royalties over 3 months, missing high payouts, or acute author distress = Critical
- ISBN mismatch, bad book linked on Amazon, severe printing defect = High
- General royalty queries, stock sync issues, regular production status check = Medium
- Author bio update, minor typo, general questions = Low

Category: ${category}
Subject: ${subject}
Description: ${description}
Author Book Context: ${book ? `${book.title} (Status: ${book.status}, Pending Royalty: ₹${book.royalty_pending || 0})` : "General inquiry"}

Respond ONLY in valid JSON:
{
  "priority": "Critical" | "High" | "Medium" | "Low",
  "urgencyScore": <integer between 1 and 100>,
  "reasoning": "<1 concise sentence justifying the score>"
}`;

      const result = await callLLM([
        { role: "system", content: "You output only clean, valid JSON." },
        { role: "user", content: prompt }
      ], 0.1);

      const parsed = parseJsonFromText(result.text);
      return parsed;
    } catch (err) {
      console.warn("[AI Service] Priority scoring fallback invoked:", err.message);
      return fallbackPriorityScore(subject, description, category);
    }
  },

  /**
   * Generate an empathetic, context-aware draft response using BookLeaf Knowledge Base
   * Token-aware: Injects only the relevant policy slice for the category.
   */
  async draftResponse({ authorName, book, subject, description, category, priority }) {
    const { apiKey, modelName } = getAIConfig();
    if (!apiKey) {
      return fallbackDraftResponse({ authorName, book, subject, description, category });
    }

    try {
      const relevantPolicy = getContextForCategory(category);
      const authorFirstName = authorName ? authorName.split(" ")[0] : "Author";
      
      const bookContext = book ? `
BOOK CONTEXT:
- Title: ${book.title}
- ISBN: ${book.isbn}
- Status: ${book.status}
- Copies Sold: ${book.total_copies_sold || 0}
- Royalty Pending: ₹${book.royalty_pending || 0}
- Royalty Paid: ₹${book.royalty_paid || 0}
- Print Partner: ${book.print_partner || "In-House"}
- Available Platforms: ${book.available_on ? book.available_on.join(", ") : "None"}
` : "No specific book linked (General inquiry)";

      const systemPrompt = `You are a senior Author Support Specialist at BookLeaf Publishing.
Your responses must embody BookLeaf's core tone:
- Always empathetic, respectful, and professional. Authors are partners, not customers to manage.
- Acknowledge and validate the author's concern before presenting solutions.
- Be specific: incorporate actual numbers, dates, statuses, and calculations from the context.
- Own BookLeaf mistakes directly (e.g., delayed payments, catalog errors). Never deflect or make excuses.
- Provide clear timelines (e.g., 48 hours for escalation, 5-7 business days for reprints, 24-48 hours for stock sync).
- Conclude with clear next steps.

${relevantPolicy}
`;

      const userPrompt = `Draft an internal support response to the author.
Author Name: ${authorFirstName}
Ticket Category: ${category}
Priority: ${priority}
Subject: ${subject}
Query: ${description}
${bookContext}

Provide your response in JSON format with two keys:
{
  "content": "<The complete, professional response letter addressed to Dear ${authorFirstName}, signed by BookLeaf Support Team>",
  "suggestedActions": ["<Action 1>", "<Action 2>"]
}`;

      const result = await callLLM([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ], 0.3);

      let parsed;
      try {
        parsed = parseJsonFromText(result.text);
      } catch (e) {
        parsed = { content: result.text, suggestedActions: [] };
      }

      return {
        content: parsed.content,
        suggestedActions: parsed.suggestedActions || [],
        modelUsed: result.modelUsed || modelName,
        tokenUsage: {
          promptTokens: result.usage?.prompt_tokens || 0,
          completionTokens: result.usage?.completion_tokens || 0,
          totalTokens: result.usage?.total_tokens || 0
        }
      };
    } catch (err) {
      console.warn("[AI Service] Draft response fallback invoked:", err.message);
      return fallbackDraftResponse({ authorName, book, subject, description, category });
    }
  }
};
