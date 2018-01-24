export interface SpecifierResolver<Specifier> {
  specifierKey(specifier: Specifier): string;
  specifierFromKey(key: string): Specifier;
  specifierEquals(specifier: Specifier, target: Specifier): boolean;
  specifierMatches(specifier: Specifier, target: Specifier): boolean;
  matchingSpecifiers(specifier: Specifier): Specifier[];
}
