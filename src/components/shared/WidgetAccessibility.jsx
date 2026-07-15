import { useEffect } from "react";

function text(value) {
  return value.replace(/\s+/g, " ").trim();
}

function widgetTitle(element) {
  return text(element.closest(".widget-card")?.querySelector("[id]")?.textContent || "interactive");
}

function rangeLabel(input, index) {
  const explicit = input.getAttribute("aria-label");
  if (explicit) return explicit;

  const label = input.labels?.[0] || input.closest("label");
  const labelText = text(label?.textContent || "");
  if (labelText) return labelText;

  const previousText = text(input.previousElementSibling?.textContent || "");
  if (previousText) return previousText;

  const parentText = text(input.parentElement?.firstElementChild?.textContent || "");
  if (parentText) return parentText;

  return `${widgetTitle(input)} control ${index + 1}`;
}

function hoverLabel(element, index) {
  const visibleText = text(element.querySelector("title")?.textContent || element.textContent || "");
  const subject = visibleText || `data point ${index + 1}`;
  return `Explore ${subject} in ${widgetTitle(element)}`;
}

function dispatchHover(element, type) {
  element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
}

// A number of older SVG widgets were built around a mouse-only tooltip. This
// adapter gives those visual marks a named, focusable target and maps focus,
// Enter/Space, and tap back to the widget's existing hover behavior. It also
// supplies a programmatic name for legacy range inputs while individual widgets
// migrate to labelled controls.
export default function WidgetAccessibility() {
  useEffect(() => {
    const root = document.getElementById("content-scroll");
    if (!root) return undefined;

    function enhance() {
      root.querySelectorAll('input[type="range"]').forEach((input, index) => {
        if (!input.getAttribute("aria-label")) input.setAttribute("aria-label", rangeLabel(input, index));
      });

      root.querySelectorAll('svg [style*="cursor: pointer"], svg [style*="cursor: crosshair"]').forEach((element, index) => {
        if (element.dataset.a11yHoverTarget) return;
        element.dataset.a11yHoverTarget = "true";
        element.classList.add("a11y-hover-target");
        element.setAttribute("tabindex", "0");
        element.setAttribute("role", "button");
        element.setAttribute("aria-label", hoverLabel(element, index));
        element.setAttribute("aria-keyshortcuts", "Enter Space");
        element.addEventListener("focus", () => dispatchHover(element, "mouseover"));
        element.addEventListener("blur", () => dispatchHover(element, "mouseout"));
        element.addEventListener("click", () => dispatchHover(element, "mouseover"));
        element.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            dispatchHover(element, "mouseover");
          }
          if (event.key === "Escape") dispatchHover(element, "mouseout");
        });
      });
    }

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
