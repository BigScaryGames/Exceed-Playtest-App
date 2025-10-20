#!/usr/bin/env tsx
/**
 * Perk Parser - Build-time script
 * Parses EXCEED perk markdown files from the ruleset and generates perks.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

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

// Configuration
const RULESET_PATH = '/home/rvh/Obsidian/ExceedV/Ruleset/Perks';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'perks.json');

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

  // Split by commas
  const parts = text.split(',').map(p => p.trim());

  for (const part of parts) {
    // Check for domain requirements (e.g., SH1, OH2)
    if (/^(SH|OH|1H|TH|2H|AR|SP|SaS|ST)\d+$/i.test(part)) {
      result.domains = result.domains || [];
      result.domains.push(part.toUpperCase());
    }
    // Check for skill requirements (e.g., "Medicine 2", "Biology 2/History 2")
    else if (/[A-Z][a-z]+\s+\d+/.test(part)) {
      result.skills = result.skills || [];
      result.skills.push(part);
    }
    // Check for special requirements (e.g., "GM permission")
    else if (part.toLowerCase().includes('gm') || part.toLowerCase().includes('permission')) {
      result.special = result.special || [];
      result.special.push(part);
    }
    // Otherwise treat as perk prerequisite
    else {
      result.perks = result.perks || [];
      result.perks.push(part);
    }
  }

  return result;
}

/**
 * Parse attributes field (e.g., "MG/EN+SH" -> ["Might", "Endurance", "Shield"])
 */
function parseAttributes(text: string): string[] {
  const attributes: string[] = [];

  // Handle special cases
  if (text === '-' || !text || text.toLowerCase().includes('any attribute')) {
    return ['Any'];
  }

  // Split by + to separate attributes from domains
  const parts = text.split('+').map(p => p.trim());

  // Parse main attributes (before +)
  const attrPart = parts[0];
  const attrCodes = attrPart.split(/[\/,]/).map(a => a.trim().toUpperCase());

  for (const code of attrCodes) {
    if (!code) continue;

    if (ATTRIBUTE_MAP[code]) {
      attributes.push(ATTRIBUTE_MAP[code]);
    } else if (DOMAIN_MAP[code]) {
      // Sometimes domain codes appear before +
      attributes.push(DOMAIN_MAP[code]);
    } else {
      console.warn(`Unknown attribute code: ${code}`);
      attributes.push(code);
    }
  }

  // Parse domain (after +)
  if (parts.length > 1) {
    const domainCode = parts[1].toUpperCase();
    if (DOMAIN_MAP[domainCode]) {
      attributes.push(DOMAIN_MAP[domainCode]);
    } else {
      console.warn(`Unknown domain code: ${domainCode}`);
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

  // Check for variable cost
  if (text.toLowerCase().includes('variable')) {
    const formulaMatch = text.match(/\((.*?)\)/);
    return {
      xp: 0,
      variable: true,
      formula: formulaMatch ? formulaMatch[1] : 'Variable',
    };
  }

  // Parse fixed cost
  const match = text.match(/(\d+)\s*XP/i);
  if (match) {
    return {
      xp: parseInt(match[1], 10),
      variable: false,
    };
  }

  console.warn(`Unable to parse cost: ${text}`);
  return { xp: 0, variable: false };
}

/**
 * Parse AP cost field
 */
function parseApCost(text: string): number | null {
  if (text === '-' || !text) {
    return null;
  }
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse tags field
 */
function parseTags(text: string): string[] {
  if (text === '-' || !text) {
    return [];
  }
  // Extract hashtags
  const tags = text.match(/#\w+/g) || [];
  return tags.map(tag => tag.substring(1)); // Remove #
}

/**
 * Parse a single perk markdown file
 */
function parsePerkFile(filePath: string, perkType: 'combat' | 'magic' | 'skill'): ParsedPerk | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract name from first heading
    const nameMatch = content.match(/^#\s+(.+?)$/m);
    if (!nameMatch) {
      console.warn(`No name found in ${filePath}`);
      return null;
    }
    const name = nameMatch[1].trim();

    // Extract header fields
    const requirementsMatch = content.match(/\*\*Requirements:\*\*\s*(.+?)$/m);
    const attributesMatch = content.match(/\*\*Attributes:\*\*\s*(.+?)$/m);
    const costMatch = content.match(/\*\*Cost:\*\*\s*(.+?)$/m);
    const apCostMatch = content.match(/\*\*AP Cost:\*\*\s*(.+?)$/m);
    const tagsMatch = content.match(/\*\*Tags:\*\*\s*(.+?)$/m);

    // Extract sections
    const shortDescMatch = content.match(/##\s+Short Description\s*\n([\s\S]*?)(?=\n##|\n\*\*|$)/);
    const effectMatch = content.match(/##\s+Effect\s*\n([\s\S]*?)(?=\n##|\n\*\*|$)/);
    const descriptionMatch = content.match(/##\s+Description\s*\n([\s\S]*?)(?=\n##|\n\*\*|$)/);

    // Validate required fields - only cost is truly required
    if (!costMatch) {
      console.warn(`Missing cost field in ${filePath}`);
      return null;
    }

    const perk: ParsedPerk = {
      id: filenameToId(path.basename(filePath)),
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
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * Recursively find all .md files in a directory
 */
function findMarkdownFiles(dir: string, skipTemplates = true): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip template files
      if (skipTemplates && entry.name.includes('Template')) {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...findMarkdownFiles(fullPath, skipTemplates));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

/**
 * Parse all perks from a directory
 */
function parsePerksFromDirectory(dir: string, perkType: 'combat' | 'magic' | 'skill'): ParsedPerk[] {
  const perks: ParsedPerk[] = [];
  const files = findMarkdownFiles(dir);

  console.log(`Parsing ${files.length} ${perkType} perk files...`);

  for (const file of files) {
    const perk = parsePerkFile(file, perkType);
    if (perk) {
      perks.push(perk);
    }
  }

  return perks;
}

/**
 * Main execution
 */
function main() {
  console.log('Starting perk parser...');
  console.log(`Ruleset path: ${RULESET_PATH}`);

  // Verify ruleset path exists
  if (!fs.existsSync(RULESET_PATH)) {
    console.error(`ERROR: Ruleset path does not exist: ${RULESET_PATH}`);
    console.error('Make sure the symlink to ExceedV/Ruleset is set up correctly.');
    process.exit(1);
  }

  // Parse perks by type
  const combatPerks = parsePerksFromDirectory(
    path.join(RULESET_PATH, 'CombatPerks'),
    'combat'
  );
  const magicPerks = parsePerksFromDirectory(
    path.join(RULESET_PATH, 'MagicPerks'),
    'magic'
  );
  const skillPerks = parsePerksFromDirectory(
    path.join(RULESET_PATH, 'SkillPerks'),
    'skill'
  );

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
main();
