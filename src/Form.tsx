import { action, computed, observable } from 'mobx';
import { inject, observer, Observer, Provider } from 'mobx-react';
import React from 'react';
import { FormPresetProps } from "./FormPreset";

export interface FormProps extends FormPresetProps {
  formContext?: FormContext;
  isRoot?: boolean;
  children: ({ form }: { form: FormElement }) => JSX.Element;
}

export type FormElement = {
  meta: {
    isDirty: boolean;
    isPristine: boolean;
    isModified: boolean;
    isVisited: boolean;
    isTouched: boolean;
    isValid: boolean;
    isValidating: boolean;
    hasIntermediate: boolean;
  };
};

export type FormContext = FormElement & {
  register: (formElement: FormElement) => void;
  unregister: (formElement: FormElement) => void;
};

@inject(props => props)
@observer
export class Form extends React.Component<FormProps> implements FormContext {
  @observable private _fields: FormElement[] = [];

  @action.bound public register(field: FormElement): void {
    this._fields.push(field);
  }

  @action.bound public unregister(field: FormElement): void {
    this._fields = this._fields.filter(e => e !== field);
  }

  @computed public get meta(): FormElement['meta'] {
    return this;
  }

  @computed public get isDirty(): boolean {
    return this._fields.some(field => field.meta.isDirty);
  }

  @computed public get isPristine(): boolean {
    return this._fields.some(field => field.meta.isPristine);
  }

  @computed public get isModified(): boolean {
    return this._fields.some(field => field.meta.isModified);
  }

  @computed public get isVisited(): boolean {
    return this._fields.some(field => field.meta.isVisited);
  }

  @computed public get isValid(): boolean {
    return this._fields.every(field => field.meta.isValid);
  }

  @computed public get isValidating(): boolean {
    return this._fields.some(field => field.meta.isValidating);
  }

  @computed public get isTouched(): boolean {
    return this._fields.some(field => field.meta.isTouched);
  }

  @computed public get hasIntermediate(): boolean {
    return this._fields.some(field => field.meta.hasIntermediate);
  }

  public componentDidMount(): void {
    if (!this.props.isRoot) {
      this.props.formContext?.register(this);
    }
  }

  public componentWillUnmount(): void {
    this.props.formContext?.unregister(this);
  }

  public render(): JSX.Element {
    return (
      <Provider
        formContext={this}
        validateOnInit={this.props.validateOnInit}
        validateOnFocus={this.props.validateOnFocus}
        validateOnChange={this.props.validateOnChange}
        validateOnBlur={this.props.validateOnBlur}
      >
        <Observer>{(): JSX.Element => this.props.children({ form: this })}</Observer>
      </Provider>
    );
  }
}
