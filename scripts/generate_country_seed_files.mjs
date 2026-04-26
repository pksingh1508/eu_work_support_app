import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const categoriesSql = `insert into public.document_categories (slug, name, icon, description, sort_order)
values
  ('work-visa', 'Work Visa', 'briefcase', 'Work visa process, employer approval, work residence permits, and required documents.', 10),
  ('student-visa', 'Student Visa', 'graduation-cap', 'Student visa process, school documents, financial proof, residence permits, and student work rules.', 20),
  ('tourist-visa', 'Tourist Visa', 'passport', 'Short stay and tourist visa guidance.', 30),
  ('residence-permit', 'Residence Permit', 'id-card', 'Residence permit routes, renewal, and local administration steps.', 40),
  ('social-security', 'Social Security', 'shield-check', 'Social security numbers, public services, contributions, and healthcare access.', 50),
  ('driving-licence', 'Driving Licence', 'car', 'Foreign licence conversion, new driver applications, tests, and transport office steps.', 60),
  ('health-insurance', 'Health Insurance', 'heart-pulse', 'Travel insurance, health insurance, long-stay cover, and residence permit insurance options.', 70),
  ('education', 'Education', 'book-open', 'Universities, foreign students, English-taught programs, and study options.', 80),
  ('translation', 'Translation', 'languages', 'Sworn translation, certified translators, official registers, and document translation steps.', 90),
  ('cv-and-jobs', 'CV and Jobs', 'file-text', 'European CV, job preparation, and employment support documents.', 100),
  ('employers', 'Employers', 'building-2', 'Employer names, companies, and job-market reference lists.', 110)
on conflict (slug) do update
set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  sort_order = excluded.sort_order;`;

const countrySeeds = [
  {
    folder: 'Germany',
    output: 'germany_seed.sql',
    country: {
      slug: 'germany',
      name: 'Germany',
      code: 'DEU',
      iso2: 'DE',
      iso3: 'DEU',
      flag_emoji: '🇩🇪',
      region: 'Europe',
      subregion: 'Western Europe',
      is_eu: true,
      is_eea: true,
      is_schengen: true,
      capital: 'Berlin',
      currency_code: 'EUR',
      official_language_codes: ['de'],
      popularity_rank: 20,
      short_description: 'Germany visa, residence permit, driving licence, insurance, education, employer, and work support guidance.',
      official_immigration_url: 'https://www.bamf.de/EN/',
    },
    docs: [
      doc('German_TRC_process.txt', 'residence-permit', 'Germany Residence Permit / eAT Card', 'germany-residence-permit-eat-card', 'Complete guide for the German temporary residence card, electronic residence permit, application process, documents, costs, timelines, and renewal.', ['germany', 'residence permit', 'eat', 'trc', 'auslaenderbehoerde']),
      doc('German_driving_license.txt', 'driving-licence', 'Germany Driving Licence', 'germany-driving-licence', 'Step-by-step guide to getting or exchanging a driving licence in Germany, including documents, costs, exams, and 2026 reforms.', ['germany', 'driving licence', 'fahrschule', 'license exchange', 'tuv', 'dekra']),
      doc('Germany_insurance_company.txt', 'health-insurance', 'Germany Insurance Companies', 'germany-insurance-companies', 'Reference list of major German insurance, health insurance, reinsurance, and international insurance companies.', ['germany', 'insurance', 'health insurance', 'krankenkassen', 'companies']),
      doc('Germany_private_university.txt', 'education', 'Germany Private Universities', 'germany-private-universities', 'Reference list of private universities, business schools, universities of applied sciences, and private institutions in Germany.', ['germany', 'private universities', 'education', 'study']),
      doc('Germany_public_university.txt', 'education', 'Germany Public Universities', 'germany-public-universities', 'Reference list of public universities and universities of applied sciences in Germany.', ['germany', 'public universities', 'education', 'study']),
      doc('Germany_visa_guide.txt', 'work-visa', 'Germany Visa Document Checklist', 'germany-visa-document-checklist', 'Document checklist for German Schengen and national visa applications, including work, study, family reunion, and business routes.', ['germany', 'visa checklist', 'schengen visa', 'national visa', 'work visa', 'student visa']),
      doc('Germany_employer_detail.txt', 'employers', 'Germany Employer Details', 'germany-employer-details', 'Reference list of German companies and employers across manufacturing, logistics, construction, engineering, and related sectors.', ['germany', 'employers', 'companies', 'jobs', 'work']),
    ],
  },
  {
    folder: 'Italy',
    output: 'italy_seed.sql',
    country: {
      slug: 'italy',
      name: 'Italy',
      code: 'ITA',
      iso2: 'IT',
      iso3: 'ITA',
      flag_emoji: '🇮🇹',
      region: 'Europe',
      subregion: 'Southern Europe',
      is_eu: true,
      is_eea: true,
      is_schengen: true,
      capital: 'Rome',
      currency_code: 'EUR',
      official_language_codes: ['it'],
      popularity_rank: 30,
      short_description: 'Italy visa, residence, driving licence, sworn translation, education, insurance, employer, and work support guidance.',
      official_immigration_url: 'https://vistoperitalia.esteri.it/',
    },
    docs: [
      doc('Italy_TRC_process.txt', 'work-visa', 'Italy Visa Document Checklist', 'italy-visa-document-checklist', 'Document checklist for Italian Schengen and national visas, including elective residence, work, student, family reunification, fees, and 2026 updates.', ['italy', 'visa checklist', 'schengen visa', 'national visa', 'work visa', 'student visa']),
      doc('Italy_visa_guide.txt', 'driving-licence', 'Italy Driving Licence', 'italy-driving-licence', 'Guide to getting, exchanging, renewing, and using a driving licence in Italy, including costs, exams, and new driver rules.', ['italy', 'driving licence', 'license exchange', 'patente', 'driving school']),
      doc('Italy_sworn_translation.txt', 'translation', 'Italy Sworn Translation', 'italy-sworn-translation', 'Complete guide to sworn translations in Italy, including asseverazione, who can translate, costs, timelines, apostille, and legal distinctions.', ['italy', 'sworn translation', 'asseverazione', 'translator', 'apostille']),
      doc('Italy_insurance_company.txt', 'health-insurance', 'Italy Insurance Companies', 'italy-insurance-companies', 'Reference list of major Italian insurance, health insurance, banking-insurance, and global insurance companies active in Italy.', ['italy', 'insurance', 'health insurance', 'companies']),
      doc('Italy_private_university.txt', 'education', 'Italy Private Universities', 'italy-private-universities', 'Reference list of private universities and private higher education institutions in Italy.', ['italy', 'private universities', 'education', 'study']),
      doc('Italy_public_university.txt', 'education', 'Italy Public Universities', 'italy-public-universities', 'Reference list of major public universities in Italy by region and city.', ['italy', 'public universities', 'education', 'study']),
      doc('Italy_employer_details.txt', 'employers', 'Italy Employer Details', 'italy-employer-details', 'Reference list of Italian companies and employers across manufacturing, logistics, construction, engineering, and related sectors.', ['italy', 'employers', 'companies', 'jobs', 'work']),
    ],
  },
  {
    folder: 'Spain',
    output: 'spain_seed.sql',
    country: {
      slug: 'spain',
      name: 'Spain',
      code: 'ESP',
      iso2: 'ES',
      iso3: 'ESP',
      flag_emoji: '🇪🇸',
      region: 'Europe',
      subregion: 'Southern Europe',
      is_eu: true,
      is_eea: true,
      is_schengen: true,
      capital: 'Madrid',
      currency_code: 'EUR',
      official_language_codes: ['es'],
      popularity_rank: 40,
      short_description: 'Spain work visa, student visa, TIE, social security, driving licence, insurance, education, translation, and CV guidance.',
      official_immigration_url: 'https://www.inclusion.gob.es/web/migraciones',
    },
    docs: [
      doc('Spain_work_visa.txt', 'work-visa', 'Spain Work Visa', 'spain-work-visa', 'Complete step-by-step guide for Spain work visas, employer work permit approval, consulate documents, timelines, TIE steps, and common mistakes.', ['spain', 'work visa', 'type d', 'employer sponsorship', 'tie']),
      doc('Student_visa_guide.txt', 'student-visa', 'Spain Student Visa', 'spain-student-visa', 'Complete guide for Spain student visas, qualifying studies, family members, documents, financial proof, work rights, and TIE steps.', ['spain', 'student visa', 'study', 'type d', 'tie', 'education']),
      doc('Spain_TRC_TIE.txt', 'residence-permit', 'Spain TIE Residence Card', 'spain-tie-residence-card', 'Step-by-step guide to Spain TIE residence card process, padron, social security number, appointment booking, documents, fees, and collection.', ['spain', 'tie', 'residence card', 'trc', 'padron', 'cita previa']),
      doc('Social_Security_Number.txt', 'social-security', 'Spain Social Security Number', 'spain-social-security-number', 'Guide to Spain social security number and NUSS application process, online methods, required documents, timelines, and common mistakes.', ['spain', 'social security', 'nuss', 'seguridad social', 'workers', 'students']),
      doc('Spain_Driving_License.txt', 'driving-licence', 'Spain Driving Licence', 'spain-driving-licence', 'Guide to exchanging or getting a Spanish driving licence, including requirements, documents, medical certificate, DGT appointment, theory, practical exam, costs, and timelines.', ['spain', 'driving licence', 'license exchange', 'dgt', 'autoescuela']),
      doc('Spain_insurance_company.txt', 'health-insurance', 'Spain Health Insurance Guide', 'spain-health-insurance-guide', 'Guide to Spain health insurance options for visas, residence permits, students, expats, private insurers, and international insurance plans.', ['spain', 'health insurance', 'visa insurance', 'residence permit', 'expats']),
      doc('Spain_insurance_companies.txt', 'health-insurance', 'Spain Insurance Companies', 'spain-insurance-companies', 'Reference list of major Spanish insurance, health insurance, banking-insurance, and international insurance companies active in Spain.', ['spain', 'insurance', 'health insurance', 'companies']),
      doc('Spain_Private_University.txt', 'education', 'Spain Private Universities', 'spain-private-universities', 'Reference list of private universities and business schools in Spain for foreign students.', ['spain', 'private universities', 'education', 'study']),
      doc('Spain_public_university.txt', 'education', 'Spain Public Universities', 'spain-public-universities', 'Reference list of major public universities in Spain, including regional and technical universities.', ['spain', 'public universities', 'education', 'study']),
      doc('Sworm_translation_spain.txt', 'translation', 'Spain Sworn Translation', 'spain-sworn-translation', 'Complete guide to sworn translation in Spain, including when it is needed, MAEC-accredited translators, apostille, costs, delivery, and common mistakes.', ['spain', 'sworn translation', 'traduccion jurada', 'maec', 'apostille']),
      doc('EUROPE_cv.txt', 'cv-and-jobs', 'European CV / Europass Guide', 'european-cv-europass-guide', 'Practical guide to preparing a European CV or Europass-style resume for jobs, visas, and employer applications.', ['european cv', 'europass', 'cv', 'resume', 'jobs', 'spain']),
    ],
  },
];

function doc(file, category, title, slug, shortDescription, tags) {
  return { file, category, title, slug, shortDescription, tags };
}

function parseContent(raw, fallbackTitle) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const nonEmpty = lines.find((line) => line.trim()) || fallbackTitle;
  const sourceTitle = cleanText(nonEmpty) || fallbackTitle;
  const sections = [];
  const intro = [];
  let i = lines.findIndex((line) => line.trim());
  i += 1;

  while (i < lines.length && intro.length < 2) {
    const line = lines[i].trim();
    if (line && !isHeading(line) && !isTableLine(line)) {
      intro.push(cleanText(line));
    } else if (line && isHeading(line)) {
      break;
    }
    i += 1;
  }
  if (!intro.length) {
    for (let j = lines.findIndex((line) => line.trim()) + 1; j < lines.length && intro.length < 2; j += 1) {
      const line = lines[j].trim();
      if (!line || isHeading(line) || isTableLine(line)) {
        if (intro.length) break;
        continue;
      }
      intro.push(cleanText(line));
    }
  }

  sections.push({
    type: 'hero',
    title: sourceTitle,
    content: intro.join(' ') || sourceTitle,
  });

  const rest = lines.slice(1);
  let currentTitle = 'Overview';
  let buffer = [];

  function flush() {
    if (!buffer.length) return;
    const parsed = parseBlock(currentTitle, buffer);
    sections.push(...parsed);
    buffer = [];
  }

  for (let idx = 0; idx < rest.length; idx += 1) {
    const line = rest[idx];
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    if (isStandaloneHeading(trimmed, rest[idx + 1])) {
      flush();
      currentTitle = cleanText(trimmed);
      continue;
    }
    buffer.push(line);
  }
  flush();

  return {
    intro: intro.join(' ') || sections[0].content,
    content_json: { sections: mergeSmallParagraphs(sections) },
  };
}

function parseBlock(title, blockLines) {
  const lines = blockLines.filter((line) => line.trim());
  if (!lines.length) return [];
  if (lines.every((line) => isTableLine(line))) {
    const table = parseTable(title, lines);
    return table ? [table] : [{ type: 'paragraph', title, content: lines.map(cleanText).join('\n') }];
  }
  if (lines.some((line) => isTableLine(line))) {
    const sections = [];
    let buf = [];
    let table = [];
    for (const line of lines) {
      if (isTableLine(line)) {
        if (buf.length) {
          sections.push(...parseBlock(title, buf));
          buf = [];
        }
        table.push(line);
      } else {
        if (table.length) {
          const parsedTable = parseTable(title, table);
          sections.push(parsedTable || { type: 'paragraph', title, content: table.map(cleanText).join('\n') });
          table = [];
        }
        buf.push(line);
      }
    }
    if (table.length) {
      const parsedTable = parseTable(title, table);
      sections.push(parsedTable || { type: 'paragraph', title, content: table.map(cleanText).join('\n') });
    }
    if (buf.length) sections.push(...parseBlock(title, buf));
    return sections;
  }
  if (lines.length > 1 && lines.every((line) => isListish(line))) {
    return [{ type: title.toLowerCase().startsWith('step') ? 'numbered_steps' : 'bullet_list', title, items: lines.map(cleanText).filter(Boolean) }];
  }
  if (title.toLowerCase().includes('important') || lines.some((line) => /^important:/i.test(line.trim()))) {
    return [{ type: 'warning', title, content: lines.map(cleanText).join(' ') }];
  }
  if (title.toLowerCase().includes('faq') || lines.some((line) => /\?$/.test(line.trim()))) {
    return [{ type: 'faq', title, items: lines.map(cleanText).filter(Boolean).map((line) => ({ question: line.includes('?') ? line : title, answer: line.includes('?') ? '' : line })) }];
  }
  return [{ type: 'paragraph', title, content: lines.map(cleanText).join(' ') }];
}

function parseTable(title, lines) {
  const rows = lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .map((line) => line.slice(1, -1).split('|').map((cell) => cleanText(cell.trim())));
  const meaningful = rows.filter((row) => !row.every((cell) => /^:?-{2,}:?$/.test(cell)));
  if (meaningful.length < 2) return null;
  return {
    type: 'table',
    title,
    columns: meaningful[0],
    rows: meaningful.slice(1),
  };
}

function mergeSmallParagraphs(sections) {
  const merged = [];
  for (const section of sections) {
    const prev = merged[merged.length - 1];
    if (section.type === 'paragraph' && prev?.type === 'paragraph' && prev.title === section.title) {
      prev.content = `${prev.content}\n\n${section.content}`;
    } else {
      merged.push(section);
    }
  }
  return merged;
}

function isHeading(line) {
  return isStandaloneHeading(line);
}

function isStandaloneHeading(line, nextLine = '') {
  if (!line || isTableLine(line)) return false;
  if (/^[-*•]/.test(line)) return false;
  if (/^important:/i.test(line)) return false;
  if (line.length > 95) return false;
  if (/[:.,;]$/.test(line)) return false;
  if (/^(Step\s+\d+|Part\s+\d+|\d+\.)/i.test(line)) return true;
  if (/^(What is|Who Can|When Do|How to|Can |Costs?|Fees?|Documents?|Requirements?|Processing|Timeline|Common|Important|FAQ|Table of Contents|Step-by-Step|Main Types|Work Visa vs)/i.test(line)) return true;
  if (/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(line)) return true;
  if (nextLine && isTableLine(nextLine) && line.length <= 70) return true;
  return Boolean(nextLine && !nextLine.trim());
}

function isTableLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|');
}

function isListish(line) {
  if (/^\s{2,}\S/.test(line)) return true;
  const trimmed = line.trim();
  return /^[-*•]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed);
}

function cleanText(text) {
  return text
    .replace(/^\s*[-*•]\s*/, '')
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sqlString(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlArray(values) {
  return `array[${values.map(sqlString).join(',')}]`;
}

function bool(value) {
  return value ? 'true' : 'false';
}

function countrySql(country) {
  return `insert into public.countries (
  slug,
  name,
  code,
  iso2,
  iso3,
  flag_emoji,
  region,
  subregion,
  is_eu,
  is_eea,
  is_schengen,
  capital,
  currency_code,
  official_language_codes,
  popularity_rank,
  short_description,
  official_immigration_url,
  last_reviewed_at
)
values (
  ${sqlString(country.slug)},
  ${sqlString(country.name)},
  ${sqlString(country.code)},
  ${sqlString(country.iso2)},
  ${sqlString(country.iso3)},
  ${sqlString(country.flag_emoji)},
  ${sqlString(country.region)},
  ${sqlString(country.subregion)},
  ${bool(country.is_eu)},
  ${bool(country.is_eea)},
  ${bool(country.is_schengen)},
  ${sqlString(country.capital)},
  ${sqlString(country.currency_code)},
  ${sqlArray(country.official_language_codes)},
  ${country.popularity_rank},
  ${sqlString(country.short_description)},
  ${sqlString(country.official_immigration_url)},
  current_date
)
on conflict (slug) do update
set
  name = excluded.name,
  code = excluded.code,
  iso2 = excluded.iso2,
  iso3 = excluded.iso3,
  flag_emoji = excluded.flag_emoji,
  region = excluded.region,
  subregion = excluded.subregion,
  is_eu = excluded.is_eu,
  is_eea = excluded.is_eea,
  is_schengen = excluded.is_schengen,
  capital = excluded.capital,
  currency_code = excluded.currency_code,
  official_language_codes = excluded.official_language_codes,
  popularity_rank = excluded.popularity_rank,
  short_description = excluded.short_description,
  official_immigration_url = excluded.official_immigration_url,
  last_reviewed_at = excluded.last_reviewed_at;`;
}

function docSeedSql(seed) {
  const rows = seed.docs.map((docItem) => {
    const raw = fs.readFileSync(path.join(root, seed.folder, docItem.file), 'utf8');
    const parsed = parseContent(raw, docItem.title);
    return {
      ...docItem,
      intro: parsed.intro,
      content_json: parsed.content_json,
    };
  });

  const values = rows.map((row) => `    (
      ${sqlString(row.category)},
      ${sqlString(row.title)},
      ${sqlString(row.slug)},
      ${sqlString(row.shortDescription)},
      ${sqlString(row.intro)},
      $json$
${JSON.stringify(row.content_json, null, 2)}
$json$::jsonb,
      ${sqlArray(row.tags)},
      ${categoryOrder(row.category)},
      ${sqlString(row.file)}
    )`).join(',\n');

  return `with doc_seed as (
  select *
  from (
    values
${values}
  ) as d(category_slug, title, slug, short_description, intro, content_json, tags, sort_order, source_file)
)
insert into public.country_documents (
  country_id,
  category_id,
  title,
  slug,
  short_description,
  intro,
  content_json,
  tags,
  sort_order,
  status,
  published_at,
  last_reviewed_at,
  metadata
)
select
  c.id,
  dc.id,
  d.title,
  d.slug,
  d.short_description,
  d.intro,
  d.content_json,
  d.tags,
  d.sort_order,
  'published',
  now(),
  current_date,
  jsonb_build_object('seed_source', ${sqlString(`${seed.folder} folder txt files`)}, 'source_file', d.source_file)
from doc_seed d
join public.countries c on c.slug = ${sqlString(seed.country.slug)}
join public.document_categories dc on dc.slug = d.category_slug
on conflict (country_id, category_id, slug, language) do update
set
  title = excluded.title,
  short_description = excluded.short_description,
  intro = excluded.intro,
  content_json = excluded.content_json,
  tags = excluded.tags,
  sort_order = excluded.sort_order,
  status = excluded.status,
  published_at = excluded.published_at,
  last_reviewed_at = excluded.last_reviewed_at,
  metadata = excluded.metadata;`;
}

function categoryOrder(category) {
  return {
    'work-visa': 10,
    'student-visa': 20,
    'tourist-visa': 30,
    'residence-permit': 40,
    'social-security': 50,
    'driving-licence': 60,
    'health-insurance': 70,
    education: 80,
    translation: 90,
    'cv-and-jobs': 100,
    employers: 110,
  }[category] || 100;
}

for (const seed of countrySeeds) {
  const sql = `-- ${seed.country.name} content seed for EU Work Support.
-- Paste this whole file into the Supabase SQL Editor.
-- It upserts the ${seed.country.name} country row, required document categories, and ${seed.docs.length} country_documents.

begin;

${countrySql(seed.country)}

${categoriesSql}

${docSeedSql(seed)}

commit;
`;
  fs.writeFileSync(path.join(root, seed.folder, seed.output), sql);
  console.log(`Wrote ${seed.folder}/${seed.output}`);
}
