import React, { useState, useEffect } from 'react';
import { Character, Weapon, InventoryItem } from '@/types/character';
import type { PerkDatabase } from '@/types/perks';
import { WEAPONS } from '@/data/weapons';
import { ConditioningPerkModal } from '@/components/modals/ConditioningPerkModal';
import { DiceRollerModal, RollData } from '@/components/modals/DiceRollerModal';
import {
  getEquippedWeapons,
  getWeaponData
} from '@/utils/inventory';
import {
  calculateAttackAttribute,
  calculateDamageDiceCount,
  parseDamageString,
  calculateParryFromEquipped,
  calculateBlockFromEquipped,
  calculateDodgeFromEquipped,
  calculateHPValues,
  calculateEndure
} from '@/utils/calculations';
import {
  getActiveAbilitiesWithInheritedTags,
  getActiveEffectsWithInheritedTags,
  ActiveAbility,
  ActiveEffect
} from '@/utils/effectCalculator';
import { Swords, Plus } from 'lucide-react';

// Ability/Effect card component
interface AbilityEffectCardProps {
  item: ActiveAbility | ActiveEffect;
  isAbility: boolean;
  onDelete?: () => void;
}
const AbilityEffectCard: React.FC<AbilityEffectCardProps> = ({ item, isAbility, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const colorClass = isAbility ? 'blue' : 'purple';

  return (
    <div className="bg-slate-700 rounded overflow-hidden">
      <div
        className="p-3 cursor-pointer hover:bg-slate-600 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <span className="text-white font-medium text-sm">{item.name}</span>
            <div className="text-slate-400 text-xs mt-0.5">
              from {item.sourcePerk}
            </div>
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end ml-2">
              {item.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className={`text-xs bg-${colorClass}-900/50 text-${colorClass}-300 px-1.5 py-0.5 rounded`}
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="text-xs text-slate-500">+{item.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-600">
          <div className="text-slate-300 text-sm mt-2 whitespace-pre-wrap">
            {item.effect}
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag, i) => (
                <span
                  key={i}
                  className={`text-xs bg-${colorClass}-900/50 text-${colorClass}-300 px-1.5 py-0.5 rounded`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-full mt-3 bg-red-700 hover:bg-red-600 rounded py-2 text-white text-sm font-semibold"
            >
              Remove {item.sourcePerk}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// WeaponRollSection Component
interface WeaponRollSectionProps {
  weaponName: string;
  weaponData: Weapon;
  character: Character;
  label: string;
  onOpenRoller: (rollData: RollData) => void;
}

const WeaponRollSection: React.FC<WeaponRollSectionProps> = ({
  weaponName,
  weaponData,
  character,
  label,
  onOpenRoller
}) => {

  // MS5: All weapons use Martial domain
  const domainLevel = weaponData.domain ? character.weaponDomains.Martial : 0;

  // Calculate attack attribute using utility function
  const attackAttr = calculateAttackAttribute(character, weaponData);

  // Number of damage dice based on domain level
  const damageDiceCount = calculateDamageDiceCount(domainLevel);

  const handleOpenAttackRoll = () => {
    const { die, bonus, isBow } = parseDamageString(weaponData.damage, character.stats.MG);

    onOpenRoller({
      type: `Attack - ${weaponName}`,
      baseModifier: domainLevel + attackAttr,
      damageRollData: {
        damageDice: { count: isBow ? bonus : damageDiceCount, sides: isBow ? 1 : die },
        damageBonus: isBow ? 0 : bonus
      }
    });
  };

  return (
    <div className="bg-slate-700 rounded p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-white font-medium text-sm">{weaponName}</div>
          <div className="text-slate-400 text-xs">{label} • Martial {domainLevel}</div>
        </div>
      </div>

      <button
        onClick={handleOpenAttackRoll}
        className="w-full bg-blue-600 hover:bg-blue-500 rounded py-2 text-white text-sm font-semibold"
      >
        Roll Attack / Damage
      </button>
    </div>
  );
};

interface CombatTabProps {
  character: Character;
  onUpdate: (character: Character) => void;
  perkDatabase: PerkDatabase | null;
}

export const CombatTab: React.FC<CombatTabProps> = ({ character, onUpdate, perkDatabase }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get abilities and effects with inherited tags
  const abilities = getActiveAbilitiesWithInheritedTags(character, perkDatabase);
  const effects = getActiveEffectsWithInheritedTags(character, perkDatabase);

  // Filter by #Combat tag
  const combatAbilities = abilities.filter(a => a.tags.includes('Combat'));
  const combatEffects = effects.filter(e => e.tags.includes('Combat'));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartHP, setDragStartHP] = useState(0);
  const [showConditioningModal, setShowConditioningModal] = useState(false);
  const [isRollerOpen, setIsRollerOpen] = useState(false);
  const [rollData, setRollData] = useState<RollData | null>(null);

  // Calculate HP values using utility function
  const hp = calculateHPValues(character);

  const setTotalHP = (newTotal: number) => {
    // Clamp at negative (max wounds × hp per wound)
    const minHP = -(character.maxWounds * character.hpPerWound);
    const clampedTotal = Math.max(minHP, newTotal);
    let newHealth: number, newStamina: number;

    if (clampedTotal <= 0) {
      // Negative or zero HP - all in health as negative
      newStamina = 0;
      newHealth = clampedTotal;
    } else if (clampedTotal <= hp.maxHealth) {
      // Only health, no stamina
      newStamina = 0;
      newHealth = clampedTotal;
    } else {
      // Full health, rest in stamina
      newHealth = hp.maxHealth;
      newStamina = Math.min(hp.maxStamina, clampedTotal - hp.maxHealth);
    }

    onUpdate({
      ...character,
      currentStamina: newStamina,
      currentHealth: newHealth
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartHP(hp.totalCurrent);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragStartHP(hp.totalCurrent);
    e.preventDefault();
    e.stopPropagation(); // Prevent parent swipe handlers
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const hpChange = Math.round(deltaX / 30); // 30 pixels = 1 HP
    setTotalHP(dragStartHP + hpChange);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStartX;
    const hpChange = Math.round(deltaX / 30); // 30 pixels = 1 HP
    setTotalHP(dragStartHP + hpChange);
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStartX, dragStartHP]);

  const handleReset = () => {
    onUpdate({
      ...character,
      currentStamina: null,
      currentHealth: null
    });
  };

  const handleDeleteCombatPerk = (index: number) => {
    const perk = character.combatPerks[index];
    const updatedPerks = character.combatPerks.filter((_, i) => i !== index);

    // Check if this is a completed conditioning perk
    const isConditioningPerk = perk.perkSnapshot?.tags?.includes('Conditioning') ||
      perk.name.includes('(Completed)');

    // Get the base perk name (without "(Completed)" suffix)
    const basePerkName = perk.name.replace(' (Completed)', '');

    let updatedLog = [...character.progressionLog];
    let totalRefund = 0;
    let shouldDecrementWounds = false;

    if (isConditioningPerk) {
      // For conditioning perks: remove ALL stagedPerk entries with this name
      // and the completion combatPerk entry
      updatedLog = character.progressionLog.filter(entry => {
        if (entry.type === 'stagedPerk' && entry.name === basePerkName) {
          totalRefund += entry.cost || 0;
          return false; // Remove this entry
        }
        if (entry.type === 'combatPerk' &&
            (entry.name === perk.name || entry.name === `${basePerkName} (Completed)`)) {
          return false; // Remove completion entry (cost is 0)
        }
        return true;
      });
      shouldDecrementWounds = true;
    } else {
      // Regular combat perk: just remove the single entry
      for (let i = updatedLog.length - 1; i >= 0; i--) {
        if (updatedLog[i].type === 'combatPerk' &&
            updatedLog[i].name === perk.name &&
            updatedLog[i].cost === perk.cost &&
            updatedLog[i].attribute === perk.attribute) {
          updatedLog.splice(i, 1);
          break;
        }
      }
      totalRefund = perk.cost;
    }

    // MS5: Recalculate Martial domain level from remaining perks
    const remainingMartialXP = updatedLog
      .filter(entry => entry.type === 'combatPerk' || entry.type === 'stagedPerk')
      .reduce((sum, entry) => sum + (entry.cost || 0), 0);

    // Martial domain thresholds: 10/30/60/100/150
    let newLevel = 0;
    if (remainingMartialXP >= 150) newLevel = 5;
    else if (remainingMartialXP >= 100) newLevel = 4;
    else if (remainingMartialXP >= 60) newLevel = 3;
    else if (remainingMartialXP >= 30) newLevel = 2;
    else if (remainingMartialXP >= 10) newLevel = 1;

    onUpdate({
      ...character,
      combatPerks: updatedPerks,
      weaponDomains: {
        ...character.weaponDomains,
        Martial: newLevel
      },
      maxWounds: shouldDecrementWounds ? character.maxWounds - 1 : character.maxWounds,
      combatXP: character.combatXP + totalRefund,
      progressionLog: updatedLog
    });
  };

  // Get equipped weapons - with backward compatibility
  const equippedWeaponsFromInventory = getEquippedWeapons(character);
  let equippedWeapons: Array<{ item: InventoryItem; weaponData: Weapon } | { name: string; weaponData: Weapon }> = [];

  if (equippedWeaponsFromInventory.length > 0) {
    // Use new inventory system
    equippedWeapons = equippedWeaponsFromInventory
      .map(item => {
        const weaponData = getWeaponData(item);
        return weaponData ? { item, weaponData } : null;
      })
      .filter((w): w is { item: InventoryItem; weaponData: Weapon } => w !== null);
  } else if (character.equippedWeapon1 || character.equippedWeapon2) {
    // Fallback to old system
    if (character.equippedWeapon1 && character.equippedWeapon1 !== 'None') {
      equippedWeapons.push({
        name: character.equippedWeapon1,
        weaponData: WEAPONS[character.equippedWeapon1] || WEAPONS['None']
      });
    }
    if (character.equippedWeapon2 && character.equippedWeapon2 !== 'None') {
      equippedWeapons.push({
        name: character.equippedWeapon2,
        weaponData: WEAPONS[character.equippedWeapon2] || WEAPONS['None']
      });
    }
  }

  // Calculate defense stats using utility functions
  const parry = calculateParryFromEquipped(character);
  const block = calculateBlockFromEquipped(character);
  const dodge = calculateDodgeFromEquipped(character);
  const endure = calculateEndure(character.stats.EN, character.stats.WI);

  // Open dice roller modal
  const handleOpenRoller = (data: RollData) => {
    setRollData(data);
    setIsRollerOpen(true);
  };

  // Defense roll handlers
  const handleDefenseRoll = (type: string, value: number) => {
    handleOpenRoller({
      type,
      baseModifier: value
    });
  };

  return (
    <div className="p-4">
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        {/* HP Display Header */}
        <div
          className="flex justify-between items-center mb-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="text-white">
            <span className={`text-3xl font-bold ${hp.isNegative ? 'text-red-400' : ''}`}>
              {hp.totalCurrent}
            </span>
            <span className="text-slate-400 text-lg"> / {hp.totalMax}</span>
          </div>
          <div className="text-right text-sm">
            {!hp.isNegative && (
              <>
                <div className="text-yellow-400">Stamina: {hp.currentStamina}</div>
                <div className="text-red-400">Health: {hp.currentHealth}</div>
              </>
            )}
            {hp.isNegative && (
              <div className="text-red-400">Below 0 HP!</div>
            )}
          </div>
        </div>

        {/* Draggable HP Bar */}
        <div
          className={`relative h-8 bg-slate-700 rounded-lg overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {!hp.isNegative ? (
            <>
              {/* Stamina bar (yellow) */}
              <div
                className="absolute inset-0 bg-yellow-600 transition-all"
                style={{ width: `${hp.staminaPercent}%` }}
              />
              {/* Health bar (red) */}
              <div
                className="absolute inset-0 bg-red-600 transition-all"
                style={{
                  width: `${hp.healthPercent}%`,
                  left: `${hp.staminaPercent}%`
                }}
              />
            </>
          ) : (
            /* Negative HP bar (dark red from right to left) */
            <div
              className="absolute inset-y-0 right-0 bg-red-900 transition-all"
              style={{
                width: `${hp.negativePercent}%`
              }}
            />
          )}

          {/* Text overlay */}
          <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm drop-shadow-md pointer-events-none">
            {!hp.isNegative ? (
              <>
                <span className="text-yellow-200">{hp.currentStamina}</span>
                <span className="mx-1">+</span>
                <span className="text-red-200">{hp.currentHealth}</span>
              </>
            ) : (
              <span className="text-red-200">{hp.totalCurrent} HP</span>
            )}
          </div>

          {/* Drag hint */}
          {!isDragging && (
            <div className="absolute bottom-0 right-2 text-xs text-slate-400 pointer-events-none">
              ← Drag →
            </div>
          )}
        </div>

        {/* Compact Stats Row */}
        <div className="mt-3 text-sm text-slate-300">
          Wounds: <span className="text-white font-semibold">{character.maxWounds}</span> |
          HP/Wound: <span className="text-white font-semibold">{character.hpPerWound}</span> |
          Armor: <span className="text-white font-semibold">+{hp.armorBonus}</span>
        </div>

        {/* Expanded Section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Marked Wounds */}
              <div className="bg-slate-700 rounded p-2">
                <div className="text-slate-400 text-xs mb-1">Marked Wounds</div>
                <input
                  type="number"
                  min="0"
                  max={character.maxWounds}
                  value={character.markedWounds}
                  onChange={(e) => onUpdate({...character, markedWounds: Math.min(character.maxWounds, Math.max(0, parseInt(e.target.value) || 0))})}
                  className="bg-slate-600 text-white text-lg font-bold w-16 px-2 py-1 rounded"
                />
              </div>

              {/* Conditioning Perks */}
              <div
                className="bg-slate-700 rounded p-2 cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => setShowConditioningModal(true)}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="text-slate-400 text-xs">Conditioning</div>
                  <div className="bg-green-700 rounded p-1">
                    <Plus size={14} />
                  </div>
                </div>
                {(character.stagedPerks && character.stagedPerks.length > 0) ? (
                  <div className="space-y-1">
                    {character.stagedPerks.slice(0, 1).map((perk) => (
                      <div key={perk.id}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-xs truncate flex-1">{perk.name}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <div
                                key={n}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  n <= perk.level ? 'bg-green-500' : 'bg-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {character.extraHP > 0 && (
                          <div className="text-blue-400 text-xs mt-0.5">
                            +{character.extraHP} HP
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs">Tap to start</div>
                )}
              </div>
            </div>

            {/* Reset Buttons Row */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleReset}
                className="bg-blue-700 hover:bg-blue-600 rounded py-2 text-white font-semibold"
              >
                Reset to Full HP
              </button>
              <button
                onClick={() => onUpdate({
                  ...character,
                  currentStamina: hp.maxStamina
                })}
                className="bg-cyan-700 hover:bg-cyan-600 rounded py-2 text-white font-semibold"
              >
                Reset Stamina
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Equipped Weapons with Rolls - Dynamic Grid */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-bold text-white mb-3">Equipped Weapons</h4>
        {equippedWeapons.length === 0 ? (
          <div className="text-slate-400 text-sm text-center py-2">
            No weapons equipped
          </div>
        ) : (
          <div className={`grid gap-3 ${
            equippedWeapons.length > 1
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1'
          }`}>
            {equippedWeapons.map((weapon, index) => {
              const weaponName = 'item' in weapon ? weapon.item.name : weapon.name;
              const label = index === 0 ? 'Primary' : 'Secondary';
              return (
                <WeaponRollSection
                  key={weaponName + index}
                  weaponName={weaponName}
                  weaponData={weapon.weaponData}
                  character={character}
                  label={label}
                  onOpenRoller={handleOpenRoller}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Defense Block - Rollable */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-bold text-white mb-3">Defense</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleDefenseRoll('Parry', parry)}
            className={`rounded py-3 text-white text-sm font-semibold ${
              parry
                ? 'bg-emerald-700 hover:bg-emerald-600'
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
          >
            Parry ({parry || '0'})
          </button>
          <button
            onClick={() => handleDefenseRoll('Block', block)}
            className={`rounded py-3 text-white text-sm font-semibold ${
              block
                ? 'bg-amber-700 hover:bg-amber-600'
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
          >
            Block ({block || '0'})
          </button>
          <button
            onClick={() => handleDefenseRoll('Dodge', dodge)}
            className="bg-indigo-700 hover:bg-indigo-600 rounded py-3 text-white text-sm font-semibold"
          >
            Dodge ({dodge})
          </button>
          <button
            onClick={() => handleDefenseRoll('Endure', endure)}
            className="bg-purple-700 hover:bg-purple-600 rounded py-3 text-white text-sm font-semibold"
          >
            Endure ({endure})
          </button>
        </div>
      </div>

      {/* Martial Abilities & Effects Section */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <div className="px-4 py-3 bg-slate-750 -mx-4 -mt-4 mb-4 flex items-center gap-2 border-b border-slate-700">
          <Swords size={18} className="text-slate-300" />
          <h3 className="text-white font-semibold">Martial Abilities & Effects</h3>
          <span className="text-slate-400 text-sm ml-auto">
            {combatAbilities.length} abilities, {combatEffects.length} effects
          </span>
        </div>
        {combatAbilities.length === 0 && combatEffects.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">
            No abilities or effects from #Combat perks. Add perks in the Perks tab.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Abilities Column */}
            <div>
              <h4 className="text-blue-400 text-sm font-semibold mb-2">
                Abilities ({combatAbilities.length})
              </h4>
              {combatAbilities.length === 0 ? (
                <div className="text-slate-500 text-xs text-center py-2">No abilities</div>
              ) : (
                <div className="space-y-2">
                  {combatAbilities.map((ability, index) => (
                    <AbilityEffectCard
                      key={`combat-ability-${index}`}
                      item={ability}
                      isAbility={true}
                      onDelete={() => {
                        // Find the perk index by name
                        const perkIndex = character.combatPerks.findIndex(p => p.name === ability.sourcePerk);
                        if (perkIndex !== -1) handleDeleteCombatPerk(perkIndex);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            {/* Effects Column */}
            <div>
              <h4 className="text-purple-400 text-sm font-semibold mb-2">
                Effects ({combatEffects.length})
              </h4>
              {combatEffects.length === 0 ? (
                <div className="text-slate-500 text-xs text-center py-2">No effects</div>
              ) : (
                <div className="space-y-2">
                  {combatEffects.map((effect, index) => (
                    <AbilityEffectCard
                      key={`combat-effect-${index}`}
                      item={effect}
                      isAbility={false}
                      onDelete={() => {
                        // Find the perk index by name
                        const perkIndex = character.combatPerks.findIndex(p => p.name === effect.sourcePerk);
                        if (perkIndex !== -1) handleDeleteCombatPerk(perkIndex);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dice Roller Modal */}
      <DiceRollerModal
        isOpen={isRollerOpen}
        onClose={() => setIsRollerOpen(false)}
        rollData={rollData}
      />

      {/* Conditioning Perk Modal */}
      <ConditioningPerkModal
        isOpen={showConditioningModal}
        onClose={() => setShowConditioningModal(false)}
        character={character}
        onUpdate={onUpdate}
        perkDatabase={perkDatabase}
      />
    </div>
  );
};
