import { stringifyValue, type ContentJson, type ContentSection } from "@/features/documents/content";

/**
 * Guide content arrives as loosely structured `content_json`: sub-headings are
 * plain lines inside a `content` string, lists were flattened into run-on
 * sentences, consecutive sections repeat their title, and the hero / overview
 * repeat the intro. This module turns it into a clean reading model.
 */

export type CalloutTone = "quick_answer" | "callout" | "warning";

export type ArticleBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "list"; items: string[]; variant: "dot" | "check" }
  | { kind: "steps"; items: string[] }
  | { kind: "step"; number: number; title: string; blocks: ArticleBlock[]; isLast: boolean }
  | { kind: "callout"; tone: CalloutTone; title?: string; blocks: ArticleBlock[] }
  | { kind: "table"; title?: string; columns: string[]; rows: string[][] }
  | { kind: "faq"; items: { question: string; answer: string }[] }
  | { kind: "sources"; items: { label: string; url: string }[] };

export type ArticleSection = {
  id: string;
  /** Heading shown for the section and listed in the table of contents. */
  title?: string;
  blocks: ArticleBlock[];
};

export type Article = {
  /** Standfirst taken from the hero section title. */
  headline?: string;
  lead?: string;
  sections: ArticleSection[];
};

/* -------------------------------------------------------------------------- */
/*                               Text clean-up                                */
/* -------------------------------------------------------------------------- */

function capitalizeAt(text: string, index: number) {
  return text.slice(0, index) + text.charAt(index).toUpperCase() + text.slice(index + 1);
}

/** Removes references to the internal source files the guides were written from. */
export function scrubSourceReferences(input: string) {
  let text = input
    .replace(/\s*\((?:described |listed )?in the PDF as ([^)]+)\)/g, " ($1)")
    .replace(/\s+(?:mentioned|listed|given) in the PDF/g, "")
    .replace(/\s+from the [A-Z][\w-]*(?: [\w-]+)? source files?/g, "");

  text = text.replace(
    /(^|[.!?]\s+|,\s+|\b(?:but|and|however)\s+)[Tt]he PDF (?:says|states|mentions|confirms|notes)(?: that)?:?\s+/g,
    (_match, prefix: string) => {
      const restart = prefix === "" || /[.!?]\s+$/.test(prefix);
      return restart ? `${prefix}\u0000` : prefix;
    },
  );

  // Re-capitalise sentences that previously started with "The PDF says".
  let marker = text.indexOf("\u0000");
  while (marker >= 0) {
    text = capitalizeAt(text.replace("\u0000", ""), marker);
    marker = text.indexOf("\u0000");
  }

  return text.replace(/\s+([.,;:])/g, "$1").replace(/[ \t]{2,}/g, " ").trim();
}

/** True when a short line adds at most one word to `reference`. */
function repeatsReference(text: string, reference: string) {
  const words = normalizeForCompare(text).split(" ").filter(Boolean);
  if (words.length > 12) {
    return false;
  }
  const referenceWords = new Set(normalizeForCompare(reference).split(" "));
  return words.filter((word) => !referenceWords.has(word)).length <= 1;
}

/** Cleans a guide's short description for cards and covers. */
export function cleanDescription(text: string | null | undefined) {
  return text ? scrubSourceReferences(text) : (text ?? null);
}

function normalizeForCompare(text: string) {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9à-ÿ']+/g, " ")
    .trim();
}

/* -------------------------------------------------------------------------- */
/*                            Paragraph heuristics                            */
/* -------------------------------------------------------------------------- */

const FUNCTION_WORDS = new Set(
  `a an the in on at of for from to with by and or nor but as into onto via per than then called named under
  over about between within without across through during before after near like including include includes is
  are was were be been being do does did has have had if when while where which that this these those your our
  their its his her my not no so such each every any some all both either neither versus vs same new other
  another nearest local physical official valid national regional provincial municipal competent relevant
  respective appropriate certified sworn own main central federal state public private de la del los las el y
  und der die das des von zu du le les di da do dos et en`
    .split(/\s+/)
    .filter(Boolean),
);

/** Place / nationality words are proper nouns mid-sentence, never list starts. */
const PROPER_NOUN =
  /^(Austria|Belgi|Bulgari|Croat|Cypr|Czech|Danish|Denmark|Eston|Finn|Finland|Fren|France|German|Greek|Greece|Hungar|Irish|Ireland|Ital|Latvi|Lithuan|Luxembourg|Malt|Dutch|Netherlands|Polish|Poland|Portug|Romani|Slovak|Sloven|Spain|Spanish|Swed|Europe|EU|Schengen|English|Vienna|Berlin|Paris|Madrid|Lisbon|Warsaw|Prague|Rome|Athens|Dublin|Brussels|Amsterdam|Copenhagen|Stockholm|Helsinki|Tallinn|Riga|Vilnius|Budapest|Bucharest|Sofia|Zagreb|Ljubljana|Bratislava|Valletta|Nicosia|India|UK|US|Ukrain|Turk|Pakistan|Nigeri|Philippin|Chin|Japan|Brazil)/;

const CAPITALIZED_WORD = /^[A-ZÄÖÜÉÈÁÍÓÚŁŚŻŹĆŃ][a-zäöüßéèáíóúłśżźćńçãõâêôà’'-]*,?$/;

/**
 * Repairs lists that lost their line breaks, e.g.
 * "Your passport must: Be valid for … area Have been issued … Have two pages".
 * Splits only after a colon, at a capitalised word that follows a lower-case
 * content word, and gives up if the result does not look like a list.
 */
function splitFlattenedList(paragraph: string): { lead: string; items: string[]; tail: string } | null {
  const colon = paragraph.indexOf(": ");

  if (colon < 0) {
    return null;
  }

  const lead = paragraph.slice(0, colon + 1);
  const rest = paragraph.slice(colon + 2);
  const sentenceEnd = /[.!?](\s|$)/.exec(rest);
  const region = sentenceEnd ? rest.slice(0, sentenceEnd.index + 1) : rest;
  const tail = rest.slice(region.length).trim();
  const tokens = region.split(" ");
  const groups: string[][] = [[tokens[0]]];

  for (let index = 1; index < tokens.length; index += 1) {
    const previous = tokens[index - 1];
    const token = tokens[index];
    const isBoundary =
      CAPITALIZED_WORD.test(token) &&
      token !== "I" &&
      !PROPER_NOUN.test(token) &&
      Boolean(previous) &&
      previous.charAt(0) !== previous.charAt(0).toUpperCase() &&
      !FUNCTION_WORDS.has(previous.toLowerCase().replace(/,$/, "")) &&
      !/[,;:(\-–—/&+]$/.test(previous);

    if (isBoundary) {
      groups.push([token]);
    } else {
      groups[groups.length - 1].push(token);
    }
  }

  if (groups.length < 2) {
    return null;
  }

  const items = groups.map((group) => group.join(" ").trim());

  if (items.some((item) => item.split(" ").length > 24)) {
    return null;
  }

  return { lead, items, tail };
}

const TITLE_CONNECTORS = new Set(["to", "of", "and", "for", "in", "the", "a", "an", "on", "at", "from", "with", "&", "—", "–", "-"]);
const SENTENCE_STARTERS = new Set([
  "Here", "This", "These", "There", "You", "If", "When", "Before", "After", "Once", "It", "We", "Most", "Many", "In", "For", "Each",
]);

/**
 * Splits a heading that lost its line break from the following sentence, e.g.
 * "From Your Home to Your Dorm Room Here is the actual timeline …".
 */
function splitFusedHeading(paragraph: string): [string, string] | null {
  const tokens = paragraph.split(" ");

  for (let index = 3; index <= Math.min(10, tokens.length - 2); index += 1) {
    const starter = tokens[index];
    const next = tokens[index + 1];

    if (!SENTENCE_STARTERS.has(starter) || !next || next.charAt(0) !== next.charAt(0).toLowerCase()) {
      continue;
    }

    const head = tokens.slice(0, index);
    const isTitleCase = head.every(
      (token) =>
        !/[.,;:!?]$/.test(token) &&
        (TITLE_CONNECTORS.has(token) || /^[A-ZÄÖÜÉ0-9]/.test(token)),
    );

    if (isTitleCase && /^[A-ZÄÖÜÉ]/.test(head[0]) && /^[A-ZÄÖÜÉ0-9]/.test(head[head.length - 1])) {
      return [head.join(" "), tokens.slice(index).join(" ")];
    }
  }

  return null;
}

function isSubheading(paragraph: string, isLast: boolean) {
  const text = paragraph.trim();

  if (isLast || text.length < 3 || text.length > 70) {
    return false;
  }

  if (/[.!?;,:]$/.test(text) || text.split(/\s+/).length > 10) {
    return false;
  }

  // "Method 2: Use an agency" is a heading; "Search: Foo + city" is not.
  const colon = text.indexOf(": ");
  if (colon >= 0 && !/^(Step|Phase|Method|Option|Part|Stage|Route|Path)\b/i.test(text)) {
    return false;
  }

  const first = text.charAt(0);
  return first === first.toUpperCase() && /[A-Z0-9ÄÖÜÉ]/.test(first);
}

/** Splits a `content` string into paragraph, sub-heading and list blocks. */
export function parseContent(content: string): ArticleBlock[] {
  const paragraphs = scrubSourceReferences(content)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  const blocks: ArticleBlock[] = [];

  paragraphs.forEach((paragraph, index) => {
    const isLast = index === paragraphs.length - 1;
    const bulletLines = paragraph.split(/\s(?=[•▪◦]\s)/);

    if (bulletLines.length > 1) {
      const [lead, ...items] = bulletLines;
      if (lead.trim() && !/^[•▪◦]/.test(lead)) {
        blocks.push({ kind: "paragraph", text: lead.trim() });
      }
      blocks.push({
        kind: "list",
        variant: "dot",
        items: items.map((item) => item.replace(/^[•▪◦]\s*/, "").trim()).filter(Boolean),
      });
      return;
    }

    const list = splitFlattenedList(paragraph);
    if (list) {
      blocks.push({ kind: "paragraph", text: list.lead });
      blocks.push({ kind: "list", variant: "dot", items: list.items });
      if (list.tail) {
        blocks.push({ kind: "paragraph", text: list.tail });
      }
      return;
    }

    if (isSubheading(paragraph, isLast)) {
      blocks.push({ kind: "subheading", text: paragraph });
      return;
    }

    const fused = splitFusedHeading(paragraph);
    if (fused) {
      blocks.push({ kind: "subheading", text: fused[0] });
      blocks.push({ kind: "paragraph", text: fused[1] });
      return;
    }

    blocks.push({ kind: "paragraph", text: paragraph });
  });

  return blocks;
}

/* -------------------------------------------------------------------------- */
/*                               Article builder                              */
/* -------------------------------------------------------------------------- */

const STEP_TITLE = /^Step\s*(\d+)\s*[:.—–-]\s*(.+)$/i;

function sectionItems(section: ContentSection) {
  return (Array.isArray(section.items) ? section.items : [])
    .map((item) => scrubSourceReferences(stringifyValue(item)))
    .filter(Boolean);
}

function slugify(text: string, index: number) {
  return `${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
}

export function buildArticle(
  intro: string | null | undefined,
  content: ContentJson,
  pageTitle?: string,
): Article {
  const rawSections = content.sections ?? [];
  let lead = intro ? scrubSourceReferences(intro) : undefined;
  const introKey = lead ? normalizeForCompare(lead) : "";
  const seenParagraphs = new Set<string>();
  const sections: ArticleSection[] = [];
  let headline: string | undefined;

  /** Drops paragraphs that repeat the intro or something already shown. */
  const keepBlock = (block: ArticleBlock) => {
    if (block.kind !== "paragraph") {
      return true;
    }

    const key = normalizeForCompare(block.text);
    if (key.length > 30 && (introKey.includes(key) || seenParagraphs.has(key))) {
      return false;
    }

    seenParagraphs.add(key);
    return true;
  };

  const currentSection = (title?: string) => {
    const last = sections[sections.length - 1];
    const cleanTitle = title?.trim() || undefined;

    if (last && (cleanTitle === undefined || last.title === cleanTitle)) {
      return last;
    }

    const next: ArticleSection = {
      id: slugify(cleanTitle ?? "section", sections.length),
      title: cleanTitle,
      blocks: [],
    };
    sections.push(next);
    return next;
  };

  rawSections.forEach((section, index) => {
    const type = section.type ?? "paragraph";
    const title = section.title ? scrubSourceReferences(section.title) : undefined;

    if (type === "hero") {
      headline = title;
      const heroBlocks = section.content ? parseContent(section.content).filter(keepBlock) : [];
      if (heroBlocks.length > 0) {
        currentSection(undefined).blocks.push(...heroBlocks);
      }
      return;
    }

    if (type === "faq") {
      const items = (Array.isArray(section.items) ? section.items : [])
        .map((item) => {
          const faq = (item ?? {}) as { question?: unknown; answer?: unknown };
          return {
            question: scrubSourceReferences(stringifyValue(faq.question)),
            answer: scrubSourceReferences(stringifyValue(faq.answer)),
          };
        })
        .filter((item) => item.question);
      if (items.length > 0) {
        currentSection(title ?? "Frequently asked questions").blocks.push({ kind: "faq", items });
      }
      return;
    }

    if (type === "source_links") {
      const items = (Array.isArray(section.items) ? section.items : [])
        .map((item) => {
          const source = (item ?? {}) as { label?: unknown; url?: unknown };
          const url = stringifyValue(source.url);
          return { url, label: stringifyValue(source.label) || url };
        })
        .filter((item) => item.url);
      if (items.length > 0) {
        currentSection(title ?? "Official sources").blocks.push({ kind: "sources", items });
      }
      return;
    }

    if (type === "warning" || type === "callout" || type === "quick_answer") {
      const blocks = [
        ...(section.content ? parseContent(section.content) : []),
        ...(sectionItems(section).length > 0
          ? [{ kind: "list", variant: "dot", items: sectionItems(section) } as ArticleBlock]
          : []),
      ].filter(keepBlock);
      if (blocks.length === 0) {
        return;
      }
      const host = sections[sections.length - 1] ?? currentSection(undefined);
      host.blocks.push({
        kind: "callout",
        tone: type,
        title: title && title !== host.title ? title : undefined,
        blocks,
      });
      return;
    }

    if (type === "table") {
      const columns = (Array.isArray(section.columns) ? section.columns : []).map((column) =>
        scrubSourceReferences(stringifyValue(column)),
      );
      const rows = (Array.isArray(section.rows) ? section.rows : [])
        .map((row) =>
          (Array.isArray(row) ? row : []).map((cell) => scrubSourceReferences(stringifyValue(cell))),
        )
        .filter((row) => row.some(Boolean));
      if (rows.length === 0) {
        return;
      }
      const host = currentSection(title);
      host.blocks.push({
        kind: "table",
        title: title && title !== host.title ? title : undefined,
        columns,
        rows,
      });
      return;
    }

    const stepMatch = title ? STEP_TITLE.exec(title) : null;
    const blocks: ArticleBlock[] = [];

    if (section.content) {
      blocks.push(...parseContent(section.content));
    }

    const items = sectionItems(section);
    if (items.length > 0) {
      blocks.push(
        type === "numbered_steps"
          ? { kind: "steps", items }
          : { kind: "list", items, variant: type === "checklist" ? "check" : "dot" },
      );
    }

    const kept = blocks.filter(keepBlock);

    if (stepMatch) {
      // "Step 3: …" sections become a numbered timeline inside the current section.
      const host = sections[sections.length - 1] ?? currentSection(undefined);
      host.blocks.push({
        kind: "step",
        number: Number(stepMatch[1]),
        title: stepMatch[2].trim(),
        blocks: kept,
        isLast: true,
      });
      return;
    }

    if (kept.length === 0 && index > 0 && !title) {
      return;
    }

    currentSection(title).blocks.push(...kept);
  });

  // Mark the last step of each consecutive run so the timeline rail can end.
  sections.forEach((section) => {
    section.blocks.forEach((block, index) => {
      if (block.kind === "step") {
        block.isLast = section.blocks[index + 1]?.kind !== "step";
      }
    });
  });

  // Drop a standfirst that only repeats the page title ("… List", "… 2026"),
  // and a short lead that only repeats the title or standfirst.
  if (headline && pageTitle && repeatsReference(headline, pageTitle)) {
    headline = undefined;
  }

  if (lead && [pageTitle, headline].some((reference) => reference && repeatsReference(lead!, reference))) {
    lead = undefined;
  }

  return {
    headline,
    lead,
    sections: sections.filter((section) => section.blocks.length > 0 || section.title),
  };
}

/** Sections worth listing in the table of contents. */
export function getTableOfContents(article: Article) {
  return article.sections
    .filter((section): section is ArticleSection & { title: string } => Boolean(section.title))
    .map((section) => ({ id: section.id, title: section.title }));
}

/* -------------------------------------------------------------------------- */
/*                              Inline formatting                             */
/* -------------------------------------------------------------------------- */

export type InlineSegment =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "link"; text: string; url: string };

const DOMAIN_TLDS =
  "at|be|bg|hr|cy|cz|dk|ee|fi|fr|de|gr|hu|ie|it|lv|lt|lu|mt|nl|pl|pt|ro|sk|si|es|se|eu|com|org|net|gov|int|io|info|uk|ch|no|is";

const INLINE_PATTERN = new RegExp(
  [
    // e-mail
    String.raw`[\w.+-]+@[\w-]+(?:\.[\w-]+)+`,
    // URL with scheme or www.
    String.raw`(?:https?:\/\/|www\.)[^\s<>"]+`,
    // bare domain such as bmeia.gv.at/en/embassies
    String.raw`\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:${DOMAIN_TLDS})\b(?:\/[^\s<>"]*)?`,
    // money: €722.58, € 1,308, 110 EUR, €8–15/hour
    String.raw`(?:€|£|\$)\s?\d[\d.,]*(?:\s?[–-]\s?(?:€|£|\$)?\s?\d[\d.,]*)?|\b\d[\d.,]*(?:\s?[–-]\s?\d[\d.,]*)?\s?(?:EUR|[Ee]uros?)\b`,
    // durations: 3 days, 8–12 weeks, 90 calendar days
    String.raw`\b\d+(?:[–-]\d+)?\s(?:calendar |working |business )?(?:days?|weeks?|months?|years?|hours?)\b`,
  ].join("|"),
  "g",
);

function toUrl(raw: string) {
  if (raw.includes("@") && !raw.includes("/")) {
    return `mailto:${raw}`;
  }

  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/** Splits text into plain, emphasised (amounts, deadlines) and link segments. */
export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    let value = match[0];
    const start = match.index ?? 0;

    if (start < cursor) {
      continue;
    }

    // Trailing punctuation belongs to the sentence, not the match.
    const trailing = /[.,;:)]+$/.exec(value);
    if (trailing) {
      value = value.slice(0, -trailing[0].length);
    }

    if (start > cursor) {
      segments.push({ kind: "text", text: text.slice(cursor, start) });
    }

    const isLink = /@|\/\/|^www\.|\.[a-z]{2,}(?:\/|$)/i.test(value) && !/^(?:€|£|\$|\d)/.test(value);
    segments.push(isLink ? { kind: "link", text: value, url: toUrl(value) } : { kind: "strong", text: value });
    cursor = start + value.length;
  }

  if (cursor < text.length) {
    segments.push({ kind: "text", text: text.slice(cursor) });
  }

  return segments;
}

/** Word count across the reading model, for the "min read" estimate. */
export function countArticleWords(article: Article) {
  const words = (text?: string) => (text ? text.split(/\s+/).filter(Boolean).length : 0);
  const blockWords = (block: ArticleBlock): number => {
    switch (block.kind) {
      case "paragraph":
      case "subheading":
        return words(block.text);
      case "list":
      case "steps":
        return block.items.reduce((sum, item) => sum + words(item), 0);
      case "step":
      case "callout":
        return words(block.title) + block.blocks.reduce((sum, child) => sum + blockWords(child), 0);
      case "table":
        return block.rows.flat().reduce((sum, cell) => sum + words(cell), 0);
      case "faq":
        return block.items.reduce((sum, item) => sum + words(item.question) + words(item.answer), 0);
      case "sources":
        return 0;
    }
  };

  return (
    words(article.headline) +
    words(article.lead) +
    article.sections.reduce(
      (sum, section) => sum + words(section.title) + section.blocks.reduce((acc, block) => acc + blockWords(block), 0),
      0,
    )
  );
}
