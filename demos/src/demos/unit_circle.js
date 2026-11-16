const COMMON_ANGLES = [
  [0, "0", "(1, 0)"],
  [30, "π/6", "(√3/2, 1/2)"],
  [45, "π/4", "(√2/2, √2/2)"],
  [60, "π/3", "(1/2, √3/2)"],
  [90, "π/2", "(0, 1)"],
  [120, "2π/3", "(-1/2, √3/2)"],
  [135, "3π/4", "(-√2/2, √2/2)"],
  [150, "5π/6", "(-√3/2, 1/2)"],
  [180, "π", "(-1, 0)"],
  [210, "7π/6", "(-√3/2, -1/2)"],
  [225, "5π/4", "(-√2/2, -√2/2)"],
  [240, "4π/3", "(-1/2, -√3/2)"],
  [270, "3π/2", "(0, -1)"],
  [300, "5π/3", "(1/2, -√3/2)"],
  [315, "7π/4", "(√2/2, -√2/2)"],
  [330, "11π/6", "(√3/2, -1/2)"],
  [360, "2π", "(1, 0)"],
];

export function normalizeAngle(angle) {
  const number = Number(angle);
  if (!Number.isFinite(number)) return 0;
  return ((number % 360) + 360) % 360;
}

export function angleValues(angle) {
  const degrees = normalizeAngle(angle);
  const radians = (degrees * Math.PI) / 180;
  const cosine = Math.abs(Math.cos(radians)) < 1e-12 ? 0 : Math.cos(radians);
  const sine = Math.abs(Math.sin(radians)) < 1e-12 ? 0 : Math.sin(radians);
  const quadrant =
    degrees === 0 || degrees === 90 || degrees === 180 || degrees === 270
      ? "On an axis"
      : degrees < 90
        ? "Quadrant I"
        : degrees < 180
          ? "Quadrant II"
          : degrees < 270
            ? "Quadrant III"
            : "Quadrant IV";
  return { degrees, radians, cosine, sine, quadrant };
}

export function closestCommonAngle(angle, tolerance = 1) {
  const degrees = Number(angle);
  return (
    COMMON_ANGLES.find(([candidate]) => Math.abs(candidate - degrees) <= tolerance) ??
    null
  );
}

const formatDecimal = (value) => {
  const clean = Math.abs(value) < 0.0005 ? 0 : value;
  return clean.toFixed(3).replace("-0.000", "0.000");
};

function element(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function svgElement(tag, attributes = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function render({ model, el }) {
  const controller = new AbortController();
  const { signal } = controller;
  el.replaceChildren();

  const style = element("style", {
    text: `
      .uc-shell {
        color: var(--pst-color-text-base, #172033);
        background: var(--pst-color-background, #fff);
        border: 1px solid var(--pst-color-border, #d8dee9);
        border-radius: 12px;
        padding: 1rem;
        font-family: var(--pst-font-family-base, system-ui, sans-serif);
      }
      .uc-layout { display: grid; grid-template-columns: minmax(300px, 1.45fr) minmax(220px, 0.8fr); gap: 1rem; align-items: center; }
      .uc-plot { width: 100%; min-height: 320px; touch-action: none; user-select: none; cursor: crosshair; }
      .uc-axis { stroke: #8190a5; stroke-width: 1.5; }
      .uc-circle { fill: color-mix(in srgb, #2f6fdb 7%, transparent); stroke: #2f6fdb; stroke-width: 3; }
      .uc-radius { stroke: #d1495b; stroke-width: 3; }
      .uc-projection { stroke: #4b8178; stroke-width: 2; stroke-dasharray: 5 4; }
      .uc-arc { fill: none; stroke: #9b51b4; stroke-width: 3; }
      .uc-point { fill: #d1495b; stroke: white; stroke-width: 3; cursor: grab; }
      .uc-point:active { cursor: grabbing; }
      .uc-label { fill: currentColor; font-size: 13px; }
      .uc-angle-label { fill: #7a3e8e; font-weight: 700; font-size: 13px; }
      .uc-panel { display: grid; gap: .8rem; }
      .uc-panel h3 { margin: 0; font-size: 1.05rem; }
      .uc-slider { width: 100%; accent-color: #2f6fdb; }
      .uc-readout { background: color-mix(in srgb, #2f6fdb 7%, transparent); border-radius: 8px; padding: .75rem; line-height: 1.65; }
      .uc-readout strong { font-variant-numeric: tabular-nums; }
      .uc-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: .35rem; }
      .uc-buttons button { border: 1px solid #9aa7b8; border-radius: 6px; padding: .35rem .2rem; background: var(--pst-color-background, white); color: inherit; cursor: pointer; }
      .uc-buttons button:hover { border-color: #2f6fdb; background: color-mix(in srgb, #2f6fdb 10%, transparent); }
      .uc-buttons button:focus-visible, .uc-slider:focus-visible { outline: 3px solid #f0a202; outline-offset: 2px; }
      .uc-help { margin: 0; color: var(--pst-color-text-muted, #566070); font-size: .9rem; }
      @media (max-width: 700px) {
        .uc-layout { grid-template-columns: 1fr; }
        .uc-plot { min-height: 280px; }
      }
      @media (prefers-color-scheme: dark) {
        .uc-shell { color: #e8edf5; background: #151b26; border-color: #3a4658; }
        .uc-buttons button { background: #202938; border-color: #617087; }
      }
    `,
  });

  const shell = element("section", {
    class: "uc-shell",
    "aria-label": "Interactive unit circle",
  });
  const layout = element("div", { class: "uc-layout" });
  const svg = svgElement("svg", {
    class: "uc-plot",
    viewBox: "0 0 400 340",
    role: "img",
    "aria-labelledby": "uc-title uc-description",
  });
  const title = svgElement("title", { id: "uc-title" });
  title.textContent = "Unit circle with a movable angle";
  const description = svgElement("desc", { id: "uc-description" });
  description.textContent =
    "A point on the unit circle shows cosine as its horizontal coordinate and sine as its vertical coordinate.";
  svg.append(title, description);

  const centerX = 190;
  const centerY = 170;
  const radius = 130;
  svg.append(
    svgElement("line", { class: "uc-axis", x1: 35, y1: centerY, x2: 355, y2: centerY }),
    svgElement("line", { class: "uc-axis", x1: centerX, y1: 15, x2: centerX, y2: 325 }),
    svgElement("circle", { class: "uc-circle", cx: centerX, cy: centerY, r: radius }),
  );

  const axisLabels = [
    [centerX + radius + 7, centerY - 7, "1"],
    [centerX - radius - 18, centerY - 7, "−1"],
    [centerX + 7, centerY - radius - 7, "1"],
    [centerX + 7, centerY + radius + 18, "−1"],
    [360, centerY - 7, "x"],
    [centerX + 8, 18, "y"],
  ];
  for (const [x, y, text] of axisLabels) {
    const label = svgElement("text", { class: "uc-label", x, y });
    label.textContent = text;
    svg.append(label);
  }

  const horizontalProjection = svgElement("line", { class: "uc-projection" });
  const verticalProjection = svgElement("line", { class: "uc-projection" });
  const radiusLine = svgElement("line", {
    class: "uc-radius",
    x1: centerX,
    y1: centerY,
  });
  const arc = svgElement("path", { class: "uc-arc" });
  const angleLabel = svgElement("text", { class: "uc-angle-label" });
  const point = svgElement("circle", {
    class: "uc-point",
    r: 9,
    tabindex: "0",
    role: "button",
    "aria-label": "Drag to change the angle",
  });
  svg.append(horizontalProjection, verticalProjection, radiusLine, arc, angleLabel, point);

  const panel = element("div", { class: "uc-panel" });
  const heading = element("h3", { text: "Explore an angle" });
  const sliderLabel = element("label", { for: "uc-angle", text: "Angle: " });
  const sliderValue = element("strong");
  sliderLabel.append(sliderValue);
  const slider = element("input", {
    class: "uc-slider",
    id: "uc-angle",
    type: "range",
    min: "0",
    max: "360",
    step: "1",
  });
  const readout = element("div", {
    class: "uc-readout",
    "aria-live": "polite",
  });
  const commonLabel = element("div", { text: "Jump to a common angle:" });
  const buttons = element("div", { class: "uc-buttons" });
  const buttonAngles = [
    [0, "0"],
    [30, "π/6"],
    [45, "π/4"],
    [60, "π/3"],
    [90, "π/2"],
    [120, "2π/3"],
    [135, "3π/4"],
    [150, "5π/6"],
    [180, "π"],
    [210, "7π/6"],
    [225, "5π/4"],
    [240, "4π/3"],
    [270, "3π/2"],
    [300, "5π/3"],
    [315, "7π/4"],
    [330, "11π/6"],
    [360, "2π"],
  ];
  const help = element("p", {
    class: "uc-help",
    text: "Use the slider, choose a common angle, or drag the red point.",
  });

  let currentAngle = Number(model.get("angle"));
  if (!Number.isFinite(currentAngle)) currentAngle = 45;
  currentAngle = Math.max(0, Math.min(360, currentAngle));

  function setAngle(angle) {
    currentAngle = Math.max(0, Math.min(360, Number(angle)));
    update();
  }

  for (const [degrees, label] of buttonAngles) {
    const button = element("button", {
      type: "button",
      text: label,
      "aria-label": `${degrees} degrees`,
    });
    button.addEventListener("click", () => setAngle(degrees), { signal });
    buttons.append(button);
  }

  function update() {
    const { degrees, radians, cosine, sine, quadrant } = angleValues(currentAngle);
    const theta = (degrees * Math.PI) / 180;
    const x = centerX + radius * cosine;
    const y = centerY - radius * sine;
    const arcRadius = 38;
    const arcX = centerX + arcRadius * cosine;
    const arcY = centerY - arcRadius * sine;
    const largeArc = degrees > 180 ? 1 : 0;
    const common = closestCommonAngle(currentAngle, 0.01);

    slider.value = String(currentAngle);
    sliderValue.textContent = `${Math.round(currentAngle)}°`;
    radiusLine.setAttribute("x2", x);
    radiusLine.setAttribute("y2", y);
    horizontalProjection.setAttribute("x1", centerX);
    horizontalProjection.setAttribute("y1", y);
    horizontalProjection.setAttribute("x2", x);
    horizontalProjection.setAttribute("y2", y);
    verticalProjection.setAttribute("x1", x);
    verticalProjection.setAttribute("y1", centerY);
    verticalProjection.setAttribute("x2", x);
    verticalProjection.setAttribute("y2", y);
    point.setAttribute("cx", x);
    point.setAttribute("cy", y);
    point.setAttribute(
      "aria-label",
      `Angle ${Math.round(degrees)} degrees. Cosine ${formatDecimal(cosine)}, sine ${formatDecimal(sine)}. Drag to change.`,
    );

    if (degrees === 0 || degrees === 360) {
      arc.setAttribute("d", "");
    } else {
      arc.setAttribute(
        "d",
        `M ${centerX + arcRadius} ${centerY} A ${arcRadius} ${arcRadius} 0 ${largeArc} 0 ${arcX} ${arcY}`,
      );
    }
    const labelTheta = Math.min(theta / 2, Math.PI * 1.75);
    angleLabel.setAttribute("x", centerX + 52 * Math.cos(labelTheta));
    angleLabel.setAttribute("y", centerY - 52 * Math.sin(labelTheta));
    angleLabel.textContent = "θ";

    const radiansText = common ? common[1] : `${(radians / Math.PI).toFixed(3)}π`;
    const exactText = common ? `<br><strong>Exact point:</strong> ${common[2]}` : "";
    readout.innerHTML = `
      <strong>θ:</strong> ${Math.round(degrees)}° = ${radiansText} radians<br>
      <strong>cos θ:</strong> ${formatDecimal(cosine)}<br>
      <strong>sin θ:</strong> ${formatDecimal(sine)}<br>
      <strong>Location:</strong> ${quadrant}${exactText}
    `;
  }

  slider.addEventListener("input", (event) => setAngle(event.target.value), { signal });

  function angleFromPointer(event) {
    const bounds = svg.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 400;
    const y = ((event.clientY - bounds.top) / bounds.height) * 340;
    let degrees = (Math.atan2(centerY - y, x - centerX) * 180) / Math.PI;
    if (degrees < 0) degrees += 360;
    const common = closestCommonAngle(degrees, 3);
    return common ? common[0] : Math.round(degrees);
  }

  let dragging = false;
  svg.addEventListener(
    "pointerdown",
    (event) => {
      dragging = true;
      svg.setPointerCapture(event.pointerId);
      setAngle(angleFromPointer(event));
    },
    { signal },
  );
  svg.addEventListener(
    "pointermove",
    (event) => {
      if (dragging) setAngle(angleFromPointer(event));
    },
    { signal },
  );
  svg.addEventListener(
    "pointerup",
    (event) => {
      dragging = false;
      svg.releasePointerCapture(event.pointerId);
    },
    { signal },
  );
  point.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        setAngle(Math.min(360, currentAngle + 1));
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        setAngle(Math.max(0, currentAngle - 1));
      }
    },
    { signal },
  );

  panel.append(heading, sliderLabel, slider, readout, commonLabel, buttons, help);
  layout.append(svg, panel);
  shell.append(layout);
  el.append(style, shell);
  update();

  return () => {
    controller.abort();
  };
}

export default { render };
