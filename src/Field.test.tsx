import { fireEvent, render, waitForElement } from "@testing-library/react";
import { action, observable } from "mobx";
import { Observer } from "mobx-react";
import React from "react";
import { Field } from "./Field";

jest.useFakeTimers();

it("renders without crashing", async () => {
  const field = render(
    <Field<any> name="foo" state={{}} children={(): JSX.Element => <input />} />
  );
  await waitForElement(() => field.container.querySelector("input"));
});
it("sets initial state", async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onRender = jest.fn((initial: unknown) => <></>);
  const state = observable({
    value: "dirty"
  });
  const initialState = observable({
    value: "initial"
  });
  const field = render(
    <Field<any>
      name="state"
      state={{ state }}
      initialState={{ state: initialState }}
      children={({ input, meta }) => onRender(meta.initialValue)}
    />
  );

  expect(onRender).lastCalledWith(expect.objectContaining(initialState));

  initialState.value = "next initial";

  expect(onRender).lastCalledWith(expect.objectContaining(initialState));
});
it("sets initial state, copied from state at first render", async () => {
  const onRender = jest.fn(initial => <></>);
  const state = observable({
    value: "initial",
    nested: {
      value: "initial nested"
    }
  });
  const field = render(
    <Field<any>
      name="state"
      state={{ state }}
      children={({ input, meta }) => onRender(meta.initialValue)}
    />
  );

  expect(onRender).lastCalledWith(
    expect.objectContaining({
      value: "initial",
      nested: {
        value: "initial nested"
      }
    })
  );

  state.value = "dirty";
  state.nested.value = "dirty";

  expect(onRender).lastCalledWith(
    expect.objectContaining({
      value: "initial",
      nested: {
        value: "initial nested"
      }
    })
  );
});
it("sets touched, visited and active meta", async () => {
  const state = observable({
    value: "initial"
  });
  const onRender = jest.fn(
    ({ onFocus, onBlur }, { isTouched, isVisited, isActive }) => (
      <input data-testid="input" onFocus={onFocus} onBlur={onBlur} />
    )
  );
  const field = render(
    <Field<string>
      name="value"
      state={state}
      children={({ input, meta }) =>
        onRender(
          { onFocus: input.onFocus, onBlur: input.onBlur },
          {
            isTouched: meta.isTouched,
            isVisited: meta.isVisited,
            isActive: meta.isActive
          }
        )
      }
    />
  );

  expect(onRender).lastCalledWith(
    expect.anything(),
    expect.objectContaining({
      isTouched: false,
      isVisited: false,
      isActive: false
    })
  );

  fireEvent.focus(field.getByTestId("input"));

  expect(onRender).lastCalledWith(
    expect.anything(),
    expect.objectContaining({
      isTouched: false,
      isVisited: true,
      isActive: true
    })
  );

  fireEvent.blur(field.getByTestId("input"));

  expect(onRender).lastCalledWith(
    expect.anything(),
    expect.objectContaining({
      isTouched: true,
      isVisited: true,
      isActive: false
    })
  );
});
it("changes value", async () => {
  const state = observable({ value: 0 });
  const onRender = jest.fn(({ value, onChange }) => (
    <button data-testid="increment" onClick={() => onChange(value + 1)} />
  ));
  const field = render(
    <Field<number>
      name="value"
      state={state}
      children={({ input }) =>
        onRender({ value: input.value, onChange: input.onChange })
      }
    />
  );

  expect(onRender).lastCalledWith(expect.objectContaining({ value: 0 }));

  fireEvent.click(field.getByTestId("increment"));

  expect(onRender).lastCalledWith(expect.objectContaining({ value: 1 }));
  expect(state.value).toEqual(1);
});
it("does not validate when disabled", async () => {
  const state = observable({ value: 0 });
  const onRender = jest.fn(({ onChange, onBlur, onFocus }, { error }) => {
    return (
      <>
        <input
          data-testid="1"
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
        />
        <span>{error || "is-valid"}</span>)
      </>
    );
  });
  const onValidate = async (value: number) =>
    value > 0 ? undefined : ["is-invalid"];
  const onRenderChildren = ({ input, meta }: any) =>
    onRender(
      {
        onBlur: input.onBlur,
        onChange: input.onChange,
        onFocus: input.onFocus
      },
      { error: meta.errors.join("") }
    );
  const field = render(
    <Field<number>
      name="value"
      state={state}
      validator={onValidate}
      children={onRenderChildren}
      validateOnInit={false}
      validateOnBlur={false}
      validateOnChange={false}
      validateOnFocus={false}
    />
  );

  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));

  fireEvent.focus(field.getByTestId("1"));
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));

  fireEvent.change(field.getByTestId("1"), { target: { value: "0" } });
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));

  fireEvent.blur(field.getByTestId("1"));
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));
});
it("validates value when enabled", async () => {
  const state = observable({ value: 0 });
  const onRender = jest.fn(
    ({ value, onChange, onBlur, onFocus }, { error }) => {
      return (
        <>
          <input
            type="text"
            data-testid="1"
            value={value}
            onChange={() => {}}
            onInput={(e: any) => onChange(parseInt(e.target.value))}
            onBlur={onBlur}
            onFocus={onFocus}
          />
          <span>{error || "is-valid"}</span>)
        </>
      );
    }
  );
  const onValidate = async (value: number) => {
    return value > 0 ? undefined : ["is-invalid"];
  };
  const onRenderChildren = ({ input, meta }: any) => (
    <Observer>
      {() =>
        onRender(
          {
            value: input.value,
            onBlur: input.onBlur,
            onChange: input.onChange,
            onFocus: input.onFocus
          },
          { error: meta.errors.join("") }
        )
      }
    </Observer>
  );
  const field = render(
    <Field<number>
      delay={0}
      name="value"
      state={state}
      validator={onValidate}
      children={onRenderChildren}
      validateOnInit={true}
      validateOnBlur={true}
      validateOnChange={true}
      validateOnFocus={true}
    />
  );
  const input = field.getByTestId("1");

  expect(onRender).lastCalledWith(
    expect.objectContaining({ value: 0 }),
    expect.anything()
  );
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-invalid"));

  state.value = 1;
  expect(onRender).lastCalledWith(
    expect.objectContaining({ value: 1 }),
    expect.anything()
  );
  fireEvent.focus(input);
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));

  state.value = 0;
  expect(onRender).lastCalledWith(
    expect.objectContaining({ value: 0 }),
    expect.anything()
  );
  fireEvent.focus(input);
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-invalid"));

  state.value = 1;
  expect(onRender).lastCalledWith(
    expect.objectContaining({ value: 1 }),
    expect.anything()
  );
  fireEvent.input(input, { target: { value: "1" } });
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));

  state.value = 0;
  expect(onRender).lastCalledWith(
    expect.objectContaining({ value: 0 }),
    expect.anything()
  );
  fireEvent.input(input, { target: { value: "0" } });
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-invalid"));

  state.value = 1;
  expect(onRender).lastCalledWith(
    expect.objectContaining({ value: 1 }),
    expect.anything()
  );
  fireEvent.blur(input);
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));

  state.value = 0;
  expect(onRender).lastCalledWith(
    expect.objectContaining({ value: 0 }),
    expect.anything()
  );
  fireEvent.blur(input);
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-invalid"));

  state.value = 1;
  expect(onRender).lastCalledWith(
    expect.objectContaining({ value: 1 }),
    expect.anything()
  );
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));
  state.value = 0;
  expect(onRender).lastCalledWith(
    expect.objectContaining({ value: 0 }),
    expect.anything()
  );
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-invalid"));
});
it("sets intermediate value", async () => {
  const onChange = jest.fn((onChange, value) => onChange(value));
  const onIntermediate = jest.fn((meta, value) => (meta.intermediate = value));
  const field = render(
    <Field<string>
      name="value"
      state={{ value: "" }}
      children={({ input, meta }) => (
        <input
          data-testid="1"
          type="text"
          onInput={(e: any) =>
            e.target.value === "null"
              ? onIntermediate(meta, null)
              : onChange(input.onChange, e.target.value)
          }
        />
      )}
    />
  );
  const input = field.getByTestId("1");

  fireEvent.input(input, { target: { value: "" } });
  expect(onChange).nthCalledWith(1, expect.anything(), "");

  fireEvent.input(input, { target: { value: "null" } });
  expect(onIntermediate).nthCalledWith(1, expect.anything(), null);
});
it("validates intermediate value", async () => {
  const state = observable({ value: 0 });
  const onRender = jest.fn(({ input, meta }) => {
    return (
      <Observer>
        {() => (
          <>
            <input
              type="text"
              data-testid="1"
              value={meta.intermediate ?? input.value}
              onChange={() => {}}
              onInput={action((e: any) => {
                const num = parseInt(e.target.value);
                if (Number.isNaN(num) || num.toString() !== e.target.value) {
                  meta.intermediate = e.target.value;
                } else {
                  input.onChange(num);
                }
              })}
              onBlur={input.onBlur}
              onFocus={input.onFocus}
            />
            <span>{meta.errors.join("") || "is-valid"}</span>)
          </>
        )}
      </Observer>
    );
  });
  const onValidate = async (intermediate: string) => {
    return intermediate === undefined ? undefined : ["is-invalid"];
  };
  const field = render(
    <Field<number, { value: number }, string>
      delay={0}
      name="value"
      state={state}
      intermediateValidator={onValidate}
      children={onRender}
      validateOnInit={true}
      validateOnBlur={true}
      validateOnChange={true}
      validateOnFocus={true}
    />
  );
  const input = field.getByTestId("1");
  const makeValid = () => fireEvent.input(input, { target: { value: "0" } });
  const makeInvalid = () => fireEvent.input(input, { target: { value: "a" } });

  expect(onRender).lastCalledWith(
    expect.objectContaining({
      input: expect.objectContaining({ value: 0 }),
      meta: expect.objectContaining({ intermediate: undefined })
    })
  );
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));

  makeInvalid();
  jest.runOnlyPendingTimers();
  fireEvent.focus(input);
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-invalid"));

  makeValid();
  fireEvent.focus(input);
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));

  makeInvalid();
  fireEvent.focus(input);
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-invalid"));

  makeValid();
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));

  makeInvalid();
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-invalid"));

  makeValid();
  fireEvent.blur(input);
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-valid"));

  makeInvalid();
  fireEvent.blur(input);
  jest.runOnlyPendingTimers();
  await waitForElement(() => field.getByText("is-invalid"));
});
