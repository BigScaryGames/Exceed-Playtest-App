import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  fetchRuleFileList,
  getRule,
  clearRulesCache,
  formatCacheAge,
  resolveObsidianEmbeds,
  convertWikilinks,
  RuleFile
} from '@/services/rulesService';

interface Section {
  id: string;
  title: string;
  content: string;  // Content before any subsections
  level: number;
  children: Section[];  // Nested subsections
}

export const RulesTab: React.FC = () => {
  const [files, setFiles] = useState<RuleFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<RuleFile | null>(null);
  const [ruleContent, setRuleContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Load file list on mount
  useEffect(() => {
    loadFileList();
  }, []);

  const loadFileList = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const fileList = await fetchRuleFileList(forceRefresh);
      setFiles(fileList);
    } catch (err) {
      setError(`Failed to load rules list: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRuleContent = async (file: RuleFile, forceRefresh = false) => {
    setSelectedFile(file);
    setIsLoading(true);
    setError(null);
    try {
      const result = await getRule(file.name, forceRefresh);
      // Resolve Obsidian embeds (![[path/to/file]])
      const resolvedContent = await resolveObsidianEmbeds(result.content);
      // Convert wikilinks [[page]] to clickable links
      const withLinks = convertWikilinks(resolvedContent);
      setRuleContent(withLinks);
      setCacheTimestamp(result.timestamp);
      setIsCached(result.cached);
    } catch (err) {
      setError(`Failed to load rule: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setRuleContent('');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking on internal rule links
  const handleRuleLink = async (href: string) => {
    if (href.startsWith('#rule:')) {
      const targetPath = decodeURIComponent(href.replace('#rule:', ''));
      console.log('Navigating to rule:', targetPath);

      // Ensure files are loaded
      let fileList = files;
      if (fileList.length === 0) {
        console.log('Files not loaded, fetching...');
        fileList = await fetchRuleFileList();
        setFiles(fileList);
      }
      console.log('Available files:', fileList.map(f => f.name));

      // Find matching file - try exact match first, then fuzzy match
      let targetFile = fileList.find(f =>
        f.name.replace('.md', '') === targetPath ||
        f.name === targetPath ||
        f.name === `${targetPath}.md`
      );
      console.log('Exact match result:', targetFile);

      // Fuzzy match: find file that ends with the target path
      if (!targetFile) {
        targetFile = fileList.find(f =>
          f.name.replace('.md', '').endsWith(targetPath) ||
          f.name.replace('.md', '').toLowerCase().includes(targetPath.toLowerCase())
        );
        console.log('Fuzzy match result:', targetFile);
      }

      if (targetFile) {
        console.log('Loading file:', targetFile.name);
        loadRuleContent(targetFile);
      } else {
        console.warn(`Rule not found: ${targetPath}`);
        console.warn('Searched in files:', fileList.map(f => f.name));
      }
    }
  };

  // Custom link component for ReactMarkdown
  const LinkRenderer = ({ href, children }: { href?: string; children?: React.ReactNode }) => {
    if (href?.startsWith('#rule:')) {
      return (
        <button
          onClick={() => handleRuleLink(href)}
          className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
        >
          {children}
        </button>
      );
    }
    // External links
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
        {children}
      </a>
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Clear cache
      clearRulesCache();

      // Reload file list
      await loadFileList(true);

      // Reload current rule if one is selected
      if (selectedFile) {
        await loadRuleContent(selectedFile, true);
      }
    } catch (err) {
      setError(`Refresh failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get display title from filename
  const getDisplayTitle = (filename: string): string => {
    return filename.replace('.md', '');
  };

  // Parse markdown into hierarchical sections based on headings
  const sections = useMemo((): Section[] => {
    if (!ruleContent) return [];

    const lines = ruleContent.split('\n');
    const rootSections: Section[] = [];
    let currentH2: Section | null = null;
    let currentH3: Section | null = null;
    let contentBuffer: string[] = [];

    const flushContent = () => {
      const content = contentBuffer.join('\n').trim();
      contentBuffer = [];
      return content;
    };

    for (const line of lines) {
      // Match ## or ### headings
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2];
        const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${rootSections.length}`;

        if (level <= 2) {
          // Save previous H3's content
          if (currentH3) {
            currentH3.content = flushContent();
          } else if (currentH2) {
            currentH2.content = flushContent();
          }
          // Save previous H2
          if (currentH2) {
            rootSections.push(currentH2);
          }
          // Start new H2
          currentH2 = { id, title, content: '', level: 2, children: [] };
          currentH3 = null;
        } else if (level === 3 && currentH2) {
          // Save previous H3's content or H2's pre-children content
          if (currentH3) {
            currentH3.content = flushContent();
          } else {
            currentH2.content = flushContent();
          }
          // Start new H3 as child of current H2
          currentH3 = { id, title, content: '', level: 3, children: [] };
          currentH2.children.push(currentH3);
        } else if (level === 4 && currentH3) {
          // H4 becomes child of H3
          const prevContent = flushContent();
          if (currentH3.children.length === 0) {
            currentH3.content = prevContent;
          } else if (currentH3.children.length > 0) {
            currentH3.children[currentH3.children.length - 1].content = prevContent;
          }
          const h4Section: Section = { id, title, content: '', level: 4, children: [] };
          currentH3.children.push(h4Section);
        } else {
          // Fallback: treat as content
          contentBuffer.push(line);
        }
      } else {
        contentBuffer.push(line);
      }
    }

    // Flush remaining content
    const remainingContent = flushContent();
    if (currentH3) {
      if (currentH3.children.length > 0) {
        currentH3.children[currentH3.children.length - 1].content = remainingContent;
      } else {
        currentH3.content = remainingContent;
      }
    } else if (currentH2) {
      currentH2.content = remainingContent;
    }

    // Push last H2
    if (currentH2) {
      rootSections.push(currentH2);
    }

    // Auto-expand first section on new content
    if (rootSections.length > 0 && expandedSections.size === 0) {
      setExpandedSections(new Set([rootSections[0].id]));
    }

    return rootSections;
  }, [ruleContent]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Recursive section renderer
  const renderSection = (section: Section, depth: number = 0) => {
    const isExpanded = expandedSections.has(section.id);
    const hasContent = section.content.length > 0;
    const hasChildren = section.children.length > 0;
    const indent = depth > 0 ? 'ml-4' : '';

    return (
      <div key={section.id} className={`border border-slate-700 rounded-lg overflow-hidden ${indent} ${depth > 0 ? 'mt-2' : ''}`}>
        {/* Section header */}
        <button
          onClick={() => toggleSection(section.id)}
          className={`w-full flex items-center justify-between p-3 hover:bg-slate-700 transition-colors text-left ${
            depth === 0 ? 'bg-slate-750' : 'bg-slate-800'
          }`}
        >
          <h2 className={`font-semibold text-white ${
            depth === 0 ? 'text-lg' : depth === 1 ? 'text-base' : 'text-sm'
          }`}>
            {section.title}
          </h2>
          {(hasContent || hasChildren) && (
            isExpanded ? (
              <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />
            ) : (
              <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
            )
          )}
        </button>

        {/* Section content (accordion) */}
        {isExpanded && (hasContent || hasChildren) && (
          <div className={`bg-slate-800 border-t border-slate-700 ${hasContent ? 'p-4' : 'p-2'}`}>
            {hasContent && (
              <div className="prose prose-invert prose-slate max-w-none text-left prose-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{ a: LinkRenderer }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            )}
            {hasChildren && (
              <div className={hasContent ? 'mt-3' : ''}>
                {section.children.map(child => renderSection(child, depth + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 h-screen flex flex-col">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Rules</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-2 rounded-lg transition-colors ${
            isRefreshing
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title="Refresh rules from GitHub"
        >
          <RefreshCw
            size={20}
            className={`text-white ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Cache status */}
      {selectedFile && cacheTimestamp && (
        <div className="text-xs text-slate-400 mb-2">
          {isCached ? 'Cached' : 'Fresh'} • Last updated: {formatCacheAge(cacheTimestamp)}
        </div>
      )}

      {/* File Selector Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Select Rule
        </label>
        {isLoading && !selectedFile ? (
          <div className="bg-slate-800 rounded-lg p-3 text-slate-400 text-center">
            Loading rules...
          </div>
        ) : files.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-3 text-slate-400 text-center">
            No rules found
          </div>
        ) : (
          <select
            value={selectedFile?.name || ''}
            onChange={(e) => {
              const file = files.find(f => f.name === e.target.value);
              if (file) loadRuleContent(file);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Choose a rule --</option>
            {files.map((file) => (
              <option key={file.name} value={file.name}>
                {getDisplayTitle(file.name)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Main content area - Full width */}
      <div className="flex-1 overflow-hidden">
        {/* Rule content viewer */}
        <div className="h-full bg-slate-800 rounded-lg p-6 overflow-y-auto">
          {!selectedFile ? (
            <div className="text-center text-slate-400 py-16">
              <p className="text-lg mb-2">Select a rule to view</p>
              <p className="text-sm">Choose from the dropdown above</p>
            </div>
          ) : isLoading ? (
            <div className="text-center text-slate-400 py-16">
              Loading rule content...
            </div>
          ) : sections.length > 0 ? (
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white mb-4">
                {getDisplayTitle(selectedFile.name)}
              </h1>
              {sections.map(section => renderSection(section, 0))}
            </div>
          ) : ruleContent ? (
            /* Fallback for rules without sections */
            <div className="prose prose-invert prose-slate max-w-none text-left">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{ a: LinkRenderer }}
              >
                {ruleContent}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
