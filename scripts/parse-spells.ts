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
type SpellType = 'basic' | 'advanced';

interface ParsedSpell {
  id: string;
  name: string;
  tier: SpellTier;
  type: SpellType;
  apCost: string;
  attributes: string;
  traits: string[];
  shortDescription: string;
  basic: {
    limitCost: number;
    effect: string;
    distance?: string;
    damage?: string;
  };
  advanced?: {
    limitCost: number | string;  // Can be "Self 0 / Party 1" format
    effect: string;
    distance?: string;
    damage?: string;
  };
  description?: string;
  duration?: string;
}

interface SpellDatabase {
  version: string;
  lastUpdated: number;
  spells: ParsedSpell[];
}

// Configuration
const LOCAL_SPELLS_PATH = '/home/r/Exceed/ExceedV/Ruleset/Spells';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'spells.json');

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
 * Parse type field (Basic, Advanced, Basic/Advanced)
 */
function parseType(text: string): SpellType {
  const lower = text.toLowerCase();
  if (lower.includes('advanced')) return 'advanced';
  return 'basic';
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
    // MS5: Extract name from filename (without .md extension)
    const name = filename.replace(/\.md$/, '').trim();
    if (!name) return null;

    // Parse header fields
    const tierMatch = content.match(/\*\*Tier:\*\*\s*(.+?)$/m);
    const typeMatch = content.match(/\*\*Type:\*\*\s*(.+?)$/m);
    const apCostMatch = content.match(/\*\*AP Cost:\*\*\s*(.+?)$/m);
    const attributesMatch = content.match(/\*\*Attributes:\*\*\s*(.+?)$/m);
    const traitsMatch = content.match(/\*\*Traits:\*\*\s*(.+?)$/m);

    // Parse short description
    const shortDescMatch = content.match(/##\s+Short Description\s*\n([\s\S]*?)(?=\n##|$)/);

    // Parse basic version
    const basicMatch = content.match(/##\s+Basic Version\s*\n([\s\S]*?)(?=\n##|$)/);
    let basicLimitCost = 0;
    let basicEffect = '';
    let basicDistance: string | undefined;
    let basicDamage: string | undefined;

    if (basicMatch) {
      const basicSection = basicMatch[1];
      const limitMatch = basicSection.match(/\*\*Limit Cost:\*\*\s*(.+?)$/m);
      const effectMatch = basicSection.match(/\*\*Effect:\*\*\s*(.+?)$/m);
      const distanceMatch = basicSection.match(/\*\*Distance\*?\*?:?\*?\*?\s*(.+?)$/m);
      const damageMatch = basicSection.match(/\*\*Damage:\*\*\s*(.+?)$/m);

      if (limitMatch) {
        const parsed = parseLimitCost(limitMatch[1].trim());
        basicLimitCost = typeof parsed === 'number' ? parsed : 0;
      }
      if (effectMatch) basicEffect = effectMatch[1].trim();
      if (distanceMatch) basicDistance = distanceMatch[1].trim();
      if (damageMatch) basicDamage = damageMatch[1].trim();
    }

    // Parse advanced version (optional)
    const advancedMatch = content.match(/##\s+Advanced Version\s*\n([\s\S]*?)(?=\n##|$)/);
    let advanced: ParsedSpell['advanced'] | undefined;

    if (advancedMatch) {
      const advSection = advancedMatch[1];
      const limitMatch = advSection.match(/\*\*Limit Cost:\*\*\s*(.+?)$/m);
      const effectMatch = advSection.match(/\*\*Effect:\*\*\s*(.+?)$/m);
      const distanceMatch = advSection.match(/\*\*Distance\*?\*?:?\*?\*?\s*(.+?)$/m);
      const damageMatch = advSection.match(/\*\*Damage:\*\*\s*(.+?)$/m);

      advanced = {
        limitCost: limitMatch ? parseLimitCost(limitMatch[1].trim()) : 0,
        effect: effectMatch ? effectMatch[1].trim() : '',
        distance: distanceMatch ? distanceMatch[1].trim() : undefined,
        damage: damageMatch ? damageMatch[1].trim() : undefined,
      };
    }

    // Parse description (optional)
    const descriptionMatch = content.match(/##\s+Description\s*\n([\s\S]*?)(?=\n##|\n\*\*Duration|$)/);

    // Parse duration (optional, at the end)
    const durationMatch = content.match(/\*\*Duration:\*\*\s*(.+?)$/m);

    const spell: ParsedSpell = {
      id: filenameToId(filename),
      name,
      tier: tierMatch ? parseTier(tierMatch[1].trim()) : 0,
      type: typeMatch ? parseType(typeMatch[1].trim()) : 'basic',
      apCost: apCostMatch ? apCostMatch[1].trim() : '-',
      attributes: attributesMatch ? attributesMatch[1].trim() : '-',
      traits: traitsMatch ? parseTraits(traitsMatch[1].trim()) : [],
      shortDescription: shortDescMatch ? shortDescMatch[1].trim() : '',
      basic: {
        limitCost: basicLimitCost,
        effect: basicEffect,
        distance: basicDistance,
        damage: basicDamage,
      },
      advanced,
      description: descriptionMatch ? descriptionMatch[1].trim().replace(/^\[|\]$/g, '') : undefined,
      duration: durationMatch ? durationMatch[1].trim() : undefined,
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
