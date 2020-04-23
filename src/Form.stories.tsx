import React, { useState } from 'react';
import { Constraint } from './Constraint';
import { Form } from './Form';

export default {
  title: 'Form',
  component: Form,
};

export const Nested = (): JSX.Element => {
  const [nestedRootValid, setNestedRootValid] = useState(false);
  const [nestedFormValid, setNestedFormValid] = useState(false);

  return (
    <Form>
      {rootFormProps => {
        return (
          <div style={{border: `1px solid red`, padding: 10}}>
            <h1 style={{color: 'red'}}>I am the Root form. Valid: {String(rootFormProps.form.meta.isValid)}</h1>
            <Form isRoot>
              {nestedRootFormProps => {
                return (
                  <div style={{border: `1px solid green`, margin: 10}}>
                    <Constraint satisfied={nestedRootValid} />
                    <h2 style={{color: 'green'}}>I do not forward state (isRoot = true). Valid: {String(nestedRootFormProps.form.meta.isValid)}</h2>
                    <button onClick={(): void => setNestedRootValid(!nestedRootValid)}>toggle</button>
                  </div>
                );
              }}
            </Form>
            <Form>
              {nestedFormProps => {
                return (
                  <div style={{border: `1px solid blue`, margin: 10}}>
                    <Constraint satisfied={nestedFormValid} />
                    <h2 style={{color: 'blue'}}>But I do (isRoot = false). Valid: {String(nestedFormProps.form.meta.isValid)}</h2>
                    <button onClick={(): void => setNestedFormValid(!nestedFormValid)}>toggle</button>
                  </div>
                );
              }}
            </Form>
          </div>
        );
      }}
    </Form>
  );
};
