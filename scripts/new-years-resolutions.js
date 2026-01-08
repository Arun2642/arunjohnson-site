const DATA_URL = "data/new-years-resolutions.csv";

const TARGETS = {
  pushups: { goal: 10000, label: (value) => `${value} / 10,000 push ups` },
  elo: { min: 1000, goal: 1500, label: (value) => `Current ELO: ${value}` },
  juggle_catches: { goal: 100, label: (value) => `${value} / 100 catches` },
  biology_pages: { goal: 1555, label: (value) => `${value} / 1555 pages` },
  longest_run_miles: { goal: 13, label: (value) => `Longest run: ${value} miles` },
  vo2_max: { min: 45, goal: 55, max: 60, label: (value) => `Current: ${value} (range 45–60)` },
  long_form_posts: { goal: 5, label: (value) => `${value} / 5 posts` },
  nichrome_shorts: { goal: 20, label: (value) => `${value} / 20 shorts` },
  board_games: { goal: 10, label: (value) => `${value} / 10 games` },
  sailing_done: { label: (value) => (value ? "Done" : "Not yet") },
  books: { goal: 10, label: (value) => `${value} / 10 books` },
};

const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const parseCsvRows = (text) => {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  if (!headerLine || lines.length === 0) {
    return null;
  }
  const headers = headerLine.split(",");
  const rows = lines.map((line) => {
    const values = line.split(",");
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index];
      return acc;
    }, {});
  });
  return { headers, rows };
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toBoolean = (value) => String(value).trim().toLowerCase() === "true";

const updateProgress = (field, rawValue) => {
  const config = TARGETS[field];
  if (!config) {
    return;
  }
  const meta = document.querySelector(`[data-field="${field}"]`);
  const progress = document.querySelector(`[data-progress="${field}"]`);
  const percent = document.querySelector(`[data-percent="${field}"]`);

  if (field === "sailing_done") {
    updateSailingStatusBadge(rawValue);
    return;
  }

  const value = toNumber(rawValue);
  if (meta) {
    meta.textContent = config.label(value);
  }

  if (field === "vo2_max") {
    const rangeSpan = config.max - config.min;
    const percentWidth = clamp(((value - config.min) / rangeSpan) * 100);
    if (progress) {
      progress.style.width = `${percentWidth.toFixed(1)}%`;
    }
    return;
  }

  const baseline = config.min ?? 0;
  const percentValue = clamp(((value - baseline) / (config.goal - baseline)) * 100);
  if (progress) {
    progress.style.width = `${percentValue.toFixed(1)}%`;
  }
  if (percent) {
    percent.textContent = `${Math.round(percentValue)}%`;
  }
};

const updateSailingStatusBadge = (rawValue) => {
  const badge = document.querySelector('[data-field="sailing_done"]');
  if (!badge) {
    return;
  }
  const done = toBoolean(rawValue);
  badge.textContent = done ? "Done" : "Not yet";
  badge.classList.toggle("done", done);
  badge.classList.toggle("not-done", !done);
};

const renderGraph = (svg, field, values) => {
  if (!svg) {
    return;
  }
  const config = TARGETS[field] ?? {};
  const width = 240;
  const height = 120;
  const padding = 16;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const goalValue = field === "sailing_done" ? 1 : config.goal;

  const minValueCandidate = Number.isFinite(config.min) ? config.min : Math.min(...values, goalValue ?? Infinity);
  const maxValueCandidate = Number.isFinite(config.max) ? config.max : Math.max(...values, goalValue ?? -Infinity);
  let minValue = Number.isFinite(minValueCandidate) ? minValueCandidate : 0;
  let maxValue = Number.isFinite(maxValueCandidate) ? maxValueCandidate : 1;
  if (minValue === maxValue) {
    maxValue = minValue + 1;
  }

  const xStep = values.length > 1 ? plotWidth / (values.length - 1) : 0;
  const yScale = (value) => height - padding - ((value - minValue) / (maxValue - minValue)) * plotHeight;

  const points = values.map((value, index) => ({
    x: padding + index * xStep,
    y: yScale(value),
  }));

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");

  const goalLine = Number.isFinite(goalValue)
    ? `<line class="graph-goal-line" x1="${padding}" x2="${width - padding}" y1="${yScale(goalValue).toFixed(1)}" y2="${yScale(goalValue).toFixed(1)}" />`
    : "";

  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const pointsMarkup =
    points.length > 0
      ? `<circle class="graph-point" cx="${startPoint.x.toFixed(1)}" cy="${startPoint.y.toFixed(1)}" r="2.5" />
         <circle class="graph-point" cx="${endPoint.x.toFixed(1)}" cy="${endPoint.y.toFixed(1)}" r="2.5" />`
      : "";

  svg.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="none"></rect>
    <line class="graph-axis" x1="${padding}" x2="${width - padding}" y1="${height - padding}" y2="${height - padding}" />
    ${goalLine}
    <path class="graph-line" d="${pathData}" />
    ${pointsMarkup}
  `;
};

const buildGraphs = (rows) => {
  const graphSvgs = document.querySelectorAll(".graph-svg");
  if (!graphSvgs.length || !rows.length) {
    return;
  }
  const dateValues = rows.map((row) => row.date).filter(Boolean);
  const startDate = dateValues[0];
  const endDate = dateValues[dateValues.length - 1];

  graphSvgs.forEach((svg) => {
    const field = svg.dataset.graph;
    if (!field) {
      return;
    }
    const values = rows.map((row) => {
      const rawValue = row[field];
      if (field === "sailing_done") {
        return toBoolean(rawValue) ? 1 : 0;
      }
      return toNumber(rawValue);
    });
    renderGraph(svg, field, values);

    const caption = document.querySelector(`[data-graph-caption="${field}"]`);
    if (caption && startDate && endDate) {
      caption.textContent = `${startDate} \u2192 ${endDate}`;
    }
  });
};

const setupGraphToggles = () => {
  document.querySelectorAll(".resolution-graph").forEach((container) => {
    const button = container.querySelector(".graph-toggle");
    if (!button) {
      return;
    }
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const isPinned = container.classList.toggle("is-pinned");
      button.setAttribute("aria-expanded", String(isPinned));
    });
  });
};

const loadResolutions = async () => {
  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status}`);
    }
    const text = await response.text();
    const parsed = parseCsvRows(text);
    if (!parsed) {
      return;
    }
    const latestRow = parsed.rows[parsed.rows.length - 1];
    Object.entries(latestRow).forEach(([field, value]) => {
      if (field === "date") {
        return;
      }
      updateProgress(field, value);
      if (field === "sailing_done") {
        updateSailingStatusBadge(value);
      }
    });
    buildGraphs(parsed.rows);
  } catch (error) {
    console.warn("Unable to update resolutions progress:", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupGraphToggles();
  loadResolutions();
});
