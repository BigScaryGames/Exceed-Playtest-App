#!/usr/bin/env tsx
/**
 * Perk Parser - Build-time script
 * Fetches EXCEED perk markdown files from GitHub and generates perks.json
 * Falls back to local symlink for development
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface ParsedPerk {
  id: string;
  name: string;
  type: 'combat' | 'magic' | 'skill';
  source: 'database';
  requirements: {
    text: string;
    skills?: string[];
    domains?: string[];
    perks?: string[];
    special?: string[];
  };
  attributes: string[];
  cost: {
    xp: number;
    variable: boolean;
    formula?: string;
  };
  apCost: number | null;
  tags: string[];
  shortDescription: string;
  effect: string;
  description?: string;
}

interface PerkDatabase {
  version: string;
  lastUpdated: number;
  perks: {
    combat: ParsedPerk[];
    magic: ParsedPerk[];
    skill: ParsedPerk[];
  };
}

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
}

// Configuration
const GITHUB_REPO = 'BigScaryGames/ExceedV';
const GITHUB_BRANCH = 'main';
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/contents/Ruleset/Perks`;
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/Ruleset/Perks`;

// Fallback to local path if available (for local development)
const LOCAL_RULESET_PATH = '/home/rvh/Obsidian/ExceedV/Ruleset/Perks';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'perks.json');

// Check if running in CI or local
const IS_CI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Attribute abbreviation mapping
const ATTRIBUTE_MAP: Record<string, string> = {
  'MG': 'Might',
  'EN': 'Endurance',
  'AG': 'Agility',
  'DX': 'Dexterity',
  'WT': 'Wit',
  'WL': 'Will',
  'WILL': 'Will',
  'WI': 'Will',
  'PR': 'Perception',
  'PER': 'Perception',
  'CH': 'Charisma',
};

// Domain abbreviation mapping
const DOMAIN_MAP: Record<string, string> = {
  'SH': 'Shield',
  'OH': 'OneHanded',
  '1H': 'OneHanded',
  'TH': 'TwoHanded',
  '2H': 'TwoHanded',
  'AR': 'Archery',
  'SP': 'Spear',
  'SAS': 'StavesAndSpears',
  'SaS': 'StavesAndSpears',
  'ST': 'Staff',
  'STEALTH': 'Stealth',
  'MD': 'Melee',
  'SPELLCRAFT': 'Spellcraft',
};

/**
 * Fetch from URL using https module
 */
function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'exceed-app-perk-parser'
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Fetch directory listing from GitHub API
 */
async function fetchGitHubDirectory(apiPath: string): Promise<GitHubFile[]> {
  const data = await fetchUrl(apiPath);
  return JSON.parse(data);
}

/**
 * Recursively fetch all markdown files from GitHub
 */
async function fetchAllMarkdownFiles(apiPath: string, rawBasePath: string, skipTemplates = true): Promise<Map<string, string>> {
  const files = new Map<string, string>();

  try {
    const entries = await fetchGitHubDirectory(apiPath);

    for (const entry of entries) {
      // Skip template files
      if (skipTemplates && entry.name.includes('Template')) {
        continue;
      }

      if (entry.type === 'dir') {
        // Recursively fetch subdirectory
        const subFiles = await fetchAllMarkdownFiles(
          `${GITHUB_API_BASE}/${entry.path.replace('Ruleset/Perks/', '')}`,
          `${rawBasePath}/${entry.name}`,
          skipTemplates
        );
        for (const [filename, content] of subFiles) {
          files.set(filename, content);
        }
      } else if (entry.type === 'file' && entry.name.endsWith('.md') && entry.download_url) {
        // Fetch markdown file content
        console.log(`  Fetching: ${entry.name}`);
        const content = await fetchUrl(entry.download_url);
        files.set(entry.name, content);
      }
    }
  } catch (error) {
    console.error(`Error fetching directory ${apiPath}:`, error);
  }

  return files;
}

/**
 * Convert filename to kebab-case ID
 */
function filenameToId(filename: string): string {
  return filename
    .replace(/\.md$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse requirements field
 */
function parseRequirements(text: string): ParsedPerk['requirements'] {
  const result: ParsedPerk['requirements'] = { text };

  if (text === '-' || !text) {
    return result;
  }

  const parts = text.split(',').map(p => p.trim());

  for (const part of parts) {
    if (/^(SH|OH|1H|TH|2H|AR|SP|SaS|ST)\d+$/i.test(part)) {
      result.domains = result.domains || [];
      result.domains.push(part.toUpperCase());
    }
    else if (/[A-Z][a-z]+\s+\d+/.test(part)) {
      result.skills = result.skills || [];
      result.skills.push(part);
    }
    else if (part.toLowerCase().includes('gm') || part.toLowerCase().includes('permission')) {
      result.special = result.special || [];
      result.special.push(part);
    }
    else {
      result.perks = result.perks || [];
      result.perks.push(part);
    }
  }

  return result;
}

/**
 * Parse attributes field
 */
function parseAttributes(text: string): string[] {
  const attributes: string[] = [];

  if (text === '-' || !text || text.toLowerCase().includes('any attribute')) {
    return ['Any'];
  }

  const parts = text.split('+').map(p => p.trim());
  const attrPart = parts[0];
  const attrCodes = attrPart.split(/[\/,]/).map(a => a.trim().toUpperCase());

  for (const code of attrCodes) {
    if (!code) continue;

    if (ATTRIBUTE_MAP[code]) {
      attributes.push(ATTRIBUTE_MAP[code]);
    } else if (DOMAIN_MAP[code]) {
      attributes.push(DOMAIN_MAP[code]);
    } else {
      attributes.push(code);
    }
  }

  if (parts.length > 1) {
    const domainCode = parts[1].toUpperCase();
    if (DOMAIN_MAP[domainCode]) {
      attributes.push(DOMAIN_MAP[domainCode]);
    } else {
      attributes.push(domainCode);
    }
  }

  return attributes;
}

/**
 * Parse cost field
 */
function parseCost(text: string): ParsedPerk['cost'] {
  if (text === '-' || !text) {
    return { xp: 0, variable: false };
  }

  if (text.toLowerCase().includes('variable')) {
    const formulaMatch = text.match(/\((.*?)\)/);
    return {
      xp: 0,
      variable: true,
      formula: formulaMatch ? formulaMatch[1] : 'Variable',
    };
  }

  const match = text.match(/(\d+)\s*XP/i);
  if (match) {
    return {
      xp: parseInt(match[1], 10),
      variable: false,
    };
  }

  return { xp: 0, variable: false };
}

/**
 * Parse AP cost field
 */
function parseApCost(text: string): number | null {
  if (text === '-' || !text) return null;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse tags field
 */
function parseTags(text: string): string[] {
  if (text === '-' || !text) return [];
  const tags = text.match(/#\w+/g) || [];
  return tags.map(tag => tag.substring(1));
}

/**
 * Parse perk from markdown content
 */
function parsePerkContent(filename: string, content: string, perkType: 'combat' | 'magic' | 'skill'): ParsedPerk | null {
  try {
    const nameMatch = content.match(/^#\s+(.+?)$/m);
    if (!nameMatch) return null;
    const name = nameMatch[1].trim();

    const requirementsMatch = content.match(/\*\*Requirements:\*\*\s*(.+?)$/m);
    const attributesMatch = content.match(/\*\*Attributes:\*\*\s*(.+?)$/m);
    const costMatch = content.match(/\*\*Cost:\*\*\s*(.+?)$/m);
    const apCostMatch = content.match(/\*\*AP Cost:\*\*\s*(.+?)$/m);
    const tagsMatch = content.match(/\*\*Tags:\*\*\s*(.+?)$/m);

    const shortDescMatch = content.match(/##\s+Short Description\s*\n([\s\S]*?)(?=\n##|\n\*\*|$)/);
    const effectMatch = content.match(/##\s+Effect\s*\n([\s\S]*?)(?=\n##|\n\*\*|$)/);
    const descriptionMatch = content.match(/##\s+Description\s*\n([\s\S]*?)(?=\n##|\n\*\*|$)/);

    if (!costMatch) return null;

    const perk: ParsedPerk = {
      id: filenameToId(filename),
      name,
      type: perkType,
      source: 'database',
      requirements: parseRequirements(requirementsMatch ? requirementsMatch[1].trim() : '-'),
      attributes: parseAttributes(attributesMatch ? attributesMatch[1].trim() : '-'),
      cost: parseCost(costMatch[1].trim()),
      apCost: parseApCost(apCostMatch ? apCostMatch[1].trim() : '-'),
      tags: parseTags(tagsMatch ? tagsMatch[1].trim() : '-'),
      shortDescription: shortDescMatch ? shortDescMatch[1].trim() : '',
      effect: effectMatch ? effectMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : undefined,
    };

    return perk;
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return null;
  }
}

/**
 * Parse perks from GitHub
 */
async function parsePerksFromGitHub(folder: string, perkType: 'combat' | 'magic' | 'skill'): Promise<ParsedPerk[]> {
  console.log(`Fetching ${perkType} perks from GitHub...`);
  const files = await fetchAllMarkdownFiles(
    `${GITHUB_API_BASE}/${folder}`,
    `${GITHUB_RAW_BASE}/${folder}`
  );

  console.log(`Parsing ${files.size} ${perkType} perk files...`);
  const perks: ParsedPerk[] = [];

  for (const [filename, content] of files) {
    const perk = parsePerkContent(filename, content, perkType);
    if (perk) {
      perks.push(perk);
    }
  }

  return perks;
}

/**
 * Parse perks from local filesystem (fallback)
 */
function parsePerksFromLocal(dir: string, perkType: 'combat' | 'magic' | 'skill'): ParsedPerk[] {
  console.log(`Parsing ${perkType} perks from local filesystem...`);
  const perks: ParsedPerk[] = [];

  function findMarkdownFiles(directory: string): string[] {
    const files: string[] = [];
    try {
      const entries = fs.readdirSync(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.name.includes('Template')) continue;

        if (entry.isDirectory()) {
          files.push(...findMarkdownFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
    }

    return files;
  }

  const files = findMarkdownFiles(dir);
  console.log(`Found ${files.length} ${perkType} perk files`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const perk = parsePerkContent(path.basename(file), content, perkType);
    if (perk) {
      perks.push(perk);
    }
  }

  return perks;
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting perk parser...');
  console.log(`CI Environment: ${IS_CI}`);

  let combatPerks: ParsedPerk[];
  let magicPerks: ParsedPerk[];
  let skillPerks: ParsedPerk[];

  if (IS_CI || !fs.existsSync(LOCAL_RULESET_PATH)) {
    // Fetch from GitHub
    console.log('Fetching perks from GitHub...\n');
    [combatPerks, magicPerks, skillPerks] = await Promise.all([
      parsePerksFromGitHub('CombatPerks', 'combat'),
      parsePerksFromGitHub('MagicPerks', 'magic'),
      parsePerksFromGitHub('SkillPerks', 'skill'),
    ]);
  } else {
    // Use local files
    console.log(`Using local ruleset: ${LOCAL_RULESET_PATH}\n`);
    combatPerks = parsePerksFromLocal(
      path.join(LOCAL_RULESET_PATH, 'CombatPerks'),
      'combat'
    );
    magicPerks = parsePerksFromLocal(
      path.join(LOCAL_RULESET_PATH, 'MagicPerks'),
      'magic'
    );
    skillPerks = parsePerksFromLocal(
      path.join(LOCAL_RULESET_PATH, 'SkillPerks'),
      'skill'
    );
  }

  // Create database object
  const database: PerkDatabase = {
    version: new Date().toISOString(),
    lastUpdated: Date.now(),
    perks: {
      combat: combatPerks,
      magic: magicPerks,
      skill: skillPerks,
    },
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(database, null, 2), 'utf-8');

  console.log('\n=== Perk Parser Complete ===');
  console.log(`Combat perks: ${combatPerks.length}`);
  console.log(`Magic perks: ${magicPerks.length}`);
  console.log(`Skill perks: ${skillPerks.length}`);
  console.log(`Total perks: ${combatPerks.length + magicPerks.length + skillPerks.length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

// Run the parser
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
