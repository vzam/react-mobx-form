import React from 'react';
import { Field } from './Field';
import { FormPreset } from './FormPreset';

export default {
  title: 'FormPreset',
  component: FormPreset,
};

export const ValidateEnabled = (): JSX.Element => {
  return (
    <FormPreset validateOnInit={true}>
      <Field
        initialState={{ value: 0 }}
        state={{ value: 0 }}
        name={'value'}
        validator={async v => (v === 0 ? ['error'] : [])}
      >
        {fieldProps => {
          return <p>errors: {fieldProps.meta.errors.length}</p>;
        }}
      </Field>
    </FormPreset>
  );
};

export const ValidateDisabled = (): JSX.Element => {
  return (
    <FormPreset validateOnInit={false}>
      <Field
        initialState={{ value: 0 }}
        state={{ value: 0 }}
        name={'value'}
        validator={async v => (v === 0 ? ['error'] : [])}
      >
        {fieldProps => {
          return <p>errors: {fieldProps.meta.errors.length}</p>;
        }}
      </Field>
    </FormPreset>
  );
};
