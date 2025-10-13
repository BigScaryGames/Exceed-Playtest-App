import React, { useState, useEffect } from 'react';

export interface RollData {
  type: string; // e.g., "Attack - Longsword", "Parry", "Skill: Athletics"
  baseModifier: number;
  // For skills with multiple attributes
  attributeOptions?: { label: string; value: number }[];
  // For damage rolls (not 2d10)
  isDamageRoll?: boolean;
  damageDice?: { count: number; sides: number };
  damageBonus?: number;
  // For attack rolls that have associated damage
  damageRollData?: {
    damageDice: { count: number; sides: number };
    damageBonus: number;
  };
}

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rollData: RollData | null;
}

const rollDice = (sides: number): number => Math.floor(Math.random() * sides) + 1;

interface RollResult {
  dice: [number, number, number]; // 3 individual 1d10 dice
  normal: number;      // Sum of first two dice
  disadvantage: number; // Sum of lowest two dice
  advantage: number;    // Sum of highest two dice
}

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({
  isOpen,
  onClose,
  rollData
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState<number | null>(null);
  const [showingDamage, setShowingDamage] = useState(false);
  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [damageRoll, setDamageRoll] = useState<{ rolls: number[]; total: number; breakdown: string } | null>(null);

  // Determine if we're showing damage roll
  const currentRollData: RollData | null = rollData && (showingDamage && rollData.damageRollData
    ? {
        type: rollData.type.replace('Attack', 'Damage'),
        baseModifier: rollData.damageRollData.damageBonus,
        isDamageRoll: true,
        damageDice: rollData.damageRollData.damageDice,
        damageBonus: rollData.damageRollData.damageBonus
      }
    : rollData);

  // Get effective modifier (for skills with multiple attributes)
  const effectiveModifier = currentRollData
    ? (selectedAttribute !== null ? selectedAttribute : currentRollData.baseModifier)
    : 0;

  // Perform a standard roll (3 individual 1d10)
  const performRoll = (): RollResult => {
    const dice: [number, number, number] = [rollDice(10), rollDice(10), rollDice(10)];

    // Sort dice to find combinations
    const sorted = [...dice].sort((a, b) => a - b);

    return {
      dice,
      normal: dice[0] + dice[1],           // First two dice
      disadvantage: sorted[0] + sorted[1], // Lowest two dice
      advantage: sorted[1] + sorted[2]     // Highest two dice
    };
  };

  // Perform damage roll
  const performDamageRoll = () => {
    if (!currentRollData || !currentRollData.damageDice) return;

    const isBowDamage = currentRollData.damageDice.sides === 1;

    if (isBowDamage) {
      // Bow damage: fixed value (stored in count)
      const total = currentRollData.damageDice.count;
      setDamageRoll({
        rolls: [total],
        total,
        breakdown: `${total}`
      });
    } else {
      // Standard damage rolls: roll dice
      const rolls: number[] = [];
      for (let i = 0; i < currentRollData.damageDice.count; i++) {
        rolls.push(rollDice(currentRollData.damageDice.sides));
      }
      const diceTotal = rolls.reduce((sum, r) => sum + r, 0);
      const bonus = currentRollData.damageBonus || 0;
      const total = diceTotal + bonus;

      setDamageRoll({
        rolls,
        total,
        breakdown: `${rolls.join(' + ')}${bonus > 0 ? ` + ${bonus}` : ''} = ${total}`
      });
    }
  };

  // Auto-roll on open or when switching between attack/damage
  useEffect(() => {
    if (isOpen && currentRollData && !currentRollData.isDamageRoll) {
      setRollResult(performRoll());
    }
  }, [isOpen, effectiveModifier, showingDamage]);

  // Auto-roll damage when switching to damage view
  useEffect(() => {
    if (isOpen && currentRollData && currentRollData.isDamageRoll) {
      performDamageRoll();
    }
  }, [isOpen, showingDamage]);

  const handleReroll = () => {
    if (!currentRollData) return;
    if (currentRollData.isDamageRoll) {
      performDamageRoll();
    } else {
      setRollResult(performRoll());
    }
  };

  const handleClose = () => {
    setRollResult(null);
    setDamageRoll(null);
    setSelectedAttribute(null);
    setShowingDamage(false);
    onClose();
  };

  if (!isOpen || !rollData || !currentRollData) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-slate-800 rounded-lg max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <h3 className="text-xl font-bold text-white text-center">{currentRollData.type}</h3>
        </div>

        <div className="p-4">
          {/* Switch between Attack and Damage */}
          {rollData.damageRollData && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowingDamage(false);
                  setDamageRoll(null);
                }}
                className={`py-2 px-4 rounded font-semibold transition-colors ${
                  !showingDamage
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Attack Roll
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowingDamage(true);
                  setRollResult(null);
                }}
                className={`py-2 px-4 rounded font-semibold transition-colors ${
                  showingDamage
                    ? 'bg-red-700 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Damage Roll
              </button>
            </div>
          )}

          {/* Attribute Selection for Skills */}
          {currentRollData.attributeOptions && currentRollData.attributeOptions.length > 1 && !currentRollData.isDamageRoll && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Select Attribute
              </label>
              <div className="grid grid-cols-2 gap-2">
                {currentRollData.attributeOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAttribute(option.value);
                    }}
                    className={`py-2 px-4 rounded font-semibold transition-colors ${
                      (selectedAttribute !== null ? selectedAttribute === option.value : index === 0)
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {option.label} (+{option.value})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Standard Roll Display */}
          {!currentRollData.isDamageRoll && rollResult && (
            <div className="space-y-4">
              {/* Top Row: Raw Dice */}
              <div className="grid grid-cols-3 gap-2">
                {/* Die 1, 2, 3 - Individual 1d10 rolls */}
                {rollResult.dice.map((die, idx) => {
                  // Check if this die value appears more than once (doubles/triples)
                  const count = rollResult.dice.filter(d => d === die).length;
                  const isDouble = count >= 2;
                  return (
                    <div
                      key={idx}
                      className={`rounded-lg p-3 text-center ${
                        isDouble
                          ? 'bg-amber-900/50 border-2 border-amber-500'
                          : 'bg-slate-700 border border-slate-600'
                      }`}
                    >
                      <div className="text-xs text-slate-400 font-semibold mb-1">
                        Die {idx + 1} {isDouble ? '🎲' : ''}
                      </div>
                      <div className="text-3xl font-bold text-white">{die}</div>
                    </div>
                  );
                })}
              </div>

              {/* Results - Click to reroll */}
              <div
                className="space-y-3 cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                    handleReroll();
                  }
                }}
              >
                {/* Normal Result - Center, Large */}
                {(() => {
                  const normalResult = rollResult.normal + effectiveModifier;
                  const isCrit = rollResult.dice[0] === rollResult.dice[1];
                  return (
                    <div className={`rounded-lg p-4 text-center ${
                      isCrit
                        ? 'bg-amber-900/50 border-2 border-amber-500'
                        : 'bg-blue-900/50 border-2 border-blue-500'
                    }`}>
                      <div className="text-7xl font-bold text-white">{normalResult}</div>
                      <div className="text-xs text-slate-400 mt-2">
                        {rollResult.dice[0]} + {rollResult.dice[1]} + {effectiveModifier}
                      </div>
                    </div>
                  );
                })()}

                {/* Adv and Disadv - Same Line */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Disadvantage */}
                  {(() => {
                    const disadvResult = rollResult.disadvantage + effectiveModifier;
                    const sorted = [...rollResult.dice].sort((a, b) => a - b);
                    const isCrit = sorted[0] === sorted[1];
                    return (
                      <div className={`rounded-lg p-3 ${
                        isCrit
                          ? 'bg-amber-900/50 border-2 border-amber-500'
                          : 'bg-red-900/30 border border-red-700'
                      }`}>
                        <div className="text-sm text-red-300 font-semibold mb-1">Disadv</div>
                        <div className="text-4xl font-bold text-white text-center">{disadvResult}</div>
                        <div className="text-xs text-slate-400 mt-1 text-center">
                          {sorted[0]} + {sorted[1]} + {effectiveModifier}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Advantage */}
                  {(() => {
                    const advResult = rollResult.advantage + effectiveModifier;
                    const sorted = [...rollResult.dice].sort((a, b) => b - a);
                    const isCrit = sorted[0] === sorted[1];
                    return (
                      <div className={`rounded-lg p-3 ${
                        isCrit
                          ? 'bg-amber-900/50 border-2 border-amber-500'
                          : 'bg-green-900/30 border border-green-700'
                      }`}>
                        <div className="text-sm text-green-300 font-semibold mb-1">Adv</div>
                        <div className="text-4xl font-bold text-white text-center">{advResult}</div>
                        <div className="text-xs text-slate-400 mt-1 text-center">
                          {sorted[0]} + {sorted[1]} + {effectiveModifier}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Reroll Hint */}
                <div className="text-center text-slate-500 text-xs mt-2">
                  Click to reroll
                </div>
              </div>
            </div>
          )}

          {/* Damage Roll Display */}
          {currentRollData.isDamageRoll && damageRoll && (
            <div
              className="bg-red-900/30 border-2 border-red-700 rounded-lg p-6 text-center cursor-pointer"
              onClick={handleReroll}
            >
              <div className="text-sm text-red-300 font-semibold mb-2">DAMAGE</div>
              <div className="text-6xl font-bold text-white mb-3">{damageRoll.total}</div>
              <div className="text-sm text-slate-300 mb-2">
                {damageRoll.breakdown}
              </div>
              <div className="text-center text-slate-500 text-xs mt-2">
                Click to reroll
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
