// Service for fetching and caching rules from GitHub

const GITHUB_API_BASE = 'https://api.github.com/repos/BigScaryGames/ExceedV/contents';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/BigScaryGames/ExceedV/main';
const CORE_RULES_PATH = 'Ruleset/Core Rules';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = 'exceed_rules_';
const CACHE_META_KEY = 'exceed_rules_meta';
const FILE_LIST_CACHE_KEY = 'exceed_rules_filelist';

export interface RuleFile {
  name: string;
  path: string;
  download_url: string;
}

export interface CachedRule {
  content: string;
  timestamp: number;
  url: string;
}

export interface CacheMeta {
  lastFetch: number;
  files: Record<string, number>; // filename -> timestamp
}

/**
 * Get cache metadata
 */
function getCacheMeta(): CacheMeta | null {
  const metaStr = localStorage.getItem(CACHE_META_KEY);
  if (!metaStr) return null;
  try {
    return JSON.parse(metaStr);
  } catch {
    return null;
  }
}

/**
 * Update cache metadata
 */
function updateCacheMeta(filename: string, timestamp: number): void {
  const meta = getCacheMeta() || { lastFetch: 0, files: {} };
  meta.files[filename] = timestamp;
  meta.lastFetch = Date.now();
  localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta));
}

/**
 * Get cached rule content
 */
function getCachedRule(filename: string): CachedRule | null {
  const cacheKey = CACHE_PREFIX + filename;
  const cachedStr = localStorage.getItem(cacheKey);
  if (!cachedStr) return null;

  try {
    const cached: CachedRule = JSON.parse(cachedStr);
    const age = Date.now() - cached.timestamp;

    // Return cache if still valid
    if (age < CACHE_DURATION_MS) {
      return cached;
    }

    // Cache expired
    return null;
  } catch {
    return null;
  }
}

/**
 * Cache rule content
 */
function cacheRule(filename: string, content: string, url: string): void {
  const cacheKey = CACHE_PREFIX + filename;
  const cached: CachedRule = {
    content,
    timestamp: Date.now(),
    url
  };
  localStorage.setItem(cacheKey, JSON.stringify(cached));
  updateCacheMeta(filename, cached.timestamp);
}

/**
 * Fetch list of rule files from GitHub API
 */
export async function fetchRuleFileList(forceRefresh = false): Promise<RuleFile[]> {
  // Check cache first
  if (!forceRefresh) {
    const cachedList = localStorage.getItem(FILE_LIST_CACHE_KEY);
    if (cachedList) {
      try {
        const parsed = JSON.parse(cachedList);
        const age = Date.now() - parsed.timestamp;
        if (age < CACHE_DURATION_MS) {
          return parsed.files;
        }
      } catch {
        // Invalid cache, fetch fresh
      }
    }
  }

  // Fetch from GitHub API
  const url = `${GITHUB_API_BASE}/${CORE_RULES_PATH}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch file list: ${response.statusText}`);
  }

  const data = await response.json();

  // Filter for .md files only and sort
  const mdFiles: RuleFile[] = data
    .filter((file: any) => file.type === 'file' && file.name.endsWith('.md'))
    .map((file: any) => ({
      name: file.name,
      path: file.path,
      download_url: file.download_url
    }))
    .sort((a: RuleFile, b: RuleFile) => {
      // Natural sort (1, 2, 3.1, 3.2, etc.)
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

  // Cache the file list
  localStorage.setItem(FILE_LIST_CACHE_KEY, JSON.stringify({
    files: mdFiles,
    timestamp: Date.now()
  }));

  return mdFiles;
}

/**
 * Get rule content (with caching)
 * @param filename - Name of the rule file
 * @param forceRefresh - Skip cache and fetch fresh
 */
export async function getRule(filename: string, forceRefresh = false): Promise<{
  content: string;
  cached: boolean;
  timestamp: number;
}> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedRule(filename);
    if (cached) {
      return {
        content: cached.content,
        cached: true,
        timestamp: cached.timestamp
      };
    }
  }

  // Fetch from GitHub
  try {
    const url = `${GITHUB_RAW_BASE}/${CORE_RULES_PATH}/${encodeURIComponent(filename)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
    }

    const content = await response.text();

    // Cache the result
    cacheRule(filename, content, url);

    return {
      content,
      cached: false,
      timestamp: Date.now()
    };
  } catch (error) {
    // If fetch fails, try to return stale cache
    const staleCache = getCachedRule(filename);
    if (staleCache) {
      console.warn(`Using stale cache for ${filename}:`, error);
      return {
        content: staleCache.content,
        cached: true,
        timestamp: staleCache.timestamp
      };
    }

    throw error;
  }
}

/**
 * Clear all cached rules (including file list)
 */
export function clearRulesCache(): void {
  const meta = getCacheMeta();
  if (meta) {
    Object.keys(meta.files).forEach(filename => {
      const cacheKey = CACHE_PREFIX + filename;
      localStorage.removeItem(cacheKey);
    });
  }
  localStorage.removeItem(CACHE_META_KEY);
  localStorage.removeItem(FILE_LIST_CACHE_KEY);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalCached: number;
  oldestCache: number | null;
  newestCache: number | null;
  totalSize: number;
  fileListAge: number | null;
} {
  const meta = getCacheMeta();
  const fileListCache = localStorage.getItem(FILE_LIST_CACHE_KEY);
  let fileListAge: number | null = null;

  if (fileListCache) {
    try {
      const parsed = JSON.parse(fileListCache);
      fileListAge = Date.now() - parsed.timestamp;
    } catch {
      // Invalid cache
    }
  }

  if (!meta || Object.keys(meta.files).length === 0) {
    return {
      totalCached: 0,
      oldestCache: null,
      newestCache: null,
      totalSize: 0,
      fileListAge
    };
  }

  const timestamps = Object.values(meta.files);
  let totalSize = 0;

  // Calculate total size
  Object.keys(meta.files).forEach(filename => {
    const cacheKey = CACHE_PREFIX + filename;
    const item = localStorage.getItem(cacheKey);
    if (item) {
      totalSize += item.length;
    }
  });

  // Add file list cache size
  if (fileListCache) {
    totalSize += fileListCache.length;
  }

  return {
    totalCached: timestamps.length,
    oldestCache: Math.min(...timestamps),
    newestCache: Math.max(...timestamps),
    totalSize,
    fileListAge
  };
}

/**
 * Format cache age for display
 */
export function formatCacheAge(timestamp: number): string {
  const ageMs = Date.now() - timestamp;
  const ageMinutes = Math.floor(ageMs / 60000);
  const ageHours = Math.floor(ageMinutes / 60);
  const ageDays = Math.floor(ageHours / 24);

  if (ageDays > 0) {
    return `${ageDays}d ago`;
  } else if (ageHours > 0) {
    return `${ageHours}h ago`;
  } else if (ageMinutes > 0) {
    return `${ageMinutes}m ago`;
  } else {
    return 'Just now';
  }
}
