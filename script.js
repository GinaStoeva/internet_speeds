let rawData = [];
let charts = {};

const statusEl = document.getElementById("status");
const selectEl = document.getElementById("countrySelect");

// ---------- LOAD DATA ----------
fetch("data/internet_speeds.json")
  .then(res => res.json())
  .then(data => {
    rawData = data;
    statusEl.textContent = `Loaded ${rawData.length} countries`;

    buildDropdown();
    buildCharts();
    showRankings();
  })
  .catch(() => {
    statusEl.textContent = "❌ Failed to load dataset";
  });

// ---------- DROPDOWN (MULTI SELECT) ----------
function buildDropdown() {
  selectEl.multiple = true;
  selectEl.size = 8;

  rawData
    .map(d => d.country)
    .sort()
    .forEach(country => {
      const opt = document.createElement("option");
      opt.value = country;
      opt.textContent = country;
      selectEl.appendChild(opt);
    });

  selectEl.addEventListener("change", updateComparisonChart);
}

// ---------- CHART CREATION ----------
function buildCharts() {
  charts.compare = new Chart(chart1, {
    type: "line",
    data: { labels: years(), datasets: [] },
    options: { plugins: { title: { display: true, text: "Country Comparison (2017–2024)" } } }
  });

  charts.improved = new Chart(chart2, {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: { plugins: { title: { display: true, text: "Most Improved Countries (2023 → 2024)" } } }
  });

  charts.inequality = new Chart(chart3, {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: { plugins: { title: { display: true, text: "Digital Inequality Index by Region" } } }
  });
}

// ---------- YEARS ----------
function years() {
  return ["2017","2018","2019","2020","2021","2022","2023","2024"];
}

// ---------- MULTI-COUNTRY COMPARISON ----------
function updateComparisonChart() {
  const selected = [...selectEl.selectedOptions].map(o => o.value);

  charts.compare.data.datasets = selected.map(country => {
    const row = rawData.find(d => d.country === country);
    return {
      label: country,
      data: years().map(y => row[`year_${y}`] ?? 0),
      borderWidth: 2,
      fill: false
    };
  });

  charts.compare.update();
}

// ---------- MOST / LEAST IMPROVED ----------
function showRankings() {
  const improvements = rawData.map(r => ({
    country: r.country,
    change: (r.year_2024 ?? 0) - (r.year_2023 ?? 0)
  }));

  improvements.sort((a,b) => b.change - a.change);

  const top = improvements.slice(0, 10);
  charts.improved.data.labels = top.map(d => d.country);
  charts.improved.data.datasets = [{
    label: "Mbps Increase",
    data: top.map(d => d.change)
  }];
  charts.improved.update();

  showInequality();
}

// ---------- DIGITAL INEQUALITY INDEX ----------
function showInequality() {
  const regions = {};

  rawData.forEach(r => {
    if (!regions[r.region]) regions[r.region] = [];
    regions[r.region].push(r.year_2024 ?? 0);
  });

  const labels = [];
  const values = [];

  for (const region in regions) {
    const speeds = regions[region];
    const diff = Math.max(...speeds) - Math.min(...speeds);
    labels.push(region);
    values.push(diff);
  }

  charts.inequality.data.labels = labels;
  charts.inequality.data.datasets = [{
    label: "DII (Mbps)",
    data: values
  }];
  charts.inequality.update();
}
