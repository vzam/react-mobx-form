import { action, computed, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { FormContext, FormElement } from './FormContext';

@inject(props => props)
@observer
export class Constraint
  extends React.Component<{
    formContext?: FormContext;
    errors?: string[] | undefined;
    satisfied?: boolean | undefined;
    children?:
      | ((
          meta: FormElement['meta'] & {
            errors: string[] | undefined;
            satisfied: boolean | undefined;
          }
        ) => JSX.Element)
      | JSX.Element;
  }>
  implements FormElement {
  @observable private _validationIndex = 0;
  @observable private _validationIndexComplete = 0;

  public get isDirty(): boolean {
    return false;
  }

  public get isPristine(): boolean {
    return false;
  }

  public get isModified(): boolean {
    return false;
  }

  public get isVisited(): boolean {
    return false;
  }

  public get isTouched(): boolean {
    return false;
  }

  public get hasIntermediate(): boolean {
    return false;
  }

  public get errors(): string[] | undefined {
    return this.props.errors;
  }

  public get satisfied(): boolean | undefined {
     return this.props.satisfied;
  }

  public get meta(): FormElement['meta'] & { errors: string[] | undefined, satisfied: boolean | undefined } {
    return this;
  }

  @computed public get isValid(): boolean {
    return this.props.errors?.length === 0 || this.props.satisfied;
  }

  @computed public get isValidating(): boolean {
    return this._validationIndexComplete < this._validationIndex;
  }

  @action.bound public componentDidMount(): void {
    if (this.props.satisfied && this.props.errors) {
      throw new Error("Constraints' satisfied and errors properties are mutually exclusive");
    }
    this.props.formContext?.register(this);
  }

  @action.bound public componentWillReceiveProps(props): void {
    if (props.satisfied && props.errors) {
      throw new Error("Constraints' satisfied and errors properties are mutually exclusive");
    }
  }

  public render(): JSX.Element {
    return <>{typeof this.props.children === 'function' ? this.props.children(this) : this.props.children}</>;
  }

  public componentWillUnmount(): void {
    this.props.formContext?.unregister(this);
  }
}
