import {
  Factory,
  FactoryRegistry,
  SpecifierResolver,
  Initializer,
  Destructor
} from '../src/index';

const { module, test } = QUnit;

declare type SimpleSpecifier = string;

class SimpleSpecifierResolver implements SpecifierResolver<SimpleSpecifier> {
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

class Foo {

}

class Bar {

}

const fooFactory: Factory<Foo> = {
  create(): Foo {
    return new Foo();
  }
}

const initializeOwner: Initializer<Foo> = {
  name: 'initializeOwner',
  initialize(foo: Foo) {
    foo['owner'] = '123';
  }
}

const callInit: Initializer<Foo> = {
  name: 'callInit',
  initialize(foo: Foo) {
    foo['init']();
  }
}

const teardownOwner: Destructor<Foo> = {
  name: 'teardownOwner',
  teardown(foo: Foo) {
    delete foo['owner'];
  }
}

const callDestroy: Destructor<Foo> = {
  name: 'callDestroy',
  teardown(foo: Foo) {
    foo['destroy']();
  }
}

module('FactoryRegistry');

test('factories can be registered, unregistered, and resolved', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);

  registry.registerFactory('foo', fooFactory);
  assert.strictEqual(registry.factoryFor('foo'), fooFactory);

  registry.unregisterFactory('foo');
  assert.strictEqual(registry.factoryFor('foo'), undefined);
});

test('initializers can be registered, unregistered, and resolved', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);

  registry.registerInitializer('foo', initializeOwner);
  assert.deepEqual(registry.initializersFor('foo'), [initializeOwner]);

  registry.unregisterInitializer('foo', 'initializeOwner');
  assert.deepEqual(registry.initializersFor('foo'), []);
});

test('initializers can be registered and resolved with a priority', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  const initializeOwnerNew: Initializer<Foo> = {
    name: 'initializeOwner',
    initialize(foo: Foo) {
      foo['owner'] = '456';
    }
  }

  registry.registerInitializer('*', initializeOwner);
  registry.registerInitializer('*', callInit);
  registry.registerInitializer('foo', initializeOwnerNew);
  assert.deepEqual(registry.initializersFor('foo'), [initializeOwnerNew, callInit]);
});

test('destructors can be registered, unregistered, and resolved', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);

  registry.registerDestructor('foo', teardownOwner);
  assert.deepEqual(registry.destructorsFor('foo'), [teardownOwner]);

  registry.unregisterDestructor('foo', 'teardownOwner');
  assert.deepEqual(registry.destructorsFor('foo'), []);
});

test('destructors can be registered and resolved with a priority', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  const teardownOwnerNew: Destructor<Foo> = {
    name: 'teardownOwner',
    teardown(foo: Foo) {
      foo['owner'] = null;
    }
  }

  registry.registerDestructor('*', teardownOwner);
  registry.registerDestructor('*', callDestroy);
  registry.registerDestructor('foo', teardownOwnerNew);
  assert.deepEqual(registry.destructorsFor('foo'), [teardownOwnerNew, callDestroy]);
});
