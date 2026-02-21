import React from 'react';
import { X, Home, Edit3, Download, BookOpen } from 'lucide-react';

const RULES_URL = 'https://bigscarygames.github.io/ExceedV/';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  onBackToLanding: () => void;
  onRename: () => void;
  onExport: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  characterName,
  onBackToLanding,
  onRename,
  onExport,
}) => {
  const handleViewRules = () => {
    window.open(RULES_URL, '_blank');
    onClose();
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Dark overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-out menu panel */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-slate-800 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white truncate">{characterName}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu items */}
        <nav className="p-2">
          <button
            onClick={() => handleMenuItemClick(onBackToLanding)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Home size={20} />
            <span>Back to Landing</span>
          </button>

          <button
            onClick={() => handleMenuItemClick(onRename)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Edit3 size={20} />
            <span>Rename Character</span>
          </button>

          <button
            onClick={() => handleMenuItemClick(onExport)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Download size={20} />
            <span>Export Character</span>
          </button>

          <button
            onClick={handleViewRules}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <BookOpen size={20} />
            <span>View Rules</span>
          </button>
        </nav>
      </div>
    </>
  );
};
