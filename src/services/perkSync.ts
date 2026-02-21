/**
 * Perk Sync Service - Handles GitHub sync with caching
 * Fetches perks from GitHub and caches them in localStorage
 */

import type { PerkDatabase, PerkCache } from '@/types/perks';
import { loadBundledPerks } from '@/data/perkLoader';

// Configuration
const GITHUB_REPO = 'BigScaryGames/ExceedV';
const GITHUB_BRANCH = 'main';
const GITHUB_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/source/content/Perks`;

const CACHE_KEY = 'exceed-perks-cache';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Check if cache exists and is still valid
 */
function getCachedPerks(): PerkDatabase | null {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return null;

    const cache: PerkCache = JSON.parse(cacheStr);

    // Check if cache is expired
    if (Date.now() > cache.expiresAt) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cache.database;
  } catch (error) {
    console.error('Error reading perk cache:', error);
    return null;
  }
}

/**
 * Save perks to cache
 */
function cachePerks(database: PerkDatabase): void {
  try {
    const cache: PerkCache = {
      database,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION_MS,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching perks:', error);
  }
}

/**
 * Load perks with hybrid strategy:
 * 1. Try cached perks from localStorage
 * 2. Fall back to bundled perks
 * 3. Async fetch from GitHub in background
 */
export async function loadPerks(): Promise<PerkDatabase> {
  // Try cache first
  const cached = getCachedPerks();
  if (cached) {
    console.log('[PerkSync] Using cached perks from localStorage');

    // Trigger background update check (don't await)
    checkForUpdates(cached).catch(err =>
      console.error('[PerkSync] Background update check failed:', err)
    );

    return cached;
  }

  // Fall back to bundled perks
  console.log('[PerkSync] Loading bundled perks');
  const bundled = await loadBundledPerks();

  if (!bundled) {
    throw new Error('Failed to load perks: bundled data not available');
  }

  // Trigger background GitHub fetch (don't await)
  fetchFromGitHub()
    .then(github => {
      if (github && isNewerVersion(github, bundled)) {
        console.log('[PerkSync] GitHub perks are newer, caching');
        cachePerks(github);
      } else {
        console.log('[PerkSync] Bundled perks are current, caching');
        cachePerks(bundled);
      }
    })
    .catch(err => console.error('[PerkSync] GitHub fetch failed:', err));

  return bundled;
}

/**
 * Check if GitHub has newer perks
 */
async function checkForUpdates(currentDatabase: PerkDatabase): Promise<void> {
  console.log('[PerkSync] Checking for updates from GitHub');

  const github = await fetchFromGitHub();
  if (!github) {
    console.log('[PerkSync] GitHub fetch failed, keeping current perks');
    return;
  }

  if (isNewerVersion(github, currentDatabase)) {
    console.log('[PerkSync] Newer perks available, updating cache');
    cachePerks(github);

    // Optionally: dispatch event to notify UI of update
    window.dispatchEvent(new CustomEvent('perks-updated', { detail: github }));
  } else {
    console.log('[PerkSync] Current perks are up-to-date');
  }
}

/**
 * Compare versions to determine which is newer
 */
function isNewerVersion(github: PerkDatabase, current: PerkDatabase): boolean {
  return github.lastUpdated > current.lastUpdated;
}

/**
 * Fetch perks from GitHub
 * This is a simplified version - in production you'd fetch the file list
 * and parse individual markdown files
 */
async function fetchFromGitHub(): Promise<PerkDatabase | null> {
  try {
    // For now, we'll just indicate that GitHub fetching is available
    // but not fully implemented (would require fetching all .md files)
    console.log('[PerkSync] GitHub fetch not yet fully implemented');
    console.log('[PerkSync] Would fetch from:', GITHUB_BASE_URL);

    // In a full implementation, you would:
    // 1. Fetch file list from GitHub API
    // 2. Fetch each .md file
    // 3. Parse markdown content
    // 4. Build PerkDatabase object

    return null;
  } catch (error) {
    console.error('[PerkSync] Error fetching from GitHub:', error);
    return null;
  }
}

/**
 * Force refresh perks from GitHub
 */
export async function refreshPerks(): Promise<PerkDatabase | null> {
  console.log('[PerkSync] Force refreshing perks from GitHub');

  const github = await fetchFromGitHub();
  if (github) {
    cachePerks(github);
    window.dispatchEvent(new CustomEvent('perks-updated', { detail: github }));
    return github;
  }

  return null;
}

/**
 * Clear perk cache
 */
export function clearPerkCache(): void {
  localStorage.removeItem(CACHE_KEY);
  console.log('[PerkSync] Cache cleared');
}

/**
 * Get cache info for debugging
 */
export function getCacheInfo(): {
  hasCached: boolean;
  timestamp?: number;
  expiresAt?: number;
  version?: string;
} {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return { hasCached: false };

    const cache: PerkCache = JSON.parse(cacheStr);
    return {
      hasCached: true,
      timestamp: cache.timestamp,
      expiresAt: cache.expiresAt,
      version: cache.database.version,
    };
  } catch (error) {
    return { hasCached: false };
  }
}
