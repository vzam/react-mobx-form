import { observer, Provider } from 'mobx-react';
import React from 'react';

export interface FormPresetProps {
   validateOnInit?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  validateOnFocus?: boolean;
}

@observer
export class FormPreset extends React.Component<FormPresetProps> {
   public render(): JSX.Element {
      return <Provider 
        validateOnInit={this.props.validateOnInit}
        validateOnFocus={this.props.validateOnFocus}
        validateOnChange={this.props.validateOnChange}
        validateOnBlur={this.props.validateOnBlur}>
           {this.props.children}
      </Provider>
   }
}
