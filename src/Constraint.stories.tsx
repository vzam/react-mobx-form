import React, { useState } from 'react';
import { Constraint } from './Constraint';
import { Form } from './Form';

export default {
   title: 'Constraint',
   component: Constraint
};

export const Satisfied = (): JSX.Element => {
   const [valid, setValid] = useState(true);

   return <Form >
      {(formProps): JSX.Element => <>
         <Constraint satisfied={valid} />
         <p>
            Constraint Satisfied: {String(valid)}
         </p>
         <p>
            Form Valid: {String(formProps.form.meta.isValid)}
         </p>
         
         <button onClick={(): void => setValid(!valid)}>Toggle Valid</button>

      </>}
   </Form>
}
