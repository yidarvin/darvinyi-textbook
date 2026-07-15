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

function canvasPoint(canvas, point) {
  const rect = canvas.getBoundingClientRect();
  return {
    clientX: rect.left + rect.width * point.x,
    clientY: rect.top + rect.height * point.y,
  };
}

function dispatchCanvasMove(canvas, point, type = "mousemove") {
  canvas.dispatchEvent(new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    ...canvasPoint(canvas, point),
  }));
}

function installCanvasExplorer(canvas) {
  if (canvas.dataset.a11yCanvasExplorer) return;
  canvas.dataset.a11yCanvasExplorer = "true";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", `${widgetTitle(canvas)} chart. Use arrow keys to inspect positions; press Enter to select the current position.`);
  canvas.setAttribute("aria-keyshortcuts", "ArrowUp ArrowDown ArrowLeft ArrowRight Enter Space Escape");

  const point = { x: 0.5, y: 0.5 };
  const move = () => dispatchCanvasMove(canvas, point);
  canvas.addEventListener("focus", move);
  canvas.addEventListener("keydown", event => {
    const step = event.shiftKey ? 0.2 : 0.1;
    const delta = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0],
      ArrowUp: [0, -step], ArrowDown: [0, step],
    }[event.key];
    if (delta) {
      event.preventDefault();
      point.x = Math.max(0, Math.min(1, point.x + delta[0]));
      point.y = Math.max(0, Math.min(1, point.y + delta[1]));
      move();
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      dispatchCanvasMove(canvas, point, "click");
    }
    if (event.key === "Escape") canvas.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  });
  canvas.addEventListener("pointermove", event => {
    if (event.pointerType === "touch") dispatchCanvasMove(canvas, { x: (event.clientX - canvas.getBoundingClientRect().left) / canvas.getBoundingClientRect().width, y: (event.clientY - canvas.getBoundingClientRect().top) / canvas.getBoundingClientRect().height });
  });
  canvas.addEventListener("pointerup", event => {
    if (event.pointerType === "touch") dispatchCanvasMove(canvas, { x: (event.clientX - canvas.getBoundingClientRect().left) / canvas.getBoundingClientRect().width, y: (event.clientY - canvas.getBoundingClientRect().top) / canvas.getBoundingClientRect().height }, "click");
  });
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
  if (svg.nextElementSibling?.classList.contains("a11y-svg-explorer")) return;
  const marks = [...svg.querySelectorAll('[style*="cursor: pointer"], [style*="cursor: crosshair"]')];
  if (!marks.length) return;
  const select = document.createElement("select");
  select.className = "a11y-svg-explorer";
  select.setAttribute("aria-label", `Explore data in ${widgetTitle(svg)}`);
  select.innerHTML = '<option value="">Select a visual datum</option>';
  marks.forEach((mark, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = markDescription(mark, index);
    select.append(option);
  });
  select.addEventListener("change", () => {
    const mark = marks[Number(select.value)];
    if (!mark) return;
    mark.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true, view: window }));
  });
  select.addEventListener("blur", () => marks.forEach(mark => mark.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, cancelable: true, view: window }))));
  svg.insertAdjacentElement("afterend", select);
}

// Legacy widgets keep their visual interaction, but expose compact keyboard and
// touch equivalents. A canvas gets a discrete coordinate explorer; an SVG gets
// one native selector per chart, never one tab stop per rendered mark.
export default function WidgetAccessibility() {
  useEffect(() => {
    const root = document.getElementById("content-scroll");
    if (!root) return undefined;

    function enhance() {
      root.querySelectorAll('input[type="range"]').forEach((input, index) => {
        if (!input.getAttribute("aria-label")) input.setAttribute("aria-label", rangeLabel(input, index));
      });
      root.querySelectorAll("canvas").forEach(installCanvasExplorer);
      root.querySelectorAll("svg").forEach(installSvgExplorer);
    }

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
