import { Widget } from "../types";

export const quickCapture: Widget = {
  id: "quick-capture",
  title: "Quick capture",
  subtitle: "Press enter to save",
  modes: ["morning", "day", "evening", "night"],
  priority() {
    return 100;
  },
  render(el, ctx) {
    const input = el.createEl("input", {
      cls: "prism-capture-input",
      attr: {
        type: "text",
        placeholder: "Capture a thought…",
        spellcheck: "true",
      },
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && input.value.trim()) {
        const text = input.value.trim();
        void ctx.capture(text).then((ok) => {
          if (ok) input.value = "";
        });
      }
    });
  },
};
