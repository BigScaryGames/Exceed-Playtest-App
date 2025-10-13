import { Character } from '@/types/character';

// Create empty character with default values
export const createEmptyCharacter = (): Character => ({
  name: '',
  concept: '',
  combatXP: 0,
  socialXP: 0,
  stats: {
    MG: 0, EN: 0, AG: 0, DX: 0,
    WT: 0, WI: 0, PR: 0, CH: 0
  },
  skills: [],
  perks: [],
  combatPerks: [],
  equipment: [],
  customItems: [],
  progressionLog: [],
  weaponDomains: {
    '1H': 0,
    '2H': 0,
    'SaS': 0,
    'Sh': 0,
    'Ar': 0
  },
  maxWounds: 2,
  hpPerWound: 5,
  extraHP: 0,
  armorType: 'None',
  equippedWeapon1: 'None',
  equippedWeapon2: 'None',
  equippedShield: 'None',
  currentStamina: null,
  currentHealth: null,
  markedWounds: 0,
  extraHPCount: 0,
  extraHPHistory: [],
  extraWoundCount: 0
});

// Save character to localStorage
export const saveCharacter = (character: Character): void => {
  try {
    const characters = loadAllCharacters();
    const existingIndex = characters.findIndex(c => c.name === character.name);

    if (existingIndex >= 0) {
      characters[existingIndex] = character;
    } else {
      characters.push(character);
    }

    localStorage.setItem('exceed-characters', JSON.stringify(characters));
  } catch (error) {
    console.error('Failed to save character:', error);
  }
};

// Load all characters from localStorage
export const loadAllCharacters = (): Character[] => {
  try {
    const stored = localStorage.getItem('exceed-characters');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load characters:', error);
    return [];
  }
};

// Load single character by name
export const loadCharacter = (name: string): Character | null => {
  const characters = loadAllCharacters();
  return characters.find(c => c.name === name) || null;
};

// Delete character from localStorage
export const deleteCharacter = (name: string): void => {
  try {
    const characters = loadAllCharacters();
    const filtered = characters.filter(c => c.name !== name);
    localStorage.setItem('exceed-characters', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete character:', error);
  }
};

// Export character as JSON file
export const exportCharacter = (character: Character): void => {
  const dataStr = JSON.stringify(character, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${character.name || 'character'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Import character from JSON file
export const importCharacter = (file: File): Promise<Character> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const character = JSON.parse(e.target?.result as string);
        resolve(character);
      } catch (error) {
        reject(new Error('Invalid character file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
