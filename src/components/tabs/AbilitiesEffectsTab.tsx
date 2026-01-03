import React, { useState } from 'react';
import { Character } from '@/types/character';
import type { PerkDatabase } from '@/types/perks';
import { getActiveAbilities, getActiveEffects, ActiveAbility, ActiveEffect } from '@/utils/effectCalculator';

interface AbilitiesEffectsTabProps {
  character: Character;
  onUpdate: (character: Character) => void;
  perkDatabase: PerkDatabase | null;
}

export const AbilitiesEffectsTab: React.FC<AbilitiesEffectsTabProps> = ({
  character,
  perkDatabase
}) => {
  // Sub-tab state for mobile
  const [activeSubTab, setActiveSubTab] = useState<'abilities' | 'effects'>('abilities');

  // Expansion state
  const [expandedAbilityIndex, setExpandedAbilityIndex] = useState<number | null>(null);
  const [expandedEffectIndex, setExpandedEffectIndex] = useState<number | null>(null);

  // Get active abilities and effects from character's perks
  const abilities = getActiveAbilities(character, perkDatabase);
  const effects = getActiveEffects(character, perkDatabase);

  // Toggle expansion
  const toggleAbilityExpand = (index: number) => {
    setExpandedAbilityIndex(expandedAbilityIndex === index ? null : index);
  };

  const toggleEffectExpand = (index: number) => {
    setExpandedEffectIndex(expandedEffectIndex === index ? null : index);
  };

  // Render an ability card
  const renderAbilityCard = (ability: ActiveAbility, index: number) => (
    <div key={`${ability.id}-${index}`} className="bg-slate-800 rounded overflow-hidden">
      <div
        className="p-3 cursor-pointer hover:bg-slate-750 transition-colors"
        onClick={() => toggleAbilityExpand(index)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <span className="text-white font-medium">{ability.name}</span>
            <div className="text-slate-400 text-xs mt-0.5">
              from {ability.sourcePerk}
            </div>
          </div>
          {ability.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end ml-2">
              {ability.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className="text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
              {ability.tags.length > 2 && (
                <span className="text-xs text-slate-500">+{ability.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
      {expandedAbilityIndex === index && (
        <div className="px-3 pb-3 border-t border-slate-700">
          <div className="text-slate-300 text-sm mt-2 whitespace-pre-wrap">
            {ability.effect}
          </div>
          {ability.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ability.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render an effect card
  const renderEffectCard = (effect: ActiveEffect, index: number) => (
    <div key={`${effect.id}-${index}`} className="bg-slate-800 rounded overflow-hidden">
      <div
        className="p-3 cursor-pointer hover:bg-slate-750 transition-colors"
        onClick={() => toggleEffectExpand(index)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <span className="text-white font-medium">{effect.name}</span>
            <div className="text-slate-400 text-xs mt-0.5">
              from {effect.sourcePerk}
            </div>
          </div>
          {effect.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end ml-2">
              {effect.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className="text-xs bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
              {effect.tags.length > 2 && (
                <span className="text-xs text-slate-500">+{effect.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
      {expandedEffectIndex === index && (
        <div className="px-3 pb-3 border-t border-slate-700">
          <div className="text-slate-300 text-sm mt-2 whitespace-pre-wrap">
            {effect.effect}
          </div>
          {effect.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {effect.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sub-tab Navigation Bar - Only visible on mobile */}
      <div className="bg-slate-900 border-b border-slate-700 lg:hidden">
        <div className="flex">
          <button
            onClick={() => setActiveSubTab('abilities')}
            className={`flex-1 py-3 px-4 text-center font-semibold transition-colors ${
              activeSubTab === 'abilities'
                ? 'text-white border-b-2 border-blue-500 bg-slate-800'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-850'
            }`}
          >
            Abilities ({abilities.length})
          </button>
          <button
            onClick={() => setActiveSubTab('effects')}
            className={`flex-1 py-3 px-4 text-center font-semibold transition-colors ${
              activeSubTab === 'effects'
                ? 'text-white border-b-2 border-purple-500 bg-slate-800'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-850'
            }`}
          >
            Effects ({effects.length})
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Responsive Layout: Sub-tabs on mobile, Two-columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Abilities Section */}
          <div className={activeSubTab === 'abilities' ? 'block lg:block' : 'hidden lg:block'}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-white lg:hidden">Abilities</h3>
              <h4 className="text-lg font-semibold text-slate-300 hidden lg:block">
                Abilities ({abilities.length})
              </h4>
            </div>

            {abilities.length === 0 ? (
              <div className="bg-slate-800 rounded p-4 text-center">
                <p className="text-slate-400 text-sm">
                  No abilities yet. Abilities are granted by perks you learn.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {abilities.map((ability, index) => renderAbilityCard(ability, index))}
              </div>
            )}
          </div>

          {/* Effects Section */}
          <div className={activeSubTab === 'effects' ? 'block lg:block' : 'hidden lg:block'}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-white lg:hidden">Effects</h3>
              <h4 className="text-lg font-semibold text-slate-300 hidden lg:block">
                Effects ({effects.length})
              </h4>
            </div>

            {effects.length === 0 ? (
              <div className="bg-slate-800 rounded p-4 text-center">
                <p className="text-slate-400 text-sm">
                  No effects yet. Effects are passive bonuses granted by perks.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {effects.map((effect, index) => renderEffectCard(effect, index))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
