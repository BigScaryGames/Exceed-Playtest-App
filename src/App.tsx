import React, { useState, useEffect, useRef } from 'react';
import { User, Upload, Trash2, BookOpen, RefreshCw } from 'lucide-react';
import { Character } from '@/types/character';
import {
  createEmptyCharacter,
  saveCharacter,
  loadAllCharacters,
  importCharacter,
  exportCharacter,
  deleteCharacter,
} from '@/utils/character';
import { CharacterSheet } from '@/components/CharacterSheet';
import { RulesTab } from '@/components/tabs/RulesTab';
import { SideMenu } from '@/components/SideMenu';
import { RenameCharacterModal } from '@/components/modals/RenameCharacterModal';
import { loadPerks } from '@/services/perkSync';
import { loadSpellDatabase } from '@/data/spells';
import type { PerkDatabase } from '@/types/perks';

type ViewState = 'landing' | 'create' | 'characterList' | 'characterSheet' | 'rules';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [newCharacter, setNewCharacter] = useState<Character>(createEmptyCharacter());
  const [perkDatabase, setPerkDatabase] = useState<PerkDatabase | null>(null); // Used by future perk selection components
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suppress unused warning - perkDatabase will be used by PerkSelectModal
  void perkDatabase;

  // Load characters from localStorage on mount
  useEffect(() => {
    const loadedCharacters = loadAllCharacters();
    setCharacters(loadedCharacters);
  }, []);

  // Load perk and spell databases on mount
  useEffect(() => {
    // Load perks
    loadPerks()
      .then((database) => {
        setPerkDatabase(database);
        console.log('[App] Perk database loaded:', {
          combat: database.perks.combat.length,
          magic: database.perks.magic.length,
          skill: database.perks.skill.length,
          version: database.version,
        });
      })
      .catch((err) => {
        console.error('[App] Failed to load perk database:', err);
      });

    // Load spells (MS5)
    loadSpellDatabase()
      .catch((err) => {
        console.error('[App] Failed to load spell database:', err);
      });

    // Listen for perk updates
    const handlePerksUpdated = (event: CustomEvent<PerkDatabase>) => {
      console.log('[App] Perks updated from GitHub');
      setPerkDatabase(event.detail);
    };

    window.addEventListener('perks-updated', handlePerksUpdated as EventListener);

    return () => {
      window.removeEventListener('perks-updated', handlePerksUpdated as EventListener);
    };
  }, []);

  // Auto-save current character when it changes
  useEffect(() => {
    if (currentCharacter && currentView === 'characterSheet') {
      saveCharacter(currentCharacter);
      // Update the characters list
      setCharacters((prev) =>
        prev.map((c) => (c.name === currentCharacter.name ? currentCharacter : c))
      );
    }
  }, [currentCharacter, currentView]);

  const handleNewCharacter = () => {
    setNewCharacter(createEmptyCharacter());
    setCurrentView('create');
  };

  const handleLoadCharacter = () => {
    const loadedCharacters = loadAllCharacters();
    setCharacters(loadedCharacters);
    setCurrentView('characterList');
  };

  const handleCreateCharacter = () => {
    if (!newCharacter.name.trim()) {
      alert('Please enter a character name');
      return;
    }

    // Save the new character
    saveCharacter(newCharacter);

    // Update local state
    setCharacters((prev) => [...prev, newCharacter]);
    setCurrentCharacter(newCharacter);
    setCurrentView('characterSheet');
  };

  const handleSelectCharacter = (character: Character) => {
    // Update lastOpened timestamp
    const updatedCharacter = {
      ...character,
      lastOpened: Date.now()
    };

    // Save the updated character with new timestamp
    saveCharacter(updatedCharacter);

    setCurrentCharacter(updatedCharacter);
    setCurrentView('characterSheet');
  };

  const handleUpdateCharacter = (updatedCharacter: Character) => {
    setCurrentCharacter(updatedCharacter);
  };

  const handleImportCharacter = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedCharacter = await importCharacter(file);

      // Save to localStorage
      saveCharacter(importedCharacter);

      // Update state
      setCharacters((prev) => [...prev, importedCharacter]);
      setCurrentCharacter(importedCharacter);
      setCurrentView('characterSheet');

      alert('Character imported successfully!');
    } catch (error) {
      alert('Failed to import character. Please check the file format.');
      console.error('Import error:', error);
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportCharacter = () => {
    if (!currentCharacter) return;
    exportCharacter(currentCharacter);
  };

  const handleDeleteCharacter = (characterName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the character selection

    if (!confirm(`Are you sure you want to delete "${characterName}"? This cannot be undone.`)) {
      return;
    }

    // Delete from localStorage
    deleteCharacter(characterName);

    // Update local state
    const updatedCharacters = characters.filter(c => c.name !== characterName);
    setCharacters(updatedCharacters);

    // If the deleted character was currently loaded, clear it
    if (currentCharacter?.name === characterName) {
      setCurrentCharacter(null);
    }
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setCurrentCharacter(null);
    setIsMenuOpen(false);
  };

  const handleRenameCharacter = (newName: string) => {
    if (!currentCharacter) return;

    const oldName = currentCharacter.name;
    const updatedCharacter = { ...currentCharacter, name: newName };

    // Update in localStorage
    deleteCharacter(oldName);
    saveCharacter(updatedCharacter);

    // Update state
    setCurrentCharacter(updatedCharacter);
    setCharacters(prev => prev.map(c => c.name === oldName ? updatedCharacter : c));
  };

  const handleViewRules = () => {
    setCurrentView('rules');
    setIsMenuOpen(false);
  };

  const handleClearCache = async () => {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    // Hard reload to bypass cache
    window.location.reload();
  };

  // Landing Page
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-slate-100 mb-2">EXCEED</h1>
            <p className="text-slate-400 text-lg">Character Manager</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-8 space-y-4 shadow-xl border border-slate-700">
            <button
              onClick={handleNewCharacter}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              <User size={24} />
              <span>New Character</span>
            </button>

            <button
              onClick={handleLoadCharacter}
              className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-4 px-6 rounded-lg transition-colors border border-slate-600"
            >
              <Upload size={24} />
              <span>Load Character</span>
            </button>

            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportCharacter}
                className="hidden"
                id="file-import"
              />
              <label
                htmlFor="file-import"
                className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-4 px-6 rounded-lg transition-colors border border-slate-600 cursor-pointer"
              >
                <Upload size={24} />
                <span>Import Character</span>
              </label>
            </div>

            <button
              onClick={() => setCurrentView('rules')}
              className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-4 px-6 rounded-lg transition-colors border border-slate-600"
            >
              <BookOpen size={24} />
              <span>View Rules</span>
            </button>

            <button
              onClick={handleClearCache}
              className="w-full flex items-center justify-center gap-3 bg-orange-700 hover:bg-orange-600 text-slate-100 font-semibold py-3 px-6 rounded-lg transition-colors border border-orange-600 text-sm"
            >
              <RefreshCw size={18} />
              <span>Clear Cache & Reload</span>
            </button>
          </div>

          <div className="text-center text-slate-500 text-sm">
            <p>A skill-based fantasy TTRPG system</p>
          </div>
        </div>
      </div>
    );
  }

  // Character Creation Page
  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Character Creation</h2>

          <div className="bg-slate-800 rounded-lg p-6 space-y-4 border border-slate-700">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCharacter.name}
                onChange={(e) =>
                  setNewCharacter({ ...newCharacter, name: e.target.value })
                }
                placeholder="Character name"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Combat XP</label>
                <input
                  type="number"
                  value={newCharacter.combatXP}
                  onChange={(e) =>
                    setNewCharacter({
                      ...newCharacter,
                      combatXP: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Skill XP</label>
                <input
                  type="number"
                  value={newCharacter.socialXP}
                  onChange={(e) =>
                    setNewCharacter({
                      ...newCharacter,
                      socialXP: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateCharacter}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Create Character
              </button>
              <button
                onClick={handleBackToLanding}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Character List Page (Load)
  if (currentView === 'characterList') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Load Character</h2>
            <button
              onClick={handleBackToLanding}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2 rounded transition-colors"
            >
              Back
            </button>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700">
            {characters.length === 0 ? (
              <div className="p-12 text-center">
                <User size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 text-lg mb-2">No characters yet</p>
                <p className="text-slate-500 text-sm">
                  Create a new character to get started
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {characters
                  .sort((a, b) => {
                    // Sort by lastOpened (most recent first), fallback to 0 if not set
                    const aTime = a.lastOpened || 0;
                    const bTime = b.lastOpened || 0;
                    return bTime - aTime;
                  })
                  .map((character, index) => (
                  <div
                    key={character.name + index}
                    onClick={() => handleSelectCharacter(character)}
                    className="p-4 hover:bg-slate-750 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{character.name}</h3>
                      {character.concept && (
                        <p className="text-slate-400 text-sm italic">{character.concept}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>Combat XP: {character.combatXP}</span>
                        <span>Skill XP: {character.socialXP}</span>
                        {character.lastOpened && (
                          <span>• Last opened: {new Date(character.lastOpened).toLocaleDateString()} {new Date(character.lastOpened).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteCharacter(character.name, e)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
                      title="Delete character"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Character Sheet Page
  if (currentView === 'characterSheet' && currentCharacter) {
    return (
      <>
        <SideMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          characterName={currentCharacter.name}
          onBackToLanding={handleBackToLanding}
          onRename={() => setShowRenameModal(true)}
          onExport={handleExportCharacter}
          onViewRules={handleViewRules}
        />
        <RenameCharacterModal
          isOpen={showRenameModal}
          onClose={() => setShowRenameModal(false)}
          currentName={currentCharacter.name}
          onRename={handleRenameCharacter}
        />
        <CharacterSheet
          character={currentCharacter}
          onUpdate={handleUpdateCharacter}
          perkDatabase={perkDatabase}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        />
      </>
    );
  }

  // Rules View
  if (currentView === 'rules') {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="bg-black p-4 border-b border-slate-700">
          <button
            onClick={handleBackToLanding}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>
        <RulesTab />
      </div>
    );
  }

  return null;
}
