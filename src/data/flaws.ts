/**
 * Flaw Loader - Handles loading flaws from bundled data
 */

export interface FlawDatabaseEntry {
  id: string;
  name: string;
  xpValue: number;
  attribute?: string;
  description: string;
  tags?: string[];
}

// Use import.meta.env.BASE_URL to get the correct base path
const BUNDLED_FLAWS_PATH = `${import.meta.env.BASE_URL}data/perks.json`;

/**
 * Load flaws from the bundled JSON file
 */
export async function loadFlawDatabase(): Promise<FlawDatabaseEntry[]> {
  try {
    const response = await fetch(BUNDLED_FLAWS_PATH);
    if (!response.ok) {
      console.error('Failed to load flaw database:', response.statusText);
      return [];
    }
    const data = await response.json();
    const database = data as { flaws?: FlawDatabaseEntry[] };
    return database.flaws || [];
  } catch (error) {
    console.error('Error loading flaw database:', error);
    return [];
  }
}

/**
 * Find a flaw by ID
 */
export function findFlawById(flaws: FlawDatabaseEntry[], id: string): FlawDatabaseEntry | undefined {
  return flaws.find(flaw => flaw.id === id);
}

/**
 * Search flaws by name, tags, or description
 */
export function searchFlaws(flaws: FlawDatabaseEntry[], query: string): FlawDatabaseEntry[] {
  const lowerQuery = query.toLowerCase();

  return flaws.filter(flaw => {
    return (
      flaw.name.toLowerCase().includes(lowerQuery) ||
      flaw.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      flaw.description.toLowerCase().includes(lowerQuery)
    );
  });
}
