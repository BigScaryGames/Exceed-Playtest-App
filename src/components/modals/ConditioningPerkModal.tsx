import React, { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { Character, CombatPerk } from '@/types/character';
import type { PerkDatabase } from '@/types/perks';
import { ATTRIBUTE_MAP } from '@/utils/constants';
import { calculateExtraHPFromStagedPerks } from '@/utils/calculations';

interface ConditioningPerkModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdate: (character: Character) => void;
  perkDatabase: PerkDatabase | null;
}

export const ConditioningPerkModal: React.FC<ConditioningPerkModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdate,
  perkDatabase
}) => {
  const [selectedPerkId, setSelectedPerkId] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState('');

  // Get conditioning perks from database
  // Must be before early return to avoid hooks order issues
  const conditioningPerks = useMemo(() => {
    if (!perkDatabase) return [];
    return perkDatabase.perks.combat.filter(perk =>
      perk.tags.includes('Conditioning') ||
      (perk.cost.variable && perk.cost.formula?.includes('Max_Wounds'))
    );
  }, [perkDatabase]);

  // Get current active conditioning (only one allowed at a time)
  const activeConditioning = useMemo(() => {
    if (!character.stagedPerks || character.stagedPerks.length === 0) return null;
    return character.stagedPerks[0]; // Only one can be active
  }, [character.stagedPerks]);

  // Calculate current extraHP from staged perks
  const currentExtraHP = calculateExtraHPFromStagedPerks(character.stagedPerks || []);

  // Current level is based on staged perk level
  const currentLevel = activeConditioning ? activeConditioning.level : 0;
  const nextLevel = currentLevel + 1;

  // Cost per level is simply maxWounds (flat per level, scales with each completed conditioning)
  const cost = character.maxWounds;

  // Can afford check
  const canAfford = character.combatXP >= cost;

  // Initialize selected attribute to previously chosen attribute when opening modal
  useEffect(() => {
    if (isOpen && activeConditioning && !selectedAttribute) {
      setSelectedAttribute(activeConditioning.attribute);
    }
    if (!isOpen) {
      setSelectedAttribute('');
      setSelectedPerkId('');
    }
  }, [isOpen, activeConditioning, selectedAttribute]);

  if (!isOpen) return null;

  // Handle close and reset
  const handleClose = () => {
    setSelectedPerkId('');
    setSelectedAttribute('');
    onClose();
  };

  // Get selected perk for new conditioning
  const selectedPerk = selectedPerkId
    ? conditioningPerks.find(p => p.id === selectedPerkId)
    : null;

  // Get active perk details from database
  const activePerkDetails = activeConditioning
    ? conditioningPerks.find(p => p.id === activeConditioning.id)
    : null;

  // Parse attribute options
  const getAttributeOptions = (perk: typeof selectedPerk | typeof activePerkDetails) => {
    if (!perk) return [];
    return perk.attributes.filter(attr => Object.values(ATTRIBUTE_MAP).includes(attr));
  };

  const attributeOptions = activeConditioning
    ? getAttributeOptions(activePerkDetails || activeConditioning.perkSnapshot)
    : getAttributeOptions(selectedPerk);

  // Check which conditioning perks are already completed
  const completedConditioningIds = character.combatPerks
    .filter(cp => cp.perkSnapshot?.tags?.includes('Conditioning'))
    .map(cp => cp.id);

  // Handle starting new conditioning
  const handleStartConditioning = () => {
    if (!selectedPerk || !selectedAttribute || !canAfford) return;

    // Create new staged perk at level 1
    const newStagedPerk = {
      id: selectedPerk.id,
      name: selectedPerk.name,
      level: 1,
      attribute: selectedAttribute,
      levelHistory: [{
        level: 1,
        attribute: selectedAttribute,
        cost
      }],
      perkSnapshot: selectedPerk,
      addedAt: Date.now()
    };

    onUpdate({
      ...character,
      stagedPerks: [newStagedPerk], // Only one at a time
      combatXP: character.combatXP - cost,
      progressionLog: [
        ...character.progressionLog,
        {
          type: 'stagedPerk' as const,
          name: selectedPerk.name,
          cost,
          attribute: selectedAttribute
        }
      ]
    });

    handleClose();
  };

  // Handle leveling up existing conditioning
  const handleLevelUp = () => {
    if (!activeConditioning || !selectedAttribute || !canAfford) return;

    if (nextLevel >= 5) {
      // LEVEL 5 COMPLETION
      // 1. Remove from stagedPerks
      // 2. Add to combatPerks as completed perk with capstone
      // 3. Increment maxWounds by 1
      // 4. Reset extraHP to 0 (the 4 HP become part of the new wound)
      // 5. Remove "extra-hp" effect from the completed perk's snapshot

      // Create modified snapshot without "extra-hp" effect (since HP is now part of maxWounds)
      const completedPerk: CombatPerk = {
        id: activeConditioning.id,
        name: activeConditioning.name,
        cost: cost,
        attribute: selectedAttribute,
        description: activePerkDetails?.description || '',
        isCustom: false,
        source: 'database',
        perkSnapshot: activeConditioning.perkSnapshot,
        addedAt: Date.now()
      };

      onUpdate({
        ...character,
        stagedPerks: [], // Clear - conditioning complete
        combatPerks: [...character.combatPerks, completedPerk],
        maxWounds: character.maxWounds + 1,
        combatXP: character.combatXP - cost,
        progressionLog: [
          ...character.progressionLog,
          {
            type: 'stagedPerk' as const,
            name: activeConditioning.name,
            cost,
            attribute: selectedAttribute
          },
          {
            type: 'combatPerk' as const,
            name: `${activeConditioning.name} (Completed)`,
            cost: 0,
            attribute: selectedAttribute
          }
        ]
      });
    } else {
      // LEVEL UP (2-4)
      const updatedStagedPerk = {
        ...activeConditioning,
        level: nextLevel,
        attribute: selectedAttribute,
        levelHistory: [
          ...activeConditioning.levelHistory,
          { level: nextLevel, attribute: selectedAttribute, cost }
        ]
      };

      onUpdate({
        ...character,
        stagedPerks: [updatedStagedPerk],
        combatXP: character.combatXP - cost,
        progressionLog: [
          ...character.progressionLog,
          {
            type: 'stagedPerk' as const,
            name: activeConditioning.name,
            cost,
            attribute: selectedAttribute
          }
        ]
      });
    }

    handleClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">
              {activeConditioning ? 'Continue Conditioning' : 'Start Conditioning'}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Combat XP: {character.combatXP}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* ACTIVE CONDITIONING - Level up flow */}
          {activeConditioning && activePerkDetails && (
            <>
              {/* Current Progress Display */}
              <div className="bg-slate-700 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{activeConditioning.name}</span>
                  <span className="text-sm text-slate-400">
                    Level {currentLevel} → {nextLevel}
                  </span>
                </div>

                {/* Progress Pips */}
                <div className="flex gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div
                      key={n}
                      className={`flex-1 h-3 rounded ${
                        n <= currentLevel
                          ? 'bg-green-500'
                          : n === nextLevel
                            ? 'bg-green-500/50 animate-pulse'
                            : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-slate-300 text-sm">
                  {activePerkDetails.description}
                </p>

                {/* Extra HP indicator */}
                <div className="mt-2 text-xs text-blue-400">
                  Current bonus: +{currentExtraHP} HP from conditioning
                </div>

                {nextLevel === 5 && (
                  <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded">
                    <p className="text-yellow-200 text-xs">
                      Level 5 completion grants +1 Max Wounds and the capstone effect!
                      Your {currentExtraHP} bonus HP will consolidate into the new wound.
                    </p>
                  </div>
                )}
              </div>

              {/* Cost Display */}
              <div className="bg-slate-700 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cost per level:</span>
                  <span className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                    {cost} XP
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  All levels cost {character.maxWounds} XP (Total: {character.maxWounds * 5} XP)
                </p>
              </div>

              {/* Attribute Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Select Attribute {selectedAttribute && <span className="text-blue-400">({selectedAttribute})</span>}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {attributeOptions.map(attr => (
                    <button
                      key={attr}
                      onClick={() => setSelectedAttribute(attr)}
                      className={`py-2 rounded font-semibold transition-colors ${
                        selectedAttribute === attr
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      {Object.entries(ATTRIBUTE_MAP).find(([, v]) => v === attr)?.[0] || attr}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* NO ACTIVE CONDITIONING - Selection flow */}
          {!activeConditioning && (
            <>
              {/* Perk Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Select Conditioning Type
                </label>
                <select
                  value={selectedPerkId}
                  onChange={(e) => {
                    setSelectedPerkId(e.target.value);
                    setSelectedAttribute('');
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  <option value="">-- Choose conditioning --</option>
                  {conditioningPerks.map(perk => {
                    const isCompleted = completedConditioningIds.includes(perk.id);
                    return (
                      <option key={perk.id} value={perk.id} disabled={isCompleted}>
                        {perk.name}{isCompleted ? ' (Complete)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Perk Info */}
              {selectedPerk && (
                <>
                  <div className="bg-slate-700 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{selectedPerk.name}</span>
                      <span className="text-sm text-slate-400">Level 0 → 1</span>
                    </div>

                    {/* Progress Pips */}
                    <div className="flex gap-1.5 mb-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <div
                          key={n}
                          className={`flex-1 h-3 rounded ${
                            n === 1 ? 'bg-green-500/50 animate-pulse' : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-slate-300 text-sm">
                      {selectedPerk.description}
                    </p>

                    <div className="mt-2 text-xs text-blue-400">
                      Levels 1-4: +1 HP each | Level 5: +1 Max Wounds + Capstone
                    </div>
                  </div>

                  {/* Cost Display */}
                  <div className="bg-slate-700 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Cost per level:</span>
                      <span className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                        {cost} XP
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      All levels cost {character.maxWounds} XP (Total: {character.maxWounds * 5} XP)
                    </p>
                  </div>

                  {/* Attribute Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Select Attribute {selectedAttribute && <span className="text-blue-400">({selectedAttribute})</span>}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {attributeOptions.map(attr => (
                        <button
                          key={attr}
                          onClick={() => setSelectedAttribute(attr)}
                          className={`py-2 rounded font-semibold transition-colors ${
                            selectedAttribute === attr
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                          }`}
                        >
                          {Object.entries(ATTRIBUTE_MAP).find(([, v]) => v === attr)?.[0] || attr}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold"
          >
            Cancel
          </button>
          {activeConditioning ? (
            <button
              onClick={handleLevelUp}
              disabled={!selectedAttribute || !canAfford}
              className={`flex-1 px-4 py-2 rounded font-semibold ${
                !selectedAttribute || !canAfford
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-green-700 hover:bg-green-600 text-white'
              }`}
            >
              {!canAfford ? 'Not Enough XP' : `Train Level ${nextLevel}`}
            </button>
          ) : (
            <button
              onClick={handleStartConditioning}
              disabled={!selectedPerk || !selectedAttribute || !canAfford}
              className={`flex-1 px-4 py-2 rounded font-semibold ${
                !selectedPerk || !selectedAttribute || !canAfford
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-green-700 hover:bg-green-600 text-white'
              }`}
            >
              {!canAfford ? 'Not Enough XP' : 'Start Conditioning'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
