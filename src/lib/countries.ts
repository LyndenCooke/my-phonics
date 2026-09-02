/**
 * The one country registry shared by the Create-A-Book wizard, the World of
 * Books globe and the library pins.
 *
 * Before this file, the wizard kept its own name+flag list and the globe kept
 * its own name+coordinate and name+ISO maps. They had already drifted: seven
 * countries the globe could place (Nepal, Sweden, Iceland...) were not
 * offered to families in the wizard, and any new wizard entry that missed
 * the globe silently rendered as "Also from ..." text under the planet.
 * `src/lib/countries.test.ts` now fails the build if a library book or a
 * wizard option points at a country this registry cannot place.
 */
export interface CountryEntry {
  name: string;
  /** Emoji flag — the fallback when the flag artwork cannot load. */
  flag: string;
  /** ISO-3166 alpha-2, lower case, for flag artwork. */
  iso: string;
  /** [longitude, latitude] of the pin on the globe. */
  at: [number, number];
}

export const COUNTRIES: readonly CountryEntry[] = [
  { name: "United Kingdom", flag: "🇬🇧", iso: "gb", at: [-2.0, 54.0] },
  { name: "Australia", flag: "🇦🇺", iso: "au", at: [133.8, -25.3] },
  { name: "Bangladesh", flag: "🇧🇩", iso: "bd", at: [90.4, 23.7] },
  { name: "Brazil", flag: "🇧🇷", iso: "br", at: [-51.9, -14.2] },
  { name: "China", flag: "🇨🇳", iso: "cn", at: [104.2, 35.9] },
  { name: "Colombia", flag: "🇨🇴", iso: "co", at: [-74.3, 4.6] },
  { name: "Egypt", flag: "🇪🇬", iso: "eg", at: [30.0, 26.8] },
  { name: "France", flag: "🇫🇷", iso: "fr", at: [2.2, 46.2] },
  { name: "Germany", flag: "🇩🇪", iso: "de", at: [10.5, 51.2] },
  { name: "Ghana", flag: "🇬🇭", iso: "gh", at: [-1.0, 7.9] },
  { name: "Iceland", flag: "🇮🇸", iso: "is", at: [-19.0, 64.9] },
  { name: "India", flag: "🇮🇳", iso: "in", at: [78.9, 20.6] },
  { name: "Indonesia", flag: "🇮🇩", iso: "id", at: [113.9, -0.8] },
  { name: "Ireland", flag: "🇮🇪", iso: "ie", at: [-8.2, 53.4] },
  { name: "Italy", flag: "🇮🇹", iso: "it", at: [12.6, 41.9] },
  { name: "Jamaica", flag: "🇯🇲", iso: "jm", at: [-77.3, 18.1] },
  { name: "Japan", flag: "🇯🇵", iso: "jp", at: [138.3, 36.2] },
  { name: "Kenya", flag: "🇰🇪", iso: "ke", at: [37.9, -0.02] },
  { name: "Malaysia", flag: "🇲🇾", iso: "my", at: [101.98, 4.2] },
  { name: "Mexico", flag: "🇲🇽", iso: "mx", at: [-102.6, 23.6] },
  { name: "Morocco", flag: "🇲🇦", iso: "ma", at: [-7.1, 31.8] },
  { name: "Nepal", flag: "🇳🇵", iso: "np", at: [84.1, 28.4] },
  { name: "Nigeria", flag: "🇳🇬", iso: "ng", at: [8.7, 9.1] },
  { name: "Pakistan", flag: "🇵🇰", iso: "pk", at: [69.3, 30.4] },
  { name: "Philippines", flag: "🇵🇭", iso: "ph", at: [121.8, 12.9] },
  { name: "Poland", flag: "🇵🇱", iso: "pl", at: [19.1, 51.9] },
  { name: "Romania", flag: "🇷🇴", iso: "ro", at: [24.9, 45.9] },
  { name: "Saudi Arabia", flag: "🇸🇦", iso: "sa", at: [45.0, 24.0] },
  { name: "Somalia", flag: "🇸🇴", iso: "so", at: [46.2, 5.2] },
  { name: "South Africa", flag: "🇿🇦", iso: "za", at: [24.7, -29.0] },
  { name: "South Korea", flag: "🇰🇷", iso: "kr", at: [127.8, 36.5] },
  { name: "Spain", flag: "🇪🇸", iso: "es", at: [-3.7, 40.5] },
  { name: "Sweden", flag: "🇸🇪", iso: "se", at: [18.6, 60.1] },
  { name: "Thailand", flag: "🇹🇭", iso: "th", at: [100.99, 15.87] },
  { name: "Trinidad and Tobago", flag: "🇹🇹", iso: "tt", at: [-61.2, 10.7] },
  { name: "Turkey", flag: "🇹🇷", iso: "tr", at: [35.2, 39.0] },
  { name: "United Arab Emirates", flag: "🇦🇪", iso: "ae", at: [54.0, 24.0] },
  { name: "United States", flag: "🇺🇸", iso: "us", at: [-98.0, 39.5] },
];

const BY_NAME = new Map(COUNTRIES.map((c) => [c.name, c]));

export function countryByName(name: string | null | undefined): CountryEntry | null {
  return name ? BY_NAME.get(name) ?? null : null;
}

export function countryFlag(name: string | null | undefined): string {
  return countryByName(name)?.flag ?? "🌍";
}

/** Flag artwork URL, or null for a country the registry does not know. */
export function flagUrl(country: string, size: 40 | 80 = 40): string | null {
  const iso = countryByName(country)?.iso;
  return iso ? `https://flagcdn.com/w${size}/${iso}.png` : null;
}
