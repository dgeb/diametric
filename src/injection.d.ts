import { Dict } from './dict';
import { Invocable } from './invocable';

export interface BaseEvaluableInjection {
  type: string;
}

export interface StaticInjection extends BaseEvaluableInjection {
  type: 'static';
  value: any;
}

export interface CreatableInjection<Specifier> extends BaseEvaluableInjection {
  type: 'creatable';
  source: Specifier;
}

export interface PropertyInjection<Specifier> extends BaseEvaluableInjection {
  type: 'property';
  source: Specifier;
  property: string;
}

export interface MethodInjection<Specifier> extends BaseEvaluableInjection {
  type: 'method';
  source: Specifier;
  method: string;
  args: Injection<Specifier>[];
}

export interface InvocableInjection<Specifier> extends BaseEvaluableInjection {
  type: 'invocable';
  source: Specifier;
}

export interface DictionaryInjection<Specifier> extends BaseEvaluableInjection {
  type: 'dictionary';
  value: Dict<Injection<Specifier>>;
}

export interface ObjectInjection<Specifier> extends BaseEvaluableInjection {
  type: 'object';
  keys: Injection<Specifier>[];
  values: Injection<Specifier>[];
}

export interface ArrayInjection<Specifier> extends BaseEvaluableInjection {
  type: 'array';
  values: Injection<Specifier>[];
}

export type EvaluableInjection<Specifier> = StaticInjection |
  CreatableInjection<Specifier> |
  PropertyInjection<Specifier> |
  MethodInjection<Specifier> |
  InvocableInjection<Specifier> |
  DictionaryInjection<Specifier> |
  ObjectInjection<Specifier> |
  ArrayInjection<Specifier>;

export type Injection<Specifier> = EvaluableInjection<Specifier> |
                                   boolean |
                                   string |
                                   number |
                                   null;
