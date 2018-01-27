import {
  Factory,
  FactoryRegistry,
  SpecifierResolver,
  Initializer,
  Destructor,
  CreatableInjection,
  StaticInjection
} from '../src/index';
import {
  SimpleSpecifier,
  SimpleSpecifierResolver
} from './test-helpers';

const { module, test } = QUnit;

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

test('constructor args can be registered, unregistered, and resolved', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let injections = [{
    type: 'creatable',
    source: 'bar'
  } as CreatableInjection<SimpleSpecifier>, {
    type: 'static',
    value: '123'
  } as StaticInjection];

  registry.registerConstructorArguments('foo', injections);
  assert.strictEqual(registry.constructorArgumentsFor('foo'), injections);

  registry.unregisterConstructorArguments('foo');
  assert.strictEqual(registry.constructorArgumentsFor('foo'), undefined);
});

test('constructor args can be registered and resolved with priority', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let injections = [{
    type: 'creatable',
    source: 'bar'
  } as CreatableInjection<SimpleSpecifier>, {
    type: 'static',
    value: '123'
  } as StaticInjection];
  let injections2 = [{
    type: 'creatable',
    source: 'foo'
  } as CreatableInjection<SimpleSpecifier>, {
    type: 'static',
    value: '234'
  } as StaticInjection];

  registry.registerConstructorArguments('*', injections);
  assert.strictEqual(registry.constructorArgumentsFor('foo'), injections);

  registry.registerConstructorArguments('foo', injections2);
  assert.strictEqual(registry.constructorArgumentsFor('foo'), injections2);
});

test('initializer args can be registered, unregistered, and resolved', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let injections = [{
    type: 'creatable',
    source: 'bar'
  } as CreatableInjection<SimpleSpecifier>, {
    type: 'static',
    value: '123'
  } as StaticInjection];

  registry.registerInitializerArguments('foo', 'initOwner', injections);
  assert.strictEqual(registry.initializerArgumentsFor('foo', 'initOwner'), injections);
  registry.unregisterInitializerArguments('foo');
  assert.strictEqual(registry.initializerArgumentsFor('foo', 'initOwner'), undefined);

  registry.registerInitializerArguments('foo', 'initOwner', injections);
  assert.strictEqual(registry.initializerArgumentsFor('foo', 'initOwner'), injections);
  registry.unregisterInitializerArguments('foo', 'initOwner');
  assert.strictEqual(registry.initializerArgumentsFor('foo', 'initOwner'), undefined);
});

test('initializer args can be registered and resolved with priority', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let injections = [{
    type: 'creatable',
    source: 'bar'
  } as CreatableInjection<SimpleSpecifier>, {
    type: 'static',
    value: '123'
  } as StaticInjection];
  let injections2 = [{
    type: 'creatable',
    source: 'foo'
  } as CreatableInjection<SimpleSpecifier>, {
    type: 'static',
    value: '234'
  } as StaticInjection];

  registry.registerInitializerArguments('*', 'initOwner', injections);
  assert.strictEqual(registry.initializerArgumentsFor('foo', 'initOwner'), injections);
  registry.registerInitializerArguments('foo', 'initOwner', injections2);
  assert.strictEqual(registry.initializerArgumentsFor('foo', 'initOwner'), injections2);
});

test('destructor args can be registered, unregistered, and resolved', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let injections = [{
    type: 'creatable',
    source: 'bar'
  } as CreatableInjection<SimpleSpecifier>, {
    type: 'static',
    value: '123'
  } as StaticInjection];

  registry.registerDestructorArguments('foo', 'teardownFoo', injections);
  assert.strictEqual(registry.destructorArgumentsFor('foo', 'teardownFoo'), injections);
  registry.unregisterDestructorArguments('foo');
  assert.strictEqual(registry.destructorArgumentsFor('foo', 'teardownFoo'), undefined);

  registry.registerDestructorArguments('foo', 'teardownFoo', injections);
  assert.strictEqual(registry.destructorArgumentsFor('foo', 'teardownFoo'), injections);
  registry.unregisterDestructorArguments('foo', 'teardownFoo');
  assert.strictEqual(registry.destructorArgumentsFor('foo', 'teardownFoo'), undefined);
});

test('destructor args can be registered and resolved with priority', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let injections = [{
    type: 'creatable',
    source: 'bar'
  } as CreatableInjection<SimpleSpecifier>, {
    type: 'static',
    value: '123'
  } as StaticInjection];
  let injections2 = [{
    type: 'creatable',
    source: 'foo'
  } as CreatableInjection<SimpleSpecifier>, {
    type: 'static',
    value: '234'
  } as StaticInjection];

  registry.registerDestructorArguments('*', 'teardownFoo', injections);
  assert.strictEqual(registry.destructorArgumentsFor('foo', 'teardownFoo'), injections);
  registry.registerDestructorArguments('foo', 'teardownFoo', injections2);
  assert.strictEqual(registry.destructorArgumentsFor('foo', 'teardownFoo'), injections2);
});
