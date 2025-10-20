import React, { useState } from 'react';
import { Swords, BookOpen } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';

interface XPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddXP: (combatXP: number, socialXP: number) => void;
}

export const XPModal: React.FC<XPModalProps> = ({ isOpen, onClose, onAddXP }) => {
  const [combatXPInput, setCombatXPInput] = useState('');
  const [socialXPInput, setSocialXPInput] = useState('');

  const handleAddXP = () => {
    const combat = parseInt(combatXPInput) || 0;
    const social = parseInt(socialXPInput) || 0;
    onAddXP(combat, social);
    handleClose();
  };

  const handleClose = () => {
    setCombatXPInput('');
    setSocialXPInput('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Experience Points">
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
          <Swords size={16} className="text-red-400" />
          Combat
        </label>
        <input
          type="number"
          value={combatXPInput}
          onChange={(e) => setCombatXPInput(e.target.value)}
          placeholder="Enter Combat XP"
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
          <BookOpen size={16} className="text-blue-400" />
          Skill
        </label>
        <input
          type="number"
          value={socialXPInput}
          onChange={(e) => setSocialXPInput(e.target.value)}
          placeholder="Enter Skill XP"
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
        />
      </div>

      <button
        onClick={handleAddXP}
        className="w-full bg-slate-700 hover:bg-slate-600 rounded py-2 mb-2 text-white font-semibold"
      >
        Okay
      </button>
      <button
        onClick={handleClose}
        className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
      >
        Cancel
      </button>
    </Modal>
  );
};
