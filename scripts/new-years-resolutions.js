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

const parseCsv = (text) => {
  const [headerLine, ...rows] = text.trim().split(/\r?\n/);
  if (!headerLine || rows.length === 0) {
    return null;
  }
  const headers = headerLine.split(",");
  const lastRow = rows[rows.length - 1].split(",");
  return headers.reduce((acc, header, index) => {
    acc[header] = lastRow[index];
    return acc;
  }, {});
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

const loadResolutions = async () => {
  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status}`);
    }
    const text = await response.text();
    const row = parseCsv(text);
    if (!row) {
      return;
    }
    Object.entries(row).forEach(([field, value]) => {
      if (field === "date") {
        return;
      }
      updateProgress(field, value);
      if (field === "sailing_done") {
        updateSailingStatusBadge(value);
      }
    });
  } catch (error) {
    console.warn("Unable to update resolutions progress:", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadResolutions();
});
