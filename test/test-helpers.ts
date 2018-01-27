import {
  SpecifierResolver
} from '../src/index';

export type SimpleSpecifier = string;

export class SimpleSpecifierResolver implements SpecifierResolver<SimpleSpecifier> {
  specifierKey(specifier: string): string {
    return specifier;
  }

  specifierFromKey(key: string): string {
    return key;
  }

  specifierEquals(specifier: string, target: string): boolean {
    return specifier === target;
  }

  specifierMatches(specifier: string, target: string): boolean {
    return specifier === target;
  }

  matchingSpecifiers(specifier: string): string[] {
    return [specifier, '*'];
  }
}
