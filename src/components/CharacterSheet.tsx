import React, { useState, useEffect } from 'react';
import { Character } from '@/types/character';
import type { PerkDatabase } from '@/types/perks';
import { CharacterHeader } from '@/components/CharacterHeader';
import { SkillsTab } from '@/components/tabs/SkillsTab';
import { CombatTab } from '@/components/tabs/CombatTab';
import { EquipmentTab } from '@/components/tabs/EquipmentTab';
import { MagicTab } from '@/components/tabs/MagicTab';
import { PerksTab } from '@/components/tabs/PerksTab';
import { NotesTab } from '@/components/tabs/NotesTab';
import { calculateAttributeValues, calculateWeaponDomains } from '@/utils/calculations';
import { migrateCharacterIfNeeded, needsMigration } from '@/utils/migration';

interface CharacterSheetProps {
  character: Character;
  onUpdate: (character: Character) => void;
  perkDatabase: PerkDatabase | null;
  onMenuToggle: () => void;
}

type TabType = 'list' | 'skills' | 'combat' | 'equipment' | 'magic' | 'perks';

const tabs: TabType[] = ['list', 'skills', 'combat', 'equipment', 'magic', 'perks'];

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, onUpdate, perkDatabase, onMenuToggle }) => {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 75;
    const isRightSwipe = distance < -75;

    // Check for swipe from left edge to open menu
    if (touchStart < 50 && isRightSwipe) {
      onMenuToggle();
      setTouchStart(0);
      setTouchEnd(0);
      return;
    }

    const currentIndex = tabs.indexOf(activeTab);

    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }

    if (isRightSwipe && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Migrate character to new inventory system if needed
  useEffect(() => {
    if (needsMigration(character)) {
      const migratedCharacter = migrateCharacterIfNeeded(character);
      onUpdate(migratedCharacter);
    }
  }, [character.name]); // Run on mount and when character changes

  // Auto-calculate stats and weapon domains from progression log
  useEffect(() => {
    const calculatedStats = calculateAttributeValues(character.progressionLog);
    const calculatedDomains = calculateWeaponDomains(character.progressionLog);

    const statsChanged = Object.keys(calculatedStats).some(
      key => calculatedStats[key as keyof typeof calculatedStats] !== character.stats[key as keyof typeof calculatedStats]
    );

    const domainsChanged = Object.keys(calculatedDomains).some(
      key => calculatedDomains[key as keyof typeof calculatedDomains] !== character.weaponDomains[key as keyof typeof calculatedDomains]
    );

    if (statsChanged || domainsChanged) {
      onUpdate({
        ...character,
        stats: calculatedStats,
        weaponDomains: calculatedDomains
      });
    }
  }, [character.progressionLog]);

  // Use calculated stats for display
  const displayCharacter: Character = {
    ...character,
    stats: calculateAttributeValues(character.progressionLog),
    weaponDomains: calculateWeaponDomains(character.progressionLog)
  };

  return (
    <div
      className="min-h-screen bg-slate-900 text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <CharacterHeader character={displayCharacter} onMenuToggle={onMenuToggle} />

      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 font-semibold ${
              activeTab === 'list'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-500'
            }`}
          >
            👤 Character
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-3 font-semibold ${
              activeTab === 'skills'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-500'
            }`}
          >
            📖 Skills
          </button>
          <button
            onClick={() => setActiveTab('combat')}
            className={`flex-1 py-3 font-semibold ${
              activeTab === 'combat'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-500'
            }`}
          >
            ⚔️ Combat
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 py-3 font-semibold ${
              activeTab === 'equipment'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-500'
            }`}
          >
            🎒 Equipment
          </button>
          <button
            onClick={() => setActiveTab('magic')}
            className={`flex-1 py-3 font-semibold ${
              activeTab === 'magic'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-500'
            }`}
          >
            🧙 Magic
          </button>
          <button
            onClick={() => setActiveTab('perks')}
            className={`flex-1 py-3 font-semibold ${
              activeTab === 'perks'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-500'
            }`}
          >
            ✨ Perks
          </button>
        </div>
      </div>

      <div className="bg-black min-h-screen">
        {activeTab === 'list' && <NotesTab character={displayCharacter} onUpdate={onUpdate} />}
        {activeTab === 'skills' && <SkillsTab character={displayCharacter} onUpdate={onUpdate} perkDatabase={perkDatabase} />}
        {activeTab === 'combat' && <CombatTab character={displayCharacter} onUpdate={onUpdate} perkDatabase={perkDatabase} />}
        {activeTab === 'equipment' && <EquipmentTab character={displayCharacter} onUpdate={onUpdate} />}
        {activeTab === 'magic' && <MagicTab character={displayCharacter} onUpdate={onUpdate} perkDatabase={perkDatabase} />}
        {activeTab === 'perks' && <PerksTab character={displayCharacter} onUpdate={onUpdate} perkDatabase={perkDatabase} />}
      </div>
    </div>
  );
};

export default CharacterSheet;
