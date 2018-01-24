import {
  Factory,
  FactoryRegistry,
  Container,
  SpecifierResolver,
  Initializer,
  DictionaryInjection
} from '../src/index';

const { module, test } = QUnit;

class EmberObject {
  initialized: boolean;
  destroyed: boolean;

  init(): void {
    this.initialized = true;
  }

  teardown(): void {
    this.destroyed = true;
  }

  static create(...props: object[]): EmberObject {
    let i = new this();
    props.forEach(p => Object.assign(i, p));
    i.init();
    return i;
  }
}

class EmberObjectFactory implements Factory<EmberObject> {
  protected emberObjectClass: Factory<EmberObject>;

  constructor(emberObjectClass: Factory<EmberObject>) {
    this.emberObjectClass = emberObjectClass;
  }

  create(...props: object[]): EmberObject {
    return this.emberObjectClass.create(...props);
  }
}

class SingletonEmberObjectFactory extends EmberObjectFactory {
  private _instance: EmberObject;

  get instance(): EmberObject {
    return this._instance;
  }

  create(...args: object[]): EmberObject {
    return this._instance = super.create(...args);
  }
}

declare type EmberSpecifier = string;

interface EmberSpecifierObject {
  type: string;
  name?: string;
}

class EmberSpecifierResolver implements SpecifierResolver<EmberSpecifier> {
  specifierKey(specifier: EmberSpecifier): string {
    return specifier;
  }

  specifierFromKey(key: string): EmberSpecifier {
    return key;
  }

  specifierEquals(specifier: EmberSpecifier, target: EmberSpecifier): boolean {
    return specifier === target;
  }

  specifierMatches(specifier: EmberSpecifier, target: EmberSpecifier): boolean {
    if (specifier === target) {
      return true;
    }

    let obj = this.deserialize(specifier);
    let targetObj = this.deserialize(target);

    return (obj.type === targetObj.type && targetObj.name === undefined);
  }

  matchingSpecifiers(specifier: string): string[] {
    if (specifier.indexOf(':') > -1) {
      let split  = specifier.split(':');
      return [specifier, split[0]];
    } else {
      return [specifier];
    }
  }

  private deserialize(specifier: EmberSpecifier): EmberSpecifierObject {
    if (specifier.indexOf(':') > -1) {
      let split  = specifier.split(':');
      return {
        type: split[0],
        name: split[1]
      };
    } else {
      return {
        type: specifier
      }
    }
  }
}

module('Ember Object Simulation');

test('standard factories will create a new instance of an object for every lookup', function(assert) {
  let specifierResolver = new EmberSpecifierResolver;
  let registry = new FactoryRegistry<EmberSpecifier, EmberObject>(specifierResolver);
  let container = new Container<EmberSpecifier, EmberObject>(registry);

  let emberObjectFactory = new EmberObjectFactory(EmberObject);
  registry.registerFactory( 'foo:bar', emberObjectFactory);
  assert.strictEqual(registry.factoryFor('foo:bar'), emberObjectFactory);

  let a = container.lookup('foo:bar');
  assert.ok(a instanceof EmberObject);
  assert.ok(a.initialized);

  let b = container.lookup('foo:bar');
  assert.ok(b instanceof EmberObject);
  assert.ok(b.initialized);

  assert.notStrictEqual(a, b);
});

test('singleton factories will create one instance of an object and return it for every lookup', function(assert) {
  let specifierResolver = new EmberSpecifierResolver;
  let registry = new FactoryRegistry<EmberSpecifier, EmberObject>(specifierResolver);
  let container = new Container<EmberSpecifier, EmberObject>(registry);

  let emberObjectFactory = new SingletonEmberObjectFactory(EmberObject);
  registry.registerFactory( 'foo:bar', emberObjectFactory);
  assert.strictEqual(registry.factoryFor('foo:bar'), emberObjectFactory);

  let a = container.lookup('foo:bar');
  assert.ok(a instanceof EmberObject);
  assert.ok(a.initialized);

  let b = container.lookup('foo:bar');

  assert.strictEqual(a, b);
});

test('properties can be injected into objects on lookup', function(assert) {
  let specifierResolver = new EmberSpecifierResolver;
  let registry = new FactoryRegistry<EmberSpecifier, EmberObject>(specifierResolver);
  let container = new Container<EmberSpecifier, EmberObject>(registry);

  class Bar extends EmberObject {
    get name() {
      return 'bar';
    }
  }

  class Baz extends EmberObject {
    get name() {
      return 'baz';
    }
  }

  registry.registerFactory( 'foo:bar', Bar);
  assert.strictEqual(registry.factoryFor('foo:bar'), Bar);

  let bazFactory = new SingletonEmberObjectFactory(Baz);
  registry.registerFactory( 'foo:baz', bazFactory);
  assert.strictEqual(registry.factoryFor('foo:baz'), bazFactory);

  registry.registerConstructorArguments('foo:bar', [{
    type: 'static',
    value: {
      pi: '3.14'
    }
  }, {
    type: 'dictionary',
    value: {
      baz: {
        type: 'creatable',
        source: 'foo:baz'
      },
      four: {
        type: 'static',
        value: '4'
      }
    }
  } as DictionaryInjection<EmberSpecifier>]);

  let bar = container.lookup('foo:bar');
  assert.ok(bar instanceof Bar);
  assert.ok(bar.initialized);
  assert.equal(bar['pi'], '3.14');
  assert.equal(bar['four'], '4');

  let baz = container.lookup('foo:baz');
  assert.ok(baz instanceof Baz);
  assert.strictEqual(bar['baz'], baz, 'property has been injected');
});
