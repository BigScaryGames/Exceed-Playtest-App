import React, { useState, useMemo } from 'react';
import {
  Swords,
  BookOpen,
  Menu,
  Dumbbell,
  Shield,
  Wind,
  Hand,
  Eye,
  Sparkles,
  Brain,
  Flame
} from 'lucide-react';
import { Character, AttributeCode } from '@/types/character';
import { XPModal } from '@/components/modals/XPModal';
import { ATTRIBUTE_CP_THRESHOLDS, MARTIAL_CP_THRESHOLDS, SPELLCRAFT_CP_THRESHOLDS } from '@/utils/constants';

// Icon mapping for attributes
const STAT_ICONS: Record<string, React.ElementType> = {
  MG: Dumbbell,  // Might - strength
  EN: Shield,    // Endurance - toughness
  AG: Wind,      // Agility - speed/movement
  DX: Hand,      // Dexterity - precision
  WT: Brain,     // Wit - intelligence
  WI: Flame,     // Will - inner fire/determination
  PR: Eye,       // Perception - vision
  CH: Sparkles   // Charisma - charm
};

// Reverse mapping from full name to abbreviation
const ATTRIBUTE_NAME_TO_CODE: Record<string, AttributeCode> = {
  'Might': 'MG',
  'Endurance': 'EN',
  'Agility': 'AG',
  'Dexterity': 'DX',
  'Wit': 'WT',
  'Will': 'WI',
  'Perception': 'PR',
  'Charisma': 'CH'
};

// Calculate progress to next threshold
const calculateProgress = (currentCP: number, thresholds: number[]): number => {
  // Find current level and next threshold
  let currentThreshold = 0;
  let nextThreshold = thresholds[0];

  for (let i = 0; i < thresholds.length; i++) {
    if (currentCP >= thresholds[i]) {
      currentThreshold = thresholds[i];
      nextThreshold = thresholds[i + 1] || thresholds[i]; // Max level
    } else {
      nextThreshold = thresholds[i];
      break;
    }
  }

  // If at max level, show full bar
  if (currentCP >= thresholds[thresholds.length - 1]) {
    return 100;
  }

  // Calculate percentage progress between current and next threshold
  const range = nextThreshold - currentThreshold;
  const progress = currentCP - currentThreshold;
  return range > 0 ? (progress / range) * 100 : 0;
};

interface CharacterHeaderProps {
  character: Character;
  onUpdateXP: (combatXP: number, socialXP: number) => void;
  onMenuToggle: () => void;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({ character, onUpdateXP, onMenuToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showXPModal, setShowXPModal] = useState(false);

  // Calculate CP totals for each attribute from progression log
  const attributeCPTotals = useMemo(() => {
    const totals: Record<string, number> = {
      MG: 0, EN: 0, AG: 0, DX: 0, WT: 0, WI: 0, PR: 0, CH: 0
    };

    character.progressionLog.forEach(entry => {
      // Skip staged perks - they contribute to Martial domain, not attributes
      if (entry.type === 'stagedPerk') return;

      if (entry.attribute) {
        const attrCode = ATTRIBUTE_NAME_TO_CODE[entry.attribute] || entry.attribute;
        if (attrCode in totals) {
          totals[attrCode] += entry.cost || 0;
        }
      }
    });

    return totals;
  }, [character.progressionLog]);

  // Calculate CP totals for domains
  const domainCPTotals = useMemo(() => {
    let martialCP = 0;
    let spellcraftCP = 0;

    character.progressionLog.forEach(entry => {
      if (entry.type === 'combatPerk' || entry.type === 'stagedPerk') {
        martialCP += entry.cost || 0;
      } else if (entry.type === 'spell' || entry.type === 'magicPerk') {
        spellcraftCP += entry.cost || 0;
      }
    });

    return { Martial: martialCP, Spellcraft: spellcraftCP };
  }, [character.progressionLog]);

  const handleAddXP = (combatXP: number, socialXP: number) => {
    onUpdateXP(combatXP, socialXP);
    setShowXPModal(false);
  };

  return (
    <>
      <div className="bg-black border-b border-slate-700">
        <div className="p-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuToggle();
                }}
                className="text-slate-400 hover:text-white transition-colors p-1"
                title="Open menu"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-2xl font-bold text-white">
                {character.name}
              </h2>
            </div>
            <div
              className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 rounded-lg px-4 py-2 cursor-pointer transition-colors border border-slate-600"
              onClick={(e) => {
                e.stopPropagation();
                setShowXPModal(true);
              }}
            >
              <div className="flex items-center gap-2">
                <Swords size={16} className="text-red-400" />
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-white">Combat</span>
                  <span className="text-lg font-bold text-white">{character.combatXP}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-400" />
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-white">Skill</span>
                  <span className="text-lg font-bold text-white">{character.socialXP}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="overflow-hidden transition-all duration-250 bg-slate-950"
          style={{ maxHeight: isExpanded ? '300px' : '0px' }}
        >
          {/* Attributes Grid */}
          <div className="grid grid-cols-4 gap-2 p-3 pb-2">
            {Object.entries(character.stats).map(([stat, value]) => {
              const fullNames: Record<string, string> = {
                MG: 'Might',
                EN: 'Endurance',
                AG: 'Agility',
                DX: 'Dexterity',
                WT: 'Wit',
                WI: 'Will',
                PR: 'Perception',
                CH: 'Charisma'
              };
              const IconComponent = STAT_ICONS[stat];
              const currentCP = attributeCPTotals[stat] || 0;
              const progress = calculateProgress(currentCP, ATTRIBUTE_CP_THRESHOLDS);

              return (
                <div key={stat} className="bg-slate-800 rounded px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    {IconComponent && <IconComponent size={14} className="text-slate-400 flex-shrink-0" />}
                    <span className="text-xs font-semibold text-slate-300 flex-1">
                      <span className="hidden sm:inline">{fullNames[stat] || stat}</span>
                      <span className="sm:hidden">{stat}</span>
                    </span>
                    <span className="text-base font-bold text-white">{value}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Domains Row */}
          <div className="px-3 pb-3">
            <div className="flex gap-2">
              <div className="flex-1 bg-red-900/40 border border-red-800/50 rounded px-3 py-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Swords size={14} className="text-red-400" />
                    <span className="text-xs font-semibold text-red-300">Martial</span>
                  </div>
                  <span className="text-base font-bold text-white">{character.weaponDomains.Martial}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-red-950 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${calculateProgress(domainCPTotals.Martial, MARTIAL_CP_THRESHOLDS)}%` }}
                  />
                </div>
              </div>
              <div className="flex-1 bg-purple-900/40 border border-purple-800/50 rounded px-3 py-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300">Spellcraft</span>
                  </div>
                  <span className="text-base font-bold text-white">{character.weaponDomains.Spellcraft}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-purple-950 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${calculateProgress(domainCPTotals.Spellcraft, SPELLCRAFT_CP_THRESHOLDS)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <XPModal
        isOpen={showXPModal}
        onClose={() => setShowXPModal(false)}
        onAddXP={handleAddXP}
      />
    </>
  );
};
