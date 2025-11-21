import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import React, { ReactElement } from "react";
import { JSDOM } from "jsdom";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { useFSM } from "../useFSM.js";
import { FSMProvider, useFsm } from "../FSMProvider.js";

let dom: JSDOM | null = null;
let originalRaf: typeof globalThis.requestAnimationFrame;
let originalCancelRaf: typeof globalThis.cancelAnimationFrame;

before(() => {
  dom = new JSDOM("<!doctype html><html><body></body></html>");
  const { window } = dom;
  globalThis.window = window as unknown as typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.navigator = window.navigator as Navigator;

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

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  globalThis.requestAnimationFrame = originalRaf;
  globalThis.cancelAnimationFrame = originalCancelRaf;
  cleanup();
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

    render(<Counter />);

    assert.equal(screen.getByTestId("state").textContent, "idle");
    assert.equal(screen.getByTestId("count").textContent, "0");

    await act(async () => {
      fireEvent.click(screen.getByText("start"));
    });

    assert.equal(screen.getByTestId("state").textContent, "running");
    assert.equal(screen.getByTestId("count").textContent, "1");
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

    render(<NoContext />);

    assert.equal(screen.getByTestId("context").textContent, "{}");
  });

  it("useFsm requires FSMProvider", () => {
    function Consumer() {
      const { state } = useFsm();
      return <div>{state}</div>;
    }

    assert.throws(() => render(<Consumer />));

    renderWithProvider(<Consumer />, {
      initial: "idle",
      context: {},
      states: { idle: {} },
    });

    assert.equal(screen.getByText("idle").textContent, "idle");
  });
});
