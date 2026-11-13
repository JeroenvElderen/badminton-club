export const LEAGUE_DIVISIONS = Array.from(
  { length: 10 },
  (_, index) => `Division ${index + 1}`,
);

export const SKILL_LEVEL_OPTIONS = [...LEAGUE_DIVISIONS, 'Unrated'];

/** Division 1 is strongest; division 10 is the lowest league division. */
export function getSkillLevelOrder(level: string | null | undefined): number {
  const match = /^division\s+(10|[1-9])$/i.exec(level?.trim() ?? '');
  return match ? 11 - Number(match[1]) : 0;
}
