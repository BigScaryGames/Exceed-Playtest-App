import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  fetchRuleFileList,
  getRule,
  clearRulesCache,
  formatCacheAge,
  RuleFile
} from '@/services/rulesService';

export const RulesTab: React.FC = () => {
  const [files, setFiles] = useState<RuleFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<RuleFile | null>(null);
  const [ruleContent, setRuleContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);
  const [isCached, setIsCached] = useState(false);

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

      {/* Main content area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* File list sidebar */}
        <div className="lg:col-span-1 bg-slate-800 rounded-lg p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-3">Core Rules</h3>

          {isLoading && !selectedFile ? (
            <div className="text-slate-400 text-center py-8">
              Loading rules...
            </div>
          ) : files.length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              No rules found
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => loadRuleContent(file)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedFile?.name === file.name
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  <div className="text-sm font-medium">
                    {getDisplayTitle(file.name)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rule content viewer */}
        <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6 overflow-y-auto">
          {!selectedFile ? (
            <div className="text-center text-slate-400 py-16">
              <p className="text-lg mb-2">Select a rule to view</p>
              <p className="text-sm">Choose from the list on the left</p>
            </div>
          ) : isLoading ? (
            <div className="text-center text-slate-400 py-16">
              Loading rule content...
            </div>
          ) : ruleContent ? (
            <div className="prose prose-invert prose-slate max-w-none">
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
