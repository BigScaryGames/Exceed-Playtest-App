import React from 'react';

interface AttributeSelectorProps {
  attributes: string; // e.g., "Agility/Charisma"
  onSelect: (attribute: string) => void;
  onCancel: () => void;
}

export const AttributeSelector: React.FC<AttributeSelectorProps> = ({
  attributes,
  onSelect,
  onCancel
}) => {
  const attributePair = attributes.split('/').map(a => a.trim());

  return (
    <div className="space-y-3">
      <p className="text-slate-300 text-sm mb-4">Choose an attribute to improve:</p>
      {attributePair.map(attr => (
        <button
          key={attr}
          onClick={() => onSelect(attr)}
          className="w-full bg-slate-700 hover:bg-slate-600 rounded py-3 text-white font-semibold"
        >
          {attr}
        </button>
      ))}
      <button
        onClick={onCancel}
        className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold mt-4"
      >
        Cancel
      </button>
    </div>
  );
};
