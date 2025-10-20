import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  fetchRuleFileList,
  getRule,
  clearRulesCache,
  formatCacheAge,
  RuleFile
} from '@/services/rulesService';

interface Section {
  id: string;
  title: string;
  content: string;
  level: number;
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
      setRuleContent(result.content);
      setCacheTimestamp(result.timestamp);
      setIsCached(result.cached);
    } catch (err) {
      setError(`Failed to load rule: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setRuleContent('');
    } finally {
      setIsLoading(false);
    }
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

  // Parse markdown into sections based on headings
  const sections = useMemo((): Section[] => {
    if (!ruleContent) return [];

    const lines = ruleContent.split('\n');
    const parsedSections: Section[] = [];
    let currentSection: Section | null = null;
    let sectionContent: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = sectionContent.join('\n').trim();
          parsedSections.push(currentSection);
        }

        // Start new section
        const level = headingMatch[1].length;
        const title = headingMatch[2];
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        currentSection = { id, title, content: '', level };
        sectionContent = [];
      } else if (currentSection) {
        // Add line to current section
        sectionContent.push(line);
      }
    }

    // Add last section
    if (currentSection) {
      currentSection.content = sectionContent.join('\n').trim();
      parsedSections.push(currentSection);
    }

    // Auto-expand first section
    if (parsedSections.length > 0 && !expandedSection) {
      setExpandedSection(parsedSections[0].id);
    }

    return parsedSections;
  }, [ruleContent, expandedSection]);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
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
              {sections.map((section) => (
                <div key={section.id} className="border border-slate-700 rounded-lg overflow-hidden">
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 bg-slate-750 hover:bg-slate-700 transition-colors text-left"
                  >
                    <h2 className={`font-semibold text-white ${
                      section.level === 2 ? 'text-lg' : 'text-base'
                    }`}>
                      {section.title}
                    </h2>
                    {expandedSection === section.id ? (
                      <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight size={20} className="text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {/* Section content (accordion) */}
                  {expandedSection === section.id && (
                    <div className="p-4 bg-slate-800 border-t border-slate-700">
                      <div className="prose prose-invert prose-slate max-w-none text-left">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {section.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : ruleContent ? (
            /* Fallback for rules without sections */
            <div className="prose prose-invert prose-slate max-w-none text-left">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {ruleContent}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
