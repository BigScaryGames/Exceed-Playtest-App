import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Character, Weapon, InventoryItem } from '@/types/character';
import { ARMOR_TYPES } from '@/data/armor';
import { WEAPONS } from '@/data/weapons';
import { SHIELDS } from '@/data/shields';
import { Modal } from '@/components/shared';
import { AddPerkModal } from '@/components/modals/AddPerkModal';
import { DiceRollerModal, RollData } from '@/components/modals/DiceRollerModal';
import {
  getEquippedWeapons,
  getEquippedArmor,
  getEquippedShield,
  getWeaponData,
  getArmorData,
  getShieldData
} from '@/utils/inventory';

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

  // Get domain level
  const domainLevel = weaponData.domain ? character.weaponDomains[weaponData.domain] : 0;

  // Calculate attack attribute
  let attackAttr = character.stats.AG; // Default: Agility
  if (weaponData.domain === 'Ar') {
    // Bows use Perception
    attackAttr = character.stats.PR;
  } else if (weaponData.finesse && character.stats.DX > character.stats.AG) {
    // Finesse weapons use Dexterity if higher
    attackAttr = character.stats.DX;
  } else if (weaponData.traits.includes('Heavy') && character.stats.MG > character.stats.AG) {
    // Heavy weapons use Might if higher than Agility
    attackAttr = character.stats.MG;
  }

  // Number of damage dice based on domain level
  const getDamageDiceCount = (level: number): number => {
    if (level >= 5) return 3;
    if (level >= 3) return 2;
    return 1;
  };

  const damageDiceCount = getDamageDiceCount(domainLevel);

  // Parse damage die (e.g., "d6", "d12+1", "4+Might")
  const parseDamageDie = (damageStr: string): { die: number, bonus: number, isBow: boolean } => {
    // Check if it's bow damage format (e.g., "4+Might", "5+Might")
    if (damageStr.includes('+Might')) {
      const baseValue = parseInt(damageStr.split('+')[0]);
      return { die: 0, bonus: baseValue + character.stats.MG, isBow: true };
    }
    // Standard dice format
    if (damageStr.includes('+')) {
      const [die, bonus] = damageStr.split('+');
      return { die: parseInt(die.replace('d', '')), bonus: parseInt(bonus) + character.stats.MG, isBow: false };
    }
    return { die: parseInt(damageStr.replace('d', '')), bonus: character.stats.MG, isBow: false };
  };

  const handleOpenAttackRoll = () => {
    const { die, bonus, isBow } = parseDamageDie(weaponData.damage);

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
          <div className="text-slate-400 text-xs">{label} • {weaponData.domain || 'No Domain'} {domainLevel}</div>
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
}

export const CombatTab: React.FC<CombatTabProps> = ({ character, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartHP, setDragStartHP] = useState(0);
  const [showExtraHPAttributeModal, setShowExtraHPAttributeModal] = useState(false);
  const [showAddCombatPerkModal, setShowAddCombatPerkModal] = useState(false);
  const [expandedCombatPerkIndex, setExpandedCombatPerkIndex] = useState<number | null>(null);
  const [isRollerOpen, setIsRollerOpen] = useState(false);
  const [rollData, setRollData] = useState<RollData | null>(null);

  // Get armor stats - with backward compatibility
  const equippedArmor = getEquippedArmor(character);
  const armorData = equippedArmor
    ? (getArmorData(equippedArmor) || ARMOR_TYPES['None'])
    : (character.armorType ? ARMOR_TYPES[character.armorType] : ARMOR_TYPES['None']);
  const armorBonus = armorData.bonus;
  const meetsArmorReq = character.stats.MG >= armorData.mightReq;
  const armorPenalty = meetsArmorReq ? armorData.penaltyMet : armorData.penalty;

  // Calculate Speed
  const runningSkill = character.skills.find(s => s.name === 'Running');
  const runningBonus = runningSkill ? Math.floor(runningSkill.level / 2) : 0;
  const speedWithArmor = 5 + character.stats.AG + runningBonus + armorPenalty;
  const speedWithoutArmor = 5 + character.stats.AG + runningBonus;

  // Calculate HP values with effective max wounds
  const calculateHP = () => {
    const effectiveMaxWounds = character.maxWounds - character.markedWounds;
    const maxStamina = (armorBonus + character.stats.EN) * effectiveMaxWounds;
    const maxHealth = (character.hpPerWound * effectiveMaxWounds) + character.extraHP;
    const currentStamina = character.currentStamina !== null ? character.currentStamina : maxStamina;
    const currentHealth = character.currentHealth !== null ? character.currentHealth : maxHealth;

    return {
      maxStamina,
      maxHealth,
      currentStamina,
      currentHealth,
      totalMax: maxStamina + maxHealth,
      totalCurrent: currentStamina + currentHealth,
      effectiveMaxWounds
    };
  };

  const hp = calculateHP();

  const handleBuyExtraHP = (attribute: string) => {
    const cost = character.maxWounds;

    if (character.combatXP >= cost) {
      const newExtraHPCount = character.extraHPCount + 1;
      const newExtraHPHistory = [...character.extraHPHistory, { attribute, cost }];

      // Check if we need to consolidate
      if (newExtraHPCount >= 5) {
        const newExtraWoundCount = character.extraWoundCount + 1;
        const extraWoundName = `Extra Wound[${newExtraWoundCount}]`;

        // Remove ExtraHP entries from progression log
        const updatedLog = character.progressionLog.filter(entry => entry.type !== 'extraHP');

        // Add 5 Extra Wound entries (one for each ExtraHP purchase)
        const extraWoundEntries = newExtraHPHistory.map((hp, index) => ({
          type: 'extraWound' as const,
          name: extraWoundName,
          level: index + 1,
          attribute: hp.attribute,
          cost: hp.cost
        }));

        onUpdate({
          ...character,
          combatXP: character.combatXP - cost,
          maxWounds: character.maxWounds + 1,
          extraHP: 0,
          extraHPCount: 0,
          extraHPHistory: [],
          extraWoundCount: newExtraWoundCount,
          progressionLog: [...updatedLog, ...extraWoundEntries]
        });
      } else {
        // Just add ExtraHP
        onUpdate({
          ...character,
          combatXP: character.combatXP - cost,
          extraHP: character.extraHP + 1,
          extraHPCount: newExtraHPCount,
          extraHPHistory: newExtraHPHistory,
          progressionLog: [...character.progressionLog, {
            type: 'extraHP',
            name: 'Extra HP',
            level: newExtraHPCount,
            attribute: attribute,
            cost: cost
          }]
        });
      }

      setShowExtraHPAttributeModal(false);
    }
  };

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

  const toggleCombatPerkExpand = (index: number) => {
    setExpandedCombatPerkIndex(expandedCombatPerkIndex === index ? null : index);
  };

  const handleDeleteCombatPerk = (index: number) => {
    const perk = character.combatPerks[index];
    const updatedPerks = character.combatPerks.filter((_, i) => i !== index);

    // Recalculate domain level after removing this perk
    const remainingDomainXP = character.progressionLog
      .filter(entry => entry.type === 'combatPerk' &&
                      entry.domain === perk.domain &&
                      !(entry.name === perk.name && entry.cost === perk.cost))
      .reduce((sum, entry) => sum + (entry.cost || 0), 0);

    // Domain thresholds differ between Spell and weapon domains
    let newLevel = 0;
    if (perk.domain === 'Spell') {
      // Spell domain thresholds: 10/30/60/100/150
      if (remainingDomainXP >= 150) newLevel = 5;
      else if (remainingDomainXP >= 100) newLevel = 4;
      else if (remainingDomainXP >= 60) newLevel = 3;
      else if (remainingDomainXP >= 30) newLevel = 2;
      else if (remainingDomainXP >= 10) newLevel = 1;
    } else {
      // Weapon domain thresholds: 5/15/30/50/75
      if (remainingDomainXP >= 75) newLevel = 5;
      else if (remainingDomainXP >= 50) newLevel = 4;
      else if (remainingDomainXP >= 30) newLevel = 3;
      else if (remainingDomainXP >= 15) newLevel = 2;
      else if (remainingDomainXP >= 5) newLevel = 1;
    }

    const newDomains = { ...character.weaponDomains };
    newDomains[perk.domain] = newLevel;

    // Remove from progression log
    const updatedLog = [...character.progressionLog];
    for (let i = updatedLog.length - 1; i >= 0; i--) {
      if (updatedLog[i].type === 'combatPerk' &&
          updatedLog[i].name === perk.name &&
          updatedLog[i].cost === perk.cost &&
          updatedLog[i].attribute === perk.attribute) {
        updatedLog.splice(i, 1);
        break;
      }
    }

    onUpdate({
      ...character,
      combatPerks: updatedPerks,
      weaponDomains: newDomains,
      combatXP: character.combatXP + perk.cost,
      progressionLog: updatedLog
    });

    setExpandedCombatPerkIndex(null);
  };

  // Calculate bar widths
  const isNegative = hp.totalCurrent < 0;
  const maxNegativeHP = character.maxWounds * character.hpPerWound;

  let healthPercent = 0;
  let staminaPercent = 0;
  let negativePercent = 0;

  if (!isNegative) {
    // Positive HP - show stamina (yellow) and health (red)
    healthPercent = hp.maxHealth > 0
      ? Math.min(100, (hp.currentHealth / hp.maxHealth) * 100)
      : 0;
    staminaPercent = hp.maxStamina > 0
      ? Math.min(100, (hp.currentStamina / hp.maxStamina) * 100)
      : 0;
  } else {
    // Negative HP - show as dark red from 0 going left
    negativePercent = maxNegativeHP > 0
      ? Math.min(100, (Math.abs(hp.totalCurrent) / maxNegativeHP) * 100)
      : 0;
  }

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

  // Calculate Parry - use better of all weapons
  const calculateParryForWeapon = (weaponData: Weapon) => {
    if (!weaponData.domain) return 0;
    // Can't parry with bows (Archery domain)
    if (weaponData.domain === 'Ar') return 0;
    const weaponDomain = character.weaponDomains[weaponData.domain] || 0;
    const parryBase = weaponData.finesse && character.stats.DX > character.stats.AG
      ? character.stats.DX
      : character.stats.AG;
    return parryBase + weaponDomain;
  };

  const parry = Math.max(0, ...equippedWeapons.map(w => calculateParryForWeapon(w.weaponData)));

  // Calculate Block (based on shield) - with backward compatibility
  const equippedShieldItem = getEquippedShield(character);
  const shieldData = equippedShieldItem
    ? (getShieldData(equippedShieldItem) || SHIELDS['None'])
    : (character.equippedShield ? SHIELDS[character.equippedShield] : SHIELDS['None']);
  const shieldDomain = character.weaponDomains['Sh'];
  let block = 0;
  if (shieldData.defenseBonus > 0) {
    // Light shields use Agility, Medium use Endurance, Heavy use Might
    let blockBase = character.stats.AG; // Light default
    if (shieldData.type === 'Medium') {
      blockBase = character.stats.EN;
    } else if (shieldData.type === 'Heavy') {
      blockBase = character.stats.MG;
    }
    block = blockBase + shieldDomain + shieldData.defenseBonus;
  }

  // Calculate Dodge
  const dodge = character.stats.AG + character.stats.PR + (armorPenalty || 0);

  // Calculate Endure
  const endure = character.stats.EN + character.stats.WI;

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
            <span className={`text-3xl font-bold ${isNegative ? 'text-red-400' : ''}`}>
              {hp.totalCurrent}
            </span>
            <span className="text-slate-400 text-lg"> / {hp.totalMax}</span>
          </div>
          <div className="text-right text-sm">
            {!isNegative && (
              <>
                <div className="text-yellow-400">Stamina: {hp.currentStamina}</div>
                <div className="text-red-400">Health: {hp.currentHealth}</div>
              </>
            )}
            {isNegative && (
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
          {!isNegative ? (
            <>
              {/* Stamina bar (yellow) */}
              <div
                className="absolute inset-0 bg-yellow-600 transition-all"
                style={{ width: `${staminaPercent}%` }}
              />
              {/* Health bar (red) */}
              <div
                className="absolute inset-0 bg-red-600 transition-all"
                style={{
                  width: `${healthPercent}%`,
                  left: `${staminaPercent}%`
                }}
              />
            </>
          ) : (
            /* Negative HP bar (dark red from left) */
            <div
              className="absolute inset-0 bg-red-900 transition-all"
              style={{
                width: `${negativePercent}%`
              }}
            />
          )}

          {/* Text overlay */}
          <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm drop-shadow-md pointer-events-none">
            {!isNegative ? (
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
          Armor: <span className="text-white font-semibold">+{armorBonus}</span>
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

              {/* Extra HP */}
              <div className="bg-slate-700 rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-slate-400 text-xs">Extra HP</div>
                  <div className="text-green-400 text-sm font-bold">{character.extraHP}</div>
                </div>
                <div className="text-slate-400 text-xs mb-2">
                  {character.extraHPCount}/5 to wound
                </div>
                <button
                  onClick={() => setShowExtraHPAttributeModal(true)}
                  disabled={character.combatXP < character.maxWounds}
                  className={`w-full rounded py-1 text-white text-xs font-semibold ${
                    character.combatXP < character.maxWounds
                      ? 'bg-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-green-700 hover:bg-green-600'
                  }`}
                >
                  Buy ({character.maxWounds} CP)
                </button>
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

      {/* Weapon Domains Block - Compact */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-bold text-white mb-3">Weapon Domains</h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(character.weaponDomains).map(([domain, level]) => (
            <div key={domain} className="bg-slate-700 rounded px-2 py-1 text-center">
              <div className="text-white text-sm">
                <span className="text-slate-400">{domain}</span> {level}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Combat Perks Section */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-bold text-white">Combat Perks</h4>
          <button
            onClick={() => setShowAddCombatPerkModal(true)}
            className="bg-slate-700 hover:bg-slate-600 rounded-lg p-1.5"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {character.combatPerks.map((perk, index) => (
            <div key={index} className="bg-slate-700 rounded overflow-hidden">
              <div
                className="p-3 cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => toggleCombatPerkExpand(index)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-white font-medium">{perk.name}</span>
                    <div className="text-sm mt-1">
                      <span className="text-green-400">{perk.cost} XP</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-blue-400">{perk.domain}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-purple-400">{perk.attribute}</span>
                    </div>
                  </div>
                </div>
              </div>
              {expandedCombatPerkIndex === index && (
                <div className="px-3 pb-3 border-t border-slate-600">
                  {perk.description && (
                    <p className="text-slate-300 text-sm mt-2 mb-3">{perk.description}</p>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCombatPerk(index);
                    }}
                    className="w-full bg-red-700 hover:bg-red-600 rounded py-2 text-white font-semibold"
                  >
                    Delete (Refund {perk.cost} XP)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dice Roller Modal */}
      <DiceRollerModal
        isOpen={isRollerOpen}
        onClose={() => setIsRollerOpen(false)}
        rollData={rollData}
      />

      {/* Combat Perk Modal */}
      <AddPerkModal
        isOpen={showAddCombatPerkModal}
        onClose={() => setShowAddCombatPerkModal(false)}
        character={character}
        onUpdate={onUpdate}
        category="combat"
      />

      {/* ExtraHP Attribute Selection Modal */}
      <Modal
        isOpen={showExtraHPAttributeModal}
        onClose={() => setShowExtraHPAttributeModal(false)}
        title="Buy Extra HP"
      >
        <p className="text-slate-400 text-sm mb-2 text-center">
          Select which attribute to apply points to:
        </p>
        <p className="text-slate-400 text-xs mb-4 text-center">
          Cost: {character.maxWounds} CP
          <span className="ml-2">
            ({character.combatXP} → {character.combatXP - character.maxWounds} Combat XP)
          </span>
        </p>
        <p className="text-blue-400 text-xs mb-4 text-center">
          Progress: {character.extraHPCount + 1}/5 to Extra Wound
        </p>

        <div className="space-y-2 mb-4">
          <button
            onClick={() => handleBuyExtraHP('Endurance')}
            className="w-full bg-slate-700 hover:bg-slate-600 rounded py-3 text-white font-semibold transition-colors"
          >
            Endurance
          </button>
          <button
            onClick={() => handleBuyExtraHP('Will')}
            className="w-full bg-slate-700 hover:bg-slate-600 rounded py-3 text-white font-semibold transition-colors"
          >
            Will
          </button>
        </div>

        <button
          onClick={() => setShowExtraHPAttributeModal(false)}
          className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
        >
          Cancel
        </button>
      </Modal>
    </div>
  );
};
