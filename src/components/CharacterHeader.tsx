import React, { useState, useMemo } from 'react';
import {
  Swords,
  Menu,
  Dumbbell,
  Shield,
  Wind,
  Hand,
  Eye,
  Sparkles,
  Brain,
  Flame,
  Gauge
} from 'lucide-react';
import { Character, AttributeCode } from '@/types/character';
import { NEGATIVE_CP_THRESHOLDS, POSITIVE_CP_THRESHOLDS, MARTIAL_CP_THRESHOLDS, SPELLCRAFT_CP_THRESHOLDS } from '@/utils/constants';
import { calculateLimit, calculateUsedLimit } from '@/utils/spells';

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

// Calculate progress to next threshold (handles negative and positive)
const calculateProgress = (currentCP: number, _thresholds: number[]): number => {
  if (currentCP === 0) return 0;
  
  if (currentCP < 0) {
    // Negative CP: use negative thresholds
    let currentThreshold = 0;
    let nextThreshold = NEGATIVE_CP_THRESHOLDS[0];  // -30
    
    for (let i = 0; i < NEGATIVE_CP_THRESHOLDS.length; i++) {
      if (currentCP <= NEGATIVE_CP_THRESHOLDS[i]) {
        currentThreshold = NEGATIVE_CP_THRESHOLDS[i];
        nextThreshold = NEGATIVE_CP_THRESHOLDS[i + 1] || currentThreshold;
      }
    }
    
    // If at max negative (-30 or less), show full bar
    if (currentCP <= NEGATIVE_CP_THRESHOLDS[0]) {
      return 100;
    }
    
    // Calculate percentage (note: thresholds are negative, so we invert)
    const range = Math.abs(nextThreshold - currentThreshold);
    const progress = Math.abs(currentCP - currentThreshold);
    return range > 0 ? (progress / range) * 100 : 0;
  } else {
    // Positive CP: use positive thresholds
    let currentThreshold = 0;
    let nextThreshold = POSITIVE_CP_THRESHOLDS[0];
    
    for (let i = 0; i < POSITIVE_CP_THRESHOLDS.length; i++) {
      if (currentCP >= POSITIVE_CP_THRESHOLDS[i]) {
        currentThreshold = POSITIVE_CP_THRESHOLDS[i];
        nextThreshold = POSITIVE_CP_THRESHOLDS[i + 1] || POSITIVE_CP_THRESHOLDS[POSITIVE_CP_THRESHOLDS.length - 1];
      }
    }
    
    // If at max level, show full bar
    if (currentCP >= POSITIVE_CP_THRESHOLDS[POSITIVE_CP_THRESHOLDS.length - 1]) {
      return 100;
    }
    
    // Calculate percentage progress
    const range = nextThreshold - currentThreshold;
    const progress = currentCP - currentThreshold;
    return range > 0 ? (progress / range) * 100 : 0;
  }
};

interface CharacterHeaderProps {
  character: Character;
  onMenuToggle: () => void;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({ character, onMenuToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate CP totals for each attribute from progression log (same as ProgressionListTab)
  const attributeCPTotals: Record<string, number> = (() => {
    const totals: Record<string, number> = {
      MG: 0, EN: 0, AG: 0, DX: 0, WT: 0, WI: 0, PR: 0, CH: 0
    };

    character.progressionLog.forEach(entry => {
      if (entry.attribute && entry.cost) {
        const attrCode = ATTRIBUTE_NAME_TO_CODE[entry.attribute] || entry.attribute;
        if (attrCode in totals) {
          totals[attrCode] += entry.cost;
        }
      }
    });

    return totals;
  })();

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

  // Calculate Limit
  const totalLimit = calculateLimit(character);
  const usedLimit = calculateUsedLimit(character);
  const limitPercentage = totalLimit > 0 ? (usedLimit / totalLimit) * 100 : 0;

  const getLimitBarColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-red-600';
    if (percentage >= 50) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <div className="bg-black border-b border-slate-700">
      <div className="p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onMenuToggle()}
            className="text-slate-400 hover:text-white transition-colors p-1"
            title="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <h2 className="text-2xl font-bold text-white">
              {character.name}
            </h2>
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
            const progress = calculateProgress(currentCP, []);  // thresholds not used anymore in function

            // Color code negative values
            const valueColor = value < 0 ? 'text-red-400' : value > 0 ? 'text-white' : 'text-slate-400';
            // Bar color: red for negative, green for positive
            const barColor = currentCP < 0 ? 'bg-red-500' : 'bg-green-500';

            return (
              <div key={stat} className="bg-slate-800 rounded px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  {IconComponent && <IconComponent size={14} className="text-slate-400 flex-shrink-0" />}
                  <span className="text-xs font-semibold text-slate-300 flex-1">
                    <span className="hidden sm:inline">{fullNames[stat] || stat}</span>
                    <span className="sm:hidden">{stat}</span>
                  </span>
                  <span className={`text-base font-bold ${valueColor}`}>{value}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-300`}
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
            <div className="flex-1 bg-red-900/40 border border-red-800/50 rounded px-2 py-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Swords size={12} className="text-red-400" />
                  <span className="text-xs font-semibold text-red-300">Martial</span>
                </div>
                <span className="text-sm font-bold text-white">{character.weaponDomains.Martial}</span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-red-950 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${calculateProgress(domainCPTotals.Martial, MARTIAL_CP_THRESHOLDS)}%` }}
                />
              </div>
            </div>
            <div className="flex-1 bg-purple-900/40 border border-purple-800/50 rounded px-2 py-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Sparkles size={12} className="text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300">Spellcraft</span>
                </div>
                <span className="text-sm font-bold text-white">{character.weaponDomains.Spellcraft}</span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-purple-950 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${calculateProgress(domainCPTotals.Spellcraft, SPELLCRAFT_CP_THRESHOLDS)}%` }}
                />
              </div>
            </div>
            <div className="flex-1 bg-emerald-900/40 border border-emerald-800/50 rounded px-2 py-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Gauge size={12} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300">Limit</span>
                </div>
                <span className="text-sm font-bold text-white">{usedLimit}/{totalLimit}</span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-emerald-950 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getLimitBarColor(limitPercentage)}`}
                  style={{ width: `${limitPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
