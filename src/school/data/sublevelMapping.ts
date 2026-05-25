/**
 * Sub-level translation between parent-6 (current production) and
 * school-8 (RWI-aligned). Used to map school sub_level IDs to the
 * existing interactive page data / shipped PDFs without changing them.
 */

export const PARENT_6_TO_SCHOOL_8: Record<string, string> = {
  'L1.1': 'L1.1', 'L1.2': 'L1.2',
  'L1.3': 'L3.1', 'L1.9': 'L3.2', 'L1.10': 'L3.3',
  'L1.4': 'L2.1', 'L1.5': 'L2.2', 'L1.6': 'L2.3', 'L1.7': 'L2.4', 'L1.8': 'L2.5',
  'L2.1': 'L4.1', 'L2.2': 'L4.2', 'L2.3': 'L4.3', 'L2.4': 'L4.4', 'L2.5': 'L4.5', 'L2.6': 'L4.6',
  'L3.1': 'L5.1', 'L3.2': 'L5.2', 'L3.3': 'L5.3', 'L3.4': 'L5.4', 'L3.5': 'L5.5',
  'L4.1': 'L6.1', 'L4.2': 'L6.2', 'L4.3': 'L6.3', 'L4.4': 'L6.4',
  'L5.1': 'L7.1', 'L5.2': 'L7.2', 'L5.3': 'L7.3', 'L5.4': 'L7.4',
  'L6.1': 'L8.1', 'L6.2': 'L8.2', 'L6.3': 'L8.3', 'L6.4': 'L8.4',
};

export const SCHOOL_8_TO_PARENT_6: Record<string, string> = Object.fromEntries(
  Object.entries(PARENT_6_TO_SCHOOL_8).map(([k, v]) => [v, k]),
);

export function toSchool8SubLevel(parent6: string): string | undefined {
  return PARENT_6_TO_SCHOOL_8[parent6];
}

export function toParent6SubLevel(school8: string): string | undefined {
  return SCHOOL_8_TO_PARENT_6[school8];
}
