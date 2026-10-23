export interface CharacterAttributes {
  for: number;
  des: number;
  con: number;
  int: number;
  sab: number;
  car: number;
}

export type AttributeKey = keyof CharacterAttributes;

/**
 * Calcula o modificador de atributo de D&D padrão: floor((valor - 10) / 2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Formata o modificador com sinal (+3, -1, +0)
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Calcula o Bônus de Proficiência de acordo com o nível do personagem (D&D 5e e 2024)
 * Nível 1-4: +2
 * Nível 5-8: +3
 * Nível 9-12: +4
 * Nível 13-16: +5
 * Nível 17-20: +6
 */
export function calculateProficiencyBonus(level: number): number {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level)));
  return Math.ceil(safeLevel / 4) + 1;
}

/**
 * Calcula a Classe de Dificuldade (CD) para magias
 * CD = 8 + Bônus de Proficiência + Modificador do Atributo Conjurador
 */
export function calculateSpellSaveDC(proficiencyBonus: number, castingAttributeModifier: number): number {
  return 8 + proficiencyBonus + castingAttributeModifier;
}

/**
 * Calcula o bônus de ataque mágico
 * Bônus = Bônus de Proficiência + Modificador do Atributo Conjurador
 */
export function calculateSpellAttackBonus(proficiencyBonus: number, castingAttributeModifier: number): number {
  return proficiencyBonus + castingAttributeModifier;
}
