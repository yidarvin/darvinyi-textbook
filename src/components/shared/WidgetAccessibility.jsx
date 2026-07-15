import { useEffect } from "react";

function text(value) {
  return value.replace(/\s+/g, " ").trim();
}

function widgetTitle(element) {
  const card = element.closest(".widget-card");
  const titleId = card?.getAttribute("aria-labelledby");
  return text((titleId && document.getElementById(titleId)?.textContent) || "Interactive widget");
}

function rangeLabel(input, index) {
  const explicit = input.getAttribute("aria-label");
  if (explicit) return explicit;

  const label = input.labels?.[0] || input.closest("label");
  const labelText = stableLabel(text(label?.textContent || ""));
  if (labelText) return labelText;

  const previousText = stableLabel(text(input.previousElementSibling?.textContent || ""));
  if (previousText) return previousText;

  const parentText = stableLabel(text(input.parentElement?.firstElementChild?.textContent || ""));
  if (parentText) return parentText;

  return `${widgetTitle(input)} control ${index + 1}`;
}

// Legacy controls often render their current value next to the purpose label.
// An accessible name should name the control, not become stale as that value moves.
function stableLabel(value) {
  return value
    .replace(/\s*(?:=|:|→)\s*[+−-]?[\d.]+(?:\s*(?:%|×|x|ms|px|e[+−-]?\d+)?)?.*$/i, "")
    .replace(/\s+[+−-]?[\d.]+\s*$/, "")
    .trim();
}

function markDescription(mark, index) {
  const explicit = mark.getAttribute("aria-label") || mark.querySelector("title")?.textContent || mark.textContent;
  if (text(explicit || "")) return text(explicit);
  const row = mark.getAttribute("data-row");
  const col = mark.getAttribute("data-col");
  if (row !== null && col !== null) return `row ${Number(row) + 1}, column ${Number(col) + 1}`;
  return `visual mark ${index + 1}`;
}

function installSvgExplorer(svg) {
  if (svg.dataset.a11yExplorer === "manual") return;
  const marks = [...svg.querySelectorAll('[style*="cursor: pointer"], [style*="cursor: crosshair"]')];
  if (!marks.length) return;
  let select = svg.nextElementSibling?.classList.contains("a11y-svg-explorer")
    ? svg.nextElementSibling
    : null;
  if (!select) {
    select = document.createElement("select");
    select.className = "a11y-svg-explorer";
    select.setAttribute("aria-label", `Explore data in ${widgetTitle(svg)}`);
    svg.insertAdjacentElement("afterend", select);
  }

  const descriptions = marks.map(markDescription);
  const optionTexts = ["Select a visual datum", ...descriptions];
  if ([...select.options].some((option, index) => option.textContent !== optionTexts[index]) || select.options.length !== optionTexts.length) {
    const value = select.value;
    select.replaceChildren(...optionTexts.map((description, index) => {
      const option = document.createElement("option");
      option.value = index === 0 ? "" : String(index - 1);
      option.textContent = description;
      return option;
    }));
    select.value = value;
  }

  select.onchange = () => {
    const mark = marks[Number(select.value)];
    if (mark) mark.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true, view: window }));
  };
  select.onblur = () => marks.forEach(mark => mark.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, cancelable: true, view: window })));
}

// Legacy SVG widgets keep their visual interaction but expose one compact native
// selector per chart, never one tab stop per rendered mark. Canvas charts with
// meaningful data targets own semantic selectors in their widget component.
export default function WidgetAccessibility() {
  useEffect(() => {
    const root = document.getElementById("content-scroll");
    if (!root) return undefined;

    function enhance() {
      root.querySelectorAll('input[type="range"]').forEach((input, index) => {
        if (!input.getAttribute("aria-label")) input.setAttribute("aria-label", rangeLabel(input, index));
      });
      root.querySelectorAll("svg").forEach(installSvgExplorer);
    }

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label", "style"] });
    return () => observer.disconnect();
  }, []);

  return null;
}
