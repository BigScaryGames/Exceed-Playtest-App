import React, { useState, useMemo, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Character, PerkType } from '@/types/character';
import type { PerkDatabase, Perk } from '@/types/perks';
import { PerkCard } from '@/components/shared/PerkCard';
import { getAllPerks, getPerksByType } from '@/data/perkLoader';
import { AttributeSelector } from '@/components/shared/AttributeSelector';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface PerkBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdate: (character: Character) => void;
  perkDatabase: PerkDatabase | null;
  initialCategory?: PerkType | null;
}

type ViewMode = 'all' | 'combat' | 'magic' | 'skill' | 'create';

export const PerkBrowserModal: React.FC<PerkBrowserModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdate,
  perkDatabase,
  initialCategory = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ViewMode>(
    initialCategory ? (initialCategory.charAt(0).toUpperCase() + initialCategory.slice(1)) as ViewMode : 'all'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOnlyLearnable, setShowOnlyLearnable] = useState(true);
  const [expandedPerkId, setExpandedPerkId] = useState<string | null>(null);
  const [pendingPerk, setPendingPerk] = useState<Perk | null>(null);
  const [showAttributeSelector, setShowAttributeSelector] = useState(false);
  
  // Custom perk form state
  const [customPerkName, setCustomPerkName] = useState('');
  const [customPerkType, setCustomPerkType] = useState<PerkType>('Combat');
  const [customPerkCost, setCustomPerkCost] = useState('0');
  const [customPerkFree, setCustomPerkFree] = useState(false);
  const [customPerkIsFlaw, setCustomPerkIsFlaw] = useState(false);
  const [customPerkAttribute, setCustomPerkAttribute] = useState('');
  const [customPerkEffects, setCustomPerkEffects] = useState('');
  const [customPerkDescription, setCustomPerkDescription] = useState('');

  // Reset category when modal opens with initialCategory
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(initialCategory ? (initialCategory.charAt(0).toUpperCase() + initialCategory.slice(1)) as ViewMode : 'all');
      setSearchQuery('');
      setSelectedTags([]);
      setExpandedPerkId(null);
      // Reset custom perk form
      setCustomPerkName('');
      setCustomPerkType('Combat');
      setCustomPerkCost('0');
      setCustomPerkFree(false);
      setCustomPerkAttribute('');
      setCustomPerkEffects('');
      setCustomPerkDescription('');
    }
  }, [isOpen, initialCategory]);

  // Handle custom perk creation
  const handleCreateCustomPerk = () => {
    if (!customPerkName.trim() || !customPerkAttribute) {
      alert('Please fill in perk name and attribute');
      return;
    }

    const isFlaw = customPerkIsFlaw;
    const cost = customPerkFree ? 0 : (parseInt(customPerkCost) || 0);
    const xpType = customPerkType === 'Skill' ? 'social' : 'combat';
    const availableXP = xpType === 'social' ? character.socialXP : character.combatXP;

    // Flaws grant XP, perks cost XP
    const xpChange = isFlaw ? Math.abs(cost) : (customPerkFree ? 0 : cost);
    
    if (!isFlaw && !customPerkFree && availableXP < cost) {
      alert(`Not enough ${xpType === 'social' ? 'Skill' : 'Combat'} XP. Need ${cost}, have ${availableXP}.`);
      return;
    }

    // Create custom perk
    const newPerk: import('@/types/character').CharacterPerk = {
      id: `custom-${Date.now()}`,
      perkId: '',
      name: customPerkName.trim(),
      type: customPerkType,
      level: 1,
      attribute: customPerkAttribute,
      isFlaw: isFlaw,
      isStaged: false,
      acquiredAt: Date.now()
    };

    const updatedCharacter = {
      ...character,
      perks: [...character.perks, newPerk],
      [xpType === 'social' ? 'socialXP' : 'combatXP']: isFlaw ? availableXP + xpChange : availableXP - xpChange,
      progressionLog: [
        ...character.progressionLog,
        {
          type: 'perk' as const,
          name: customPerkName.trim(),
          cost: isFlaw ? -xpChange : xpChange,  // Negative cost for flaws
          attribute: customPerkAttribute,
          xpType: xpType as 'combat' | 'social'
        }
      ]
    };

    onUpdate(updatedCharacter);

    // Reset form and close modal
    setCustomPerkName('');
    setCustomPerkType('Combat');
    setCustomPerkCost('0');
    setCustomPerkFree(false);
    setCustomPerkIsFlaw(false);
    setCustomPerkAttribute('');
    setCustomPerkEffects('');
    setCustomPerkDescription('');
    onClose();
  };

  // Helper function - moved here before useMemos since it's used in filteredPerks
  const validatePerkRequirements = (char: Character, p: Perk) => {
    const reasons: string[] = [];

    if (p.requirements.tier) {
      const requiredTier = p.requirements.tier;
      const domainLevel = p.type === 'magic'
        ? (char.weaponDomains.Spellcraft || 0)
        : (char.weaponDomains.Martial || 0);
      if (domainLevel < requiredTier) {
        reasons.push(`Tier ${requiredTier}`);
      }
    }

    if (p.requirements.skills) {
      for (const skillReq of p.requirements.skills) {
        const match = skillReq.match(/^([A-Za-z\s]+)\s+(\d+)$/);
        if (match) {
          const skillName = match[1].trim();
          const requiredLevel = parseInt(match[2], 10);
          const skill = char.skills.find(s =>
            s.name.toLowerCase() === skillName.toLowerCase()
          );
          if (!skill || skill.level < requiredLevel) {
            reasons.push(`${skillName} ${requiredLevel}`);
          }
        }
      }
    }

    if (p.requirements.perks) {
      for (const prereq of p.requirements.perks) {
        const hasPrereq = character.perks.some(perk => perk.name.toLowerCase() === prereq.toLowerCase());
        if (!hasPrereq) {
          reasons.push(prereq);
        }
      }
    }

    return { canLearn: reasons.length === 0, reasons };
  };

  // Get available tags from filtered perks
  const availableTags = useMemo(() => {
    if (!perkDatabase) return [];

    let perks: Perk[] = [];
    if (selectedCategory === 'all') {
      perks = getAllPerks(perkDatabase);
    } else if (selectedCategory !== 'create') {
      perks = getPerksByType(perkDatabase, selectedCategory.toLowerCase() as 'combat' | 'magic' | 'skill');
    }

    const tagCounts = new Map<string, number>();
    perks.forEach(perk => {
      perk.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag]) => tag);
  }, [perkDatabase, selectedCategory]);

  // Filter and search perks
  const filteredPerks = useMemo(() => {
    if (!perkDatabase) return [];

    let perks: Perk[] = [];

    // Filter by category
    if (selectedCategory === 'all') {
      perks = getAllPerks(perkDatabase);
    } else if (selectedCategory !== 'create') {
      perks = getPerksByType(perkDatabase, selectedCategory.toLowerCase() as 'combat' | 'magic' | 'skill');
    }

    // Filter out already learned perks
    perks = perks.filter(perk => {
      // Check if this is a conditioning perk
      const isConditioning = perk.tags.includes('Conditioning') ||
        (perk.cost.variable && perk.cost.formula?.includes('Max_Wounds'));

      if (isConditioning) {
        // Hide if already in stagedPerks (isStaged: true and level < 5)
        const stagedPerk = character.perks.find(p => p.perkId === perk.id && p.isStaged && p.level < 5);
        if (stagedPerk) return false;
        // Also hide if already completed (level 5)
        const completedPerk = character.perks.find(p => p.perkId === perk.id && p.isStaged && p.level >= 5);
        if (completedPerk) return false;
        return true;
      }

      // Regular perks: check if already learned
      return !character.perks.some(p => p.perkId === perk.id || p.name === perk.name);
    });

    // Apply search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      perks = perks.filter(perk =>
        perk.name.toLowerCase().includes(searchLower) ||
        perk.description.toLowerCase().includes(searchLower) ||
        perk.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by selected tags (AND logic - all selected tags must be present)
    if (selectedTags.length > 0) {
      perks = perks.filter(perk =>
        selectedTags.every(tag => perk.tags.includes(tag))
      );
    }

    // Filter by learnability
    if (showOnlyLearnable) {
      const xpPool = (type: PerkType) => type === 'Skill' ? character.socialXP : character.combatXP;
      perks = perks.filter(perk => {
        // Check affordability
        if (perk.cost.variable) {
          // For conditioning perks, cost is character.maxWounds
          const isConditioning = perk.tags.includes('Conditioning') ||
            (perk.cost.formula?.includes('Max_Wounds'));
          if (isConditioning) {
            const available = character.combatXP;
            const required = character.maxWounds;
            if (available < required) return false;
          }
          // Other variable-cost perks - show them
          return true;
        }
        const requiredXP = perk.cost.xp;
        const available = xpPool(perk.type.charAt(0).toUpperCase() + perk.type.slice(1) as PerkType);
        if (available < requiredXP) return false;

        // Check requirements (simple check - full validation in PerkCard)
        const { canLearn } = validatePerkRequirements(character, perk);
        return canLearn;
      });
    }

    return perks;
  }, [perkDatabase, selectedCategory, searchQuery, selectedTags, showOnlyLearnable, character]);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Handle adding a perk
  const handleAddPerk = (perk: Perk, attribute?: string) => {
    try {
      if (!perkDatabase) return;

      // Check if this is a conditioning perk
      const isConditioning = perk.tags.includes('Conditioning') ||
        (perk.cost.variable && perk.cost.formula?.includes('Max_Wounds'));

    if (isConditioning) {
      // Conditioning perks use stagedPerks system (isStaged: true)
      if (!attribute && perk.attributes.length > 1) {
        setPendingPerk(perk);
        setShowAttributeSelector(true);
        return;
      }

      const selectedAttr = attribute || perk.attributes[0];
      // Level 1 cost = maxWounds × 1
      const cost = character.maxWounds * 1;

      // Check if this conditioning already exists (staged or completed)
      const existingStaged = character.perks.find(p => p.perkId === perk.id && p.isStaged);
      if (existingStaged) {
        // Already training this conditioning - can't add again
        return;
      }

      // Create new staged perk entry (unified CharacterPerk)
      const newStagedPerk: import('@/types/character').CharacterPerk = {
        id: `${perk.id}-${Date.now()}`,
        perkId: perk.id,
        name: perk.name,
        type: 'Combat',
        level: 1,
        attribute: selectedAttr,
        isFlaw: false,
        isStaged: true,
        acquiredAt: Date.now(),
        perkSnapshot: perk
      };

      onUpdate({
        ...character,
        perks: [...character.perks, newStagedPerk],
        combatXP: character.combatXP - cost,
        progressionLog: [
          ...character.progressionLog,
          {
            type: 'stagedPerk' as const,
            name: perk.name,
            cost,
            attribute: selectedAttr,
            xpType: 'combat' as const,
            stagedLevel: 1
          }
        ]
      });

      setExpandedPerkId(null);
      return;
    }

    // Regular perk handling
    // If perk has multiple attributes and none selected, show selector
    if (!attribute && perk.attributes.length > 1) {
      setPendingPerk(perk);
      setShowAttributeSelector(true);
      return;
    }

    // Use provided attribute or first one if only one exists
    const selectedAttr = attribute || perk.attributes[0];

    // Get cost - use 0 for variable cost perks
    const xpCost = perk.cost.variable ? 0 : (perk.cost.xp || 0);

    // Import necessary types and add perk logic
    // This is a simplified version - the full logic would match AddPerkModal
    const xpPool = perk.type === 'skill' ? 'socialXP' : 'combatXP';

    const updatedCharacter = { ...character };

    // Create unified CharacterPerk
    const perkEntry: import('@/types/character').CharacterPerk = {
      id: `${perk.id}-${Date.now()}`,
      perkId: perk.id,
      name: perk.name,
      type: perk.type === 'skill' ? 'Skill' : perk.type === 'magic' ? 'Magic' : 'Combat',
      level: 1,
      attribute: selectedAttr,
      isFlaw: false,
      isStaged: false,
      acquiredAt: Date.now(),
      perkSnapshot: perk
    };

    // Deduct XP
    (updatedCharacter as any)[xpPool] = (character as any)[xpPool] - xpCost;

    // Add to unified perks array
    updatedCharacter.perks = [...character.perks, perkEntry];

    // Add to progression log
    updatedCharacter.progressionLog = [
      ...character.progressionLog,
      {
        type: 'perk' as const,
        name: perk.name,
        attribute: selectedAttr,
        cost: xpCost,
        xpType: perk.type === 'skill' ? 'social' as const : 'combat' as const,
      },
    ];

    onUpdate(updatedCharacter);
    setExpandedPerkId(null);
    } catch (err) {
      console.error('Error adding perk:', err);
    }
  };

  // Handle attribute selection from modal
  const handleAttributeSelect = (attribute: string) => {
    if (pendingPerk) {
      handleAddPerk(pendingPerk, attribute);
      setPendingPerk(null);
    }
    setShowAttributeSelector(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <ErrorBoundary>
          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Browse Perks</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-slate-700 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search perks by name, description, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Category:</span>
              <div className="flex flex-wrap gap-1">
                {(['all', 'combat', 'magic', 'skill', 'create'] as ViewMode[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat === 'create' ? '✨ Create Custom' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filters */}
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-slate-400 text-sm mr-1">Tags:</span>
                {availableTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="px-2 py-0.5 rounded text-xs font-semibold bg-red-700 text-white hover:bg-red-600"
                  >
                    Clear tags
                  </button>
                )}
              </div>
            )}

            {/* Learnable Toggle */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyLearnable}
                onChange={(e) => setShowOnlyLearnable(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600"
              />
              <span className="text-slate-300">Show only affordable perks</span>
            </label>

            {/* Custom Perk Form - shown only when Create Custom is selected */}
            {selectedCategory === 'create' && (
              <div className="bg-slate-750 rounded-lg p-4 space-y-3 border border-slate-600">
                <h3 className="text-white font-semibold mb-2">Create Custom Perk</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Perk Name *</label>
                    <input
                      type="text"
                      value={customPerkName}
                      onChange={(e) => setCustomPerkName(e.target.value)}
                      placeholder="e.g., Iron Will"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Type *</label>
                    <select
                      value={customPerkType}
                      onChange={(e) => setCustomPerkType(e.target.value as PerkType)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Combat">Combat</option>
                      <option value="Magic">Magic</option>
                      <option value="Skill">Skill</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Attribute *</label>
                    <select
                      value={customPerkAttribute}
                      onChange={(e) => setCustomPerkAttribute(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="Might">Might (MG)</option>
                      <option value="Endurance">Endurance (EN)</option>
                      <option value="Agility">Agility (AG)</option>
                      <option value="Dexterity">Dexterity (DX)</option>
                      <option value="Wit">Wit (WT)</option>
                      <option value="Will">Will (WI)</option>
                      <option value="Perception">Perception (PR)</option>
                      <option value="Charisma">Charisma (CH)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      XP Cost
                      <input
                        type="checkbox"
                        checked={customPerkFree}
                        onChange={(e) => setCustomPerkFree(e.target.checked)}
                        className="ml-2"
                        title="Free perk (no XP cost)"
                      />
                      <span className="text-xs text-green-400 ml-1">Free</span>
                    </label>
                    <input
                      type="number"
                      value={customPerkCost}
                      onChange={(e) => setCustomPerkCost(e.target.value)}
                      disabled={customPerkFree}
                      placeholder="0"
                      min="0"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFlaw"
                    checked={customPerkIsFlaw}
                    onChange={(e) => setCustomPerkIsFlaw(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                  />
                  <label htmlFor="isFlaw" className="text-sm text-red-400 font-semibold cursor-pointer">
                    This is a Flaw (grants XP instead of costing XP)
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Custom Effects (optional)</label>
                  <textarea
                    value={customPerkEffects}
                    onChange={(e) => setCustomPerkEffects(e.target.value)}
                    placeholder="Describe what this perk does mechanically..."
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">This text will be shown when the perk is expanded</p>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Description (flavor text)</label>
                  <textarea
                    value={customPerkDescription}
                    onChange={(e) => setCustomPerkDescription(e.target.value)}
                    placeholder="Optional flavor text..."
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleCreateCustomPerk}
                  className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Create Custom Perk
                </button>
              </div>
            )}
          </div>

          {/* Results - hidden when Create Custom is selected */}
          {selectedCategory !== 'create' && (
          <div className="flex-1 overflow-y-auto p-4">
            {filteredPerks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No perks found</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTags([]);
                  }}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredPerks.map(perk => (
                  <PerkCard
                    key={perk.id}
                    perk={perk}
                    character={character}
                    abilities={perkDatabase?.abilities || []}
                    effects={perkDatabase?.effects || []}
                    isExpanded={expandedPerkId === perk.id}
                    onToggleExpand={() =>
                      setExpandedPerkId(expandedPerkId === perk.id ? null : perk.id)
                    }
                    onAdd={(attr) => handleAddPerk(perk, attr)}
                    showAddButton={true}
                    availableXP={perk.type === 'skill' ? character.socialXP : character.combatXP}
                  />
                ))}
              </div>
            )}
          </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 flex justify-between items-center">
            <span className="text-slate-400 text-sm">
              {filteredPerks.length} perk{filteredPerks.length !== 1 ? 's' : ''} found
            </span>
            <div className="flex gap-2 text-sm">
              <span className="text-red-400">Combat: {character.combatXP} XP</span>
              <span className="text-blue-400">Skill: {character.socialXP} XP</span>
            </div>
          </div>
          </ErrorBoundary>
        </div>
      </div>

      {/* Attribute Selector Modal */}
      {showAttributeSelector && pendingPerk && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAttributeSelector(false);
            setPendingPerk(null);
          }}
        >
          <div
            className="bg-slate-800 rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Select Attribute for {pendingPerk.name}</h3>
            <AttributeSelector
              attributes={pendingPerk.attributes.join('/')}
              onSelect={handleAttributeSelect}
              onCancel={() => {
                setShowAttributeSelector(false);
                setPendingPerk(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
