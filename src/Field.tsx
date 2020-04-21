import { Cancelable } from 'lodash';
import debounce from 'lodash.debounce';
import { action, computed, observable, reaction, runInAction, toJS } from 'mobx';
import { inject, Observer, observer } from 'mobx-react';
import React from 'react';
import { PickProperties } from 'ts-essentials';
import { FormContext, FormElement } from './FormContext';

export type Validator<T> = (value: T) => Promise<string[] | undefined>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldRenderProps<T, State = any, Intermediate = any> = {
  readonly input: {
    readonly onBlur: () => void;
    readonly onChange: (value: T, options?: {
       preserveIntermediate?: boolean;
    }) => void;
    readonly onFocus: () => void;
    readonly value: T;
  };
  readonly meta: FormElement['meta'] & {
    readonly isActive: boolean;
    readonly isValid: boolean;

    /**
     * True if the field has ever gained focus.
     */
    readonly isVisited: boolean;
    readonly isValidating: boolean;

    /**
     * True if the field has ever gained and lost focus.
     */
    readonly isTouched: boolean;
    readonly isPristine: boolean;
    readonly isDirty: boolean;
    readonly isModified: boolean;
    readonly errors: string[];
    readonly name: keyof PickProperties<State, T>;
    readonly initialValue: T;
    intermediate: Intermediate | undefined;
  };
};

export interface FieldProps<T, State, Intermediate> {
  formContext?: FormContext;

  name: keyof PickProperties<State, T>;
  state: State;
  initialState?: State;

  validator?: Validator<T>;
  intermediateValidator?: Validator<Intermediate>;

  isEqual?: (a: T, b: T) => boolean;

  clearErrorsOnValidate?: boolean;

  validateOnInit?: boolean;
  validateOnBlur?: boolean;
  validateOnFocus?: boolean;
  validateOnChange?: boolean;

  delay?: number;

  children: (props: FieldRenderProps<T, State, Intermediate>) => JSX.Element;
}

@inject(props => props)
@observer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Field<T, State = any, Intermediate = any>
  extends React.Component<FieldProps<T, State, Intermediate>>
  implements FormElement {
  @observable private _isActive = false;
  @observable private _isModified = false;
  @observable private _isTouched = false;
  @observable private _isVisited = false;

  @observable private _initialState!: State;

  @observable private _intermediate?: Intermediate = undefined;

  @observable private _errors: string[] = [];
  @observable private _validationIndex = 0;
  @observable private _validationIndexComplete = 0;

  private _isChangingThroughEvent = false;

  private _disposeFns: (() => unknown)[] = [];

  private _validator: (Validator<T> | (Validator<T> & Cancelable)) | undefined = undefined;
  private _intermediateValidator:
    | (Validator<Intermediate> | (Validator<Intermediate> & Cancelable))
    | undefined = undefined;

  @computed public get value(): T {
    return this.props.state && ((this.props.state[this.name] as unknown) as T);
  }

  @computed public get errors(): string[] {
    return this._errors;
  }

  @computed public get intermediate(): Intermediate | undefined {
    return this._intermediate;
  }

  public set intermediate(value: Intermediate | undefined) {
    runInAction(() => {
      this._intermediate = value;
    });
  }

  @computed public get initialValue(): T {
    return this.props.initialState
      ? ((this.props.initialState[this.name] as unknown) as T)
      : ((this._initialState?.[this.name] as unknown) as T);
  }

  @computed public get isPristine(): boolean {
    return this.isEqual(this.value, this.initialValue);
  }

  @computed public get isDirty(): boolean {
    return !this.isPristine;
  }

  @computed public get isModified(): boolean {
    return this._isModified;
  }

  @computed public get isVisited(): boolean {
    return this._isVisited;
  }

  @computed public get isValidating(): boolean {
    return this._validationIndexComplete < this._validationIndex;
  }

  @computed public get isTouched(): boolean {
    return this._isTouched;
  }

  @computed public get isActive(): boolean {
    return this._isActive;
  }

  @computed public get isEqual(): (a: T, b: T) => boolean {
    return (
      this.props.isEqual ??
      ((a, b): boolean => {
        const isEqual = a === b;
        if (process.env.NODE_ENV !== 'production') {
          if (
            (a != null && (typeof a === 'function' || typeof a === 'object')) ||
            (b != null && (typeof b === 'function' || typeof b === 'object'))
          ) {
            console.warn(
              `using default (strict equal) operator on ${this.name} could be a mistake because, when having ` +
                `reference types for initial and current states, the default equality will always yield false.\n` +
                `This warning will not show up in production. IsEqual: ${String(isEqual)}, Values:`,
              a,
              b
            );
          }
        }
        return isEqual;
      })
    );
  }

  @computed public get isValid(): boolean {
    return this._errors.length === 0;
  }

  public get name(): keyof PickProperties<State, T> {
    return this.props.name;
  }

  @computed public get validateOnFocus(): boolean {
    return this.props.validateOnFocus ?? false;
  }

  @computed public get validateOnBlur(): boolean {
    return this.props.validateOnBlur ?? true;
  }

  @computed public get validateOnInit(): boolean {
    return this.props.validateOnInit ?? true;
  }

  @computed public get validateOnChange(): boolean {
    return this.props.validateOnChange ?? true;
  }

  @computed public get meta(): FormElement['meta'] {
    return this;
  }

  @computed public get fieldProps(): FieldRenderProps<T, State, Intermediate> {
    return {
      input: {
        onBlur: this.onBlur,
        onChange: this.onChange,
        onFocus: this.onFocus,
        value: this.value,
      },
      meta: this,
    };
  }

  @computed public get hasIntermediate(): boolean {
    return this.intermediate !== undefined;
  }

  private async _validate(): Promise<string[] | undefined> {
    if (this.intermediate == null) {
      if (this._validator) {
        return this._validator(this.value);
      }
    } else {
      if (this._intermediateValidator) {
        return this._intermediateValidator(this.intermediate);
      }
    }
    return undefined;
  }

  @action.bound public async validate(): Promise<boolean> {
    if (this.props.clearErrorsOnValidate) {
      this._errors = [];
    }
    const validateIndex = ++this._validationIndex;
    const errors = (await this._validate()) ?? [];
    return runInAction(() => {
      if (this._validationIndexComplete <= validateIndex) {
        this._validationIndexComplete = validateIndex;
        this._errors = errors;
      }
      return this.isValid;
    });
  }

  @action.bound public onChange(value: T, options?: {
     preserveIntermediate?: boolean
  }): void {
    if (!options?.preserveIntermediate) {
      this._intermediate = undefined;
    }
    this._isModified = true;
    this._isChangingThroughEvent = true;
    ((this.props.state[this.name] as unknown) as T) = value;
    this._isChangingThroughEvent = false;
    this.validateOnChange && this.validate();
  }

  @action.bound public onBlur(): void {
    this._isActive = false;
    this._isTouched = true;
    this.validateOnBlur && this.validate();
  }

  @action.bound public onFocus(): void {
    this._isActive = true;
    this._isVisited = true;
    this.validateOnFocus && this.validate();
  }

  private dispose(fn: () => unknown): void {
    this._disposeFns.push(fn);
  }

  @action.bound public async componentDidMount(): Promise<void> {
    this._initialState = toJS(this.props.state, { recurseEverything: true }) as State;

    const defaultDelay = 100;
    this.dispose(
      reaction(
        () => [this.props.validator, this.props.delay ?? defaultDelay] as [Validator<T>, number],
        ([validator, delay]) => {
          if (!delay) {
            this._validator = validator as Validator<T>;
          } else {
            this._validator = validator
              ? debounce(() => validator?.(this.value), delay ?? defaultDelay, {
                  leading: true,
                  maxWait: defaultDelay,
                })
              : undefined;
          }
        },
        { fireImmediately: true }
      )
    );

    this.dispose(
      reaction(
        () =>
          [this.props.intermediateValidator, this.props.delay ?? defaultDelay] as [
            Validator<Intermediate>,
            number
          ],
        ([validator, delay]) => {
          if (!delay) {
            this._intermediateValidator = validator as Validator<Intermediate>;
          } else {
            this._intermediateValidator = validator
              ? debounce(
                  async () => (this.intermediate === undefined ? undefined : validator?.(this.intermediate)),
                  delay ?? defaultDelay,
                  { leading: true, trailing: true, maxWait: defaultDelay }
                )
              : undefined;
          }
        },
        {
          fireImmediately: true,
        }
      )
    );

    this.dispose(
      reaction(
        () => this.intermediate,
        () => {
          this._isModified = true;
          this.validateOnChange && this.validate();
        }
      )
    );

    this.dispose(
      reaction(
        () => this.value,
        () => {
          // The value has not been edited by the user but rather programatically through the state.
          if (!this._isChangingThroughEvent) {
            this._isModified = true;
            this.validateOnChange && this.validate();
          }
        }
      )
    );

    // wait a tick for the reactions to do their job.
    await new Promise(resolve => setTimeout(resolve, 0));
    runInAction(() => {
      this.validateOnInit && this.validate();
      this.props.formContext?.register(this);
    });
  }

  public componentWillUnmount(): void {
    this._disposeFns.forEach(fn => fn());
    this.props.formContext?.unregister(this);
  }

  public render(): JSX.Element {
    return <Observer>{this.props.children.bind(this, this.fieldProps)}</Observer>;
  }
}
