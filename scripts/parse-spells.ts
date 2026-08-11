#!/usr/bin/env tsx
/**
 * Spell Parser - Build-time script
 * Parses EXCEED spell markdown files and generates spells.json
 * MS5: Updated format - name from filename, new field structure
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types matching src/types/character.ts
type SpellTier = 0 | 1 | 2 | 3 | 4 | 5;

// Prerequisite types
type PrerequisiteType = 'spell' | 'perk' | 'attribute' | 'skill' | 'domain' | 'tier';

interface Prerequisite {
  type: PrerequisiteType;
  id?: string;
  name?: string;
  attribute?: string;
  minValue?: number;
  skillName?: string;
  minLevel?: number;
  domain?: string;
  domainLevel?: number;
  minTier?: number;
}

interface SpellPrerequisites {
  requirements: Prerequisite[];
  description?: string;
}

interface ParsedSpell {
  id: string;
  name: string;
  tier: SpellTier;
  apCost: string;
  attributes: string;
  traits: string[];
  shortDescription: string;
  limitCost: number | string;
  effect: string;
  distance?: string;
  damage?: string;
  description?: string;
  duration?: string;
  prerequisites?: SpellPrerequisites;
}

interface SpellDatabase {
  version: string;
  lastUpdated: number;
  spells: ParsedSpell[];
}

// Configuration
const LOCAL_SPELLS_PATH = '/home/r/Exceed/ExceedV/source/content/Spells';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'spells.json');

/**
 * Parse prerequisites from markdown text
 * Formats:
 * - [[Spell Name]] - spell or perk requirement
 * - Medicine 1, Biology 4 - skill requirements
 * - MG 2, WI +3 - attribute requirements
 * - Martial 2, Spellcraft 3 - domain requirements
 * - — or empty - no prerequisites
 */
function parsePrerequisites(prereqText: string | undefined): SpellPrerequisites | undefined {
  if (!prereqText || prereqText.trim() === '—' || prereqText.trim() === '') {
    return undefined;
  }

  const requirements: Prerequisite[] = [];
  // Split by comma and process each requirement
  const parts = prereqText.split(',').map(p => p.trim()).filter(p => p);

  for (const part of parts) {
    // Check for wiki link [[...]] - could be spell or perk
    const wikiLinkMatch = part.match(/\[\[([^\]]+)\]\]/);
    if (wikiLinkMatch) {
      const name = wikiLinkMatch[1].trim();
      // For now, store as 'spell' type - will be resolved at runtime
      // If it doesn't match a spell, validation will check perks too
      requirements.push({
        type: 'spell',
        name,
        id: filenameToId(name)
      });
      continue;
    }

    // Check for attribute requirement: MG 2, WI +3, EN 0, etc.
    const attrMatch = part.match(/^([A-Z]{2})\s*([+-]?\d+)$/i);
    if (attrMatch) {
      const attr = attrMatch[1].toUpperCase();
      if (['MG', 'EN', 'AG', 'DX', 'WT', 'WI', 'PR', 'CH'].includes(attr)) {
        requirements.push({
          type: 'attribute',
          attribute: attr,
          minValue: parseInt(attrMatch[2], 10)
        });
        continue;
      }
    }

    // Check for domain requirement: Martial 2, Spellcraft 3
    const domainMatch = part.match(/^(Martial|Spellcraft)\s*(\d+)$/i);
    if (domainMatch) {
      requirements.push({
        type: 'domain',
        domain: domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1).toLowerCase() as 'Martial' | 'Spellcraft',
        domainLevel: parseInt(domainMatch[2], 10)
      });
      continue;
    }

    // Check for skill requirement: Medicine 1, Biology 4
    // This should come after domain check since domains are specific words
    const skillMatch = part.match(/^([A-Za-z][A-Za-z\s]*)\s*(\d+)$/);
    if (skillMatch) {
      requirements.push({
        type: 'skill',
        skillName: skillMatch[1].trim(),
        minLevel: parseInt(skillMatch[2], 10)
      });
      continue;
    }

    // If we can't parse it, skip it (could add console.warn for debugging)
    console.warn(`[parse-spells] Could not parse prerequisite: "${part}"`);
  }

  if (requirements.length === 0) {
    return undefined;
  }

  return { requirements };
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
 * Parse traits from text (e.g., "#Spell #Boon #Protection")
 */
function parseTraits(text: string): string[] {
  if (!text || text === '-') return [];
  const traits = text.match(/#\w+/g) || [];
  return traits.map(tag => tag.substring(1));
}

/**
 * Parse tier field
 */
function parseTier(text: string): SpellTier {
  const match = text.match(/(\d+)/);
  if (match) {
    const tier = parseInt(match[1], 10);
    if (tier >= 0 && tier <= 5) return tier as SpellTier;
  }
  return 0;
}

/**
 * Parse limit cost - handles numbers and special formats
 */
function parseLimitCost(text: string): number | string {
  if (!text || text === '-') return 0;

  // Handle complex formats like "Self 0 / Party 1"
  if (text.includes('/')) {
    return text.trim();
  }

  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parse spell from markdown content
 */
function parseSpellContent(filename: string, content: string): ParsedSpell | null {
  try {
    // Extract name from filename (without .md extension)
    const name = filename.replace(/\.md$/, '').trim();
    if (!name) return null;

    // Parse header fields
    const tierMatch = content.match(/\*\*Tier:\*\*\s*(.+?)$/m);
    const apCostMatch = content.match(/\*\*AP Cost:\*\*\s*(.+?)$/m);
    const attributesMatch = content.match(/\*\*Attributes:\*\*\s*(.+?)$/m);
    const traitsMatch = content.match(/\*\*Traits:\*\*\s*(.+?)$/m);

    // Parse short description
    const shortDescMatch = content.match(/##\s+Short Description\s*\n([\s\S]*?)(?=\n##|$)/);

    // Parse effect section
    const effectMatch = content.match(/##\s+Effect\s*\n([\s\S]*?)(?=\n##|$)/);
    let limitCost: number | string = 0;
    let effect = '';
    let distance: string | undefined;
    let damage: string | undefined;

    if (effectMatch) {
      const effectSection = effectMatch[1];
      const limitMatch = effectSection.match(/\*\*Limit Cost:\*\*\s*(.+?)$/m);
      const effectTextMatch = effectSection.match(/\*\*Effect:\*\*\s*(.+?)$/m);
      const distanceMatch = effectSection.match(/\*\*Distance\*?\*?:?\*?\*?\s*(.+?)$/m);
      const damageMatch = effectSection.match(/\*\*Damage:\*\*\s*(.+?)$/m);

      if (limitMatch) {
        limitCost = parseLimitCost(limitMatch[1].trim());
      }
      if (effectTextMatch) effect = effectTextMatch[1].trim();
      if (distanceMatch) distance = distanceMatch[1].trim();
      if (damageMatch) damage = damageMatch[1].trim();
    }

    // Parse description (optional)
    const descriptionMatch = content.match(/##\s+Description\s*\n([\s\S]*?)(?=\n##|\n\*\*Duration|$)/);

    // Parse duration (optional, at the end)
    const durationMatch = content.match(/\*\*Duration:\*\*\s*(.+?)$/m);

    // Parse prerequisites (optional, at the end)
    const prerequisitesMatch = content.match(/\*\*Prerequisites:\*\*\s*(.+?)$/m);
    const prerequisites = prerequisitesMatch ? parsePrerequisites(prerequisitesMatch[1].trim()) : undefined;

    const spell: ParsedSpell = {
      id: filenameToId(filename),
      name,
      tier: tierMatch ? parseTier(tierMatch[1].trim()) : 0,
      apCost: apCostMatch ? apCostMatch[1].trim() : '-',
      attributes: attributesMatch ? attributesMatch[1].trim() : '-',
      traits: traitsMatch ? parseTraits(traitsMatch[1].trim()) : [],
      shortDescription: shortDescMatch ? shortDescMatch[1].trim() : '',
      limitCost,
      effect,
      distance,
      damage,
      description: descriptionMatch ? descriptionMatch[1].trim().replace(/^\[|\]$/g, '') : undefined,
      duration: durationMatch ? durationMatch[1].trim() : undefined,
      prerequisites,
    };

    return spell;
  } catch (error) {
    console.error(`Error parsing spell ${filename}:`, error);
    return null;
  }
}

/**
 * Parse spells from local filesystem
 */
function parseSpellsFromLocal(dir: string): ParsedSpell[] {
  console.log(`Parsing spells from local filesystem: ${dir}`);
  const spells: ParsedSpell[] = [];

  if (!fs.existsSync(dir)) {
    console.error(`Spells directory not found: ${dir}`);
    return spells;
  }

  function findMarkdownFiles(directory: string): string[] {
    const files: string[] = [];
    try {
      const entries = fs.readdirSync(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        // Skip template files
        if (entry.name.includes('Template')) continue;

        if (entry.isDirectory()) {
          // Recursively search subdirectories (e.g., Rituals)
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
  console.log(`Found ${files.length} spell files`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const spell = parseSpellContent(path.basename(file), content);
    if (spell) {
      spells.push(spell);
    }
  }

  return spells;
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting spell parser (MS5)...\n');

  const spells = parseSpellsFromLocal(LOCAL_SPELLS_PATH);

  // Sort by tier, then name
  spells.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });

  // Create database object
  const database: SpellDatabase = {
    version: new Date().toISOString(),
    lastUpdated: Date.now(),
    spells,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(database, null, 2), 'utf-8');

  // Summary by tier
  const byTier = spells.reduce((acc, s) => {
    acc[s.tier] = (acc[s.tier] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  console.log('\n=== Spell Parser Complete (MS5) ===');
  console.log(`Total spells: ${spells.length}`);
  for (let tier = 0; tier <= 5; tier++) {
    if (byTier[tier]) {
      console.log(`  Tier ${tier}: ${byTier[tier]}`);
    }
  }
  console.log(`Output: ${OUTPUT_PATH}`);
}

// Run the parser
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
