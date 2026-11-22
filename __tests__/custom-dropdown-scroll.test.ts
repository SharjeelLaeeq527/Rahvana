/**
 * @jest-environment jsdom
 *
 * The shared CustomDropdown (used in ~60 places) must not freeze page scrolling while open.
 * It used to be built on Radix Select, which locks <body> scroll and hides the scrollbar.
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom lacks these; Radix Popover / the list use them.
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO;
Element.prototype.scrollIntoView = () => {};

const OPTIONS = [
  { value: "Refused", label: "Refused" },
  { value: "Administrative Processing", label: "Administrative Processing" },
  { value: "Issued", label: "Issued" },
];

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const trigger = () => host.querySelector<HTMLButtonElement>('button[role="combobox"]')!;
const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));

it("opens without locking page scroll, and picks an option", () => {
  const onChange = jest.fn();
  act(() => root.render(React.createElement(CustomDropdown, { value: "", onChange, options: OPTIONS })));

  act(() => trigger().click());
  expect(trigger().getAttribute("aria-expanded")).toBe("true");
  expect(options().map((o) => o.textContent)).toEqual(["Refused", "Administrative Processing", "Issued"]);

  // What Radix Select (react-remove-scroll) does while open, and this must not.
  expect(document.body.hasAttribute("data-scroll-locked")).toBe(false);
  expect(document.body.style.overflow).not.toBe("hidden");
  expect(document.documentElement.style.overflow).not.toBe("hidden");

  act(() => options()[1].click());
  expect(onChange).toHaveBeenCalledWith("Administrative Processing");
  expect(trigger().getAttribute("aria-expanded")).toBe("false");
});

it("supports the keyboard: arrow down then Enter", () => {
  const onChange = jest.fn();
  act(() => root.render(React.createElement(CustomDropdown, { value: "Refused", onChange, options: OPTIONS })));
  const key = (k: string) =>
    act(() => {
      trigger().dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
    });
  key("ArrowDown"); // opens on the selected option
  key("ArrowDown"); // moves to the next one
  key("Enter");
  expect(onChange).toHaveBeenCalledWith("Administrative Processing");
});

it("shows a single option as a fixed field and selects it", () => {
  const onChange = jest.fn();
  act(() =>
    root.render(
      React.createElement(CustomDropdown, {
        value: "",
        onChange,
        options: [OPTIONS[0]],
        collapseWhenSingle: true,
      })
    )
  );
  expect(trigger()).toBeNull();
  expect(host.textContent).toContain("Refused");
  expect(onChange).toHaveBeenCalledWith("Refused");
});

it("does not pick a disabled option", () => {
  const onChange = jest.fn();
  const opts = [OPTIONS[0], { ...OPTIONS[1], disabled: true, disabledReason: "Not allowed" }];
  act(() => root.render(React.createElement(CustomDropdown, { value: "", onChange, options: opts })));
  act(() => trigger().click());
  expect(options()[1].getAttribute("title")).toBe("Not allowed");
  act(() => options()[1].click());
  expect(onChange).not.toHaveBeenCalled();
});

it("shows a search box for long lists and filters by it", () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }));
  act(() => root.render(React.createElement(CustomDropdown, { value: "", onChange: jest.fn(), options: many })));
  act(() => trigger().click());
  const search = document.querySelector<HTMLInputElement>('input[placeholder="Search..."]')!;
  expect(search).not.toBeNull();
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setValue.call(search, "11");
    search.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(options().map((o) => o.textContent)).toEqual(["Option 11"]);
});
