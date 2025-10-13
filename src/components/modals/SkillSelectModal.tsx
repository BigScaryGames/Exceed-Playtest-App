import React from 'react';
import { SKILL_DATABASE } from '@/data/skills';
import { SkillDefinition } from '@/types/character';

interface SkillSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill: (skill: SkillDefinition) => void;
  learnedSkills: string[];
  availableCP: number;
}

export const SkillSelectModal: React.FC<SkillSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectSkill,
  learnedSkills,
  availableCP
}) => {
  if (!isOpen) return null;

  const getAvailableSkills = () => {
    const available: Record<string, SkillDefinition[]> = {};

    Object.entries(SKILL_DATABASE).forEach(([category, skills]) => {
      const availableInCategory = skills.filter(
        skill => !learnedSkills.includes(skill.name)
      );
      if (availableInCategory.length > 0) {
        available[category] = availableInCategory;
      }
    });

    return available;
  };

  const availableSkills = getAvailableSkills();
  const hasNoSkills = Object.keys(availableSkills).length === 0;
  const canAffordSkill = availableCP >= 2;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg max-w-2xl w-full flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white p-6 pb-4 text-center flex-shrink-0">
          Add New Skill
          <div className="text-sm text-slate-400 font-normal mt-1">
            Available Social XP: {availableCP} CP
          </div>
          {!canAffordSkill && (
            <div className="text-sm text-red-400 font-normal">
              Need 2 CP to learn a skill
            </div>
          )}
        </h3>

        <div className="overflow-y-auto px-6 flex-1" style={{ minHeight: 0 }}>
          {hasNoSkills ? (
            <p className="text-slate-400 text-center py-8">All skills learned!</p>
          ) : (
            <div className="space-y-4 pb-4">
              {Object.entries(availableSkills).map(([category, skills]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2 sticky top-0 bg-slate-800 py-1">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <button
                        key={skill.name}
                        onClick={() => onSelectSkill(skill)}
                        disabled={!canAffordSkill}
                        className={`w-full rounded p-3 text-left transition-colors ${
                          canAffordSkill
                            ? 'bg-slate-700 hover:bg-slate-600'
                            : 'bg-slate-700 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="text-white font-medium">{skill.name}</div>
                        <div className="text-slate-400 text-sm">{skill.attributes}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-slate-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
