import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import React, { ReactElement } from "react";
import { JSDOM } from "jsdom";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import { useFSM } from "../useFSM";
import { FSMProvider, useFsm } from "../FSMProvider";

let dom: JSDOM | null = null;
let originalRaf: typeof globalThis.requestAnimationFrame;
let originalCancelRaf: typeof globalThis.cancelAnimationFrame;

before(() => {
  dom = new JSDOM("<!doctype html><html><body></body></html>");
  const { window } = dom;
  globalThis.window = window as unknown as typeof globalThis.window;
  globalThis.document = window.document;

  // Use Object.defineProperty to handle read-only navigator property
  Object.defineProperty(globalThis, 'navigator', {
    value: window.navigator,
    configurable: true,
    writable: true,
  });

  originalRaf =
    globalThis.requestAnimationFrame ??
    window.requestAnimationFrame ??
    ((cb: FrameRequestCallback) => setTimeout(cb, 0)) as any;
  originalCancelRaf =
    globalThis.cancelAnimationFrame ??
    window.cancelAnimationFrame ??
    ((handle: ReturnType<typeof setTimeout>) => clearTimeout(handle));

  globalThis.requestAnimationFrame = originalRaf;
  globalThis.cancelAnimationFrame = originalCancelRaf;
});

after(() => {
  dom?.window.close();
  dom = null;
});

afterEach(() => {
  cleanup();
  globalThis.requestAnimationFrame = originalRaf;
  globalThis.cancelAnimationFrame = originalCancelRaf;
});

function renderWithProvider(ui: ReactElement, config: any) {
  return render(<FSMProvider config={config}>{ui}</FSMProvider>);
}

describe("useFSM React bindings", () => {
  it("re-renders when act triggers a state transition", async () => {
    function Counter() {
      const { state, context, act: transition } = useFSM({
        initial: "idle",
        context: { count: 0 },
        states: {
          idle: { on: { start: "running" } },
          running: {
            enter: (ctx: { count: number }) => {
              ctx.count += 1;
            },
          },
        },
      });

      return (
        <div>
          <div data-testid="state">{state}</div>
          <div data-testid="count">{context.count}</div>
          <button onClick={() => transition("start")}>start</button>
        </div>
      );
    }

    const { getByTestId, getByText } = render(<Counter />);

    assert.equal(getByTestId("state").textContent, "idle");
    assert.equal(getByTestId("count").textContent, "0");

    await act(async () => {
      fireEvent.click(getByText("start"));
    });

    assert.equal(getByTestId("state").textContent, "running");
    assert.equal(getByTestId("count").textContent, "1");
  });

  it("uses requestAnimationFrame to drive update", async () => {
    let scheduled: FrameRequestCallback | null = null;
    const updates: number[] = [];

    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      scheduled = cb;
      return 1 as any;
    }) as any;

    globalThis.cancelAnimationFrame = (() => {}) as any;

    function Updater() {
      useFSM({
        initial: "idle",
        context: { ticks: 0 },
        states: {
          idle: {
            update: async (_dt: number, ctx: { ticks: number }) => {
              updates.push(ctx.ticks);
              ctx.ticks += 1;
            },
          },
        },
      });
      return null;
    }

    render(<Updater />);

    assert.ok(scheduled, "requestAnimationFrame should be scheduled");

    await act(async () => {
      await scheduled?.(0);
    });

    assert.equal(updates.length, 1);
    assert.equal(updates[0], 0);
  });

  it("defaults context to an empty object", () => {
    function NoContext() {
      const { context } = useFSM({
        initial: "solo",
        states: { solo: {} },
      });
      return <div data-testid="context">{JSON.stringify(context)}</div>;
    }

    const { getByTestId } = render(<NoContext />);

    assert.equal(getByTestId("context").textContent, "{}");
  });

  it("useFsm requires FSMProvider", () => {
    function Consumer() {
      const { state } = useFsm();
      return <div>{state}</div>;
    }

    assert.throws(() => render(<Consumer />));

    const { getByText } = renderWithProvider(<Consumer />, {
      initial: "idle",
      context: {},
      states: { idle: {} },
    });

    assert.equal(getByText("idle").textContent, "idle");
  });
});
