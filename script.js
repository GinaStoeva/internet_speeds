let rawData = [];
let chart1, chart2, chart3;

const statusEl = document.getElementById("status");
const selectEl = document.getElementById("countrySelect");

statusEl.textContent = "Loading dataset...";

// ---------- LOAD DATA ----------
fetch("data/internet_speeds.json")
  .then(res => res.json())
  .then(data => {
    rawData = data;

    if (!Array.isArray(rawData) || rawData.length === 0) {
      statusEl.textContent = "❌ Data loaded but empty.";
      return;
    }

    statusEl.textContent = `Loaded ${rawData.length} countries`;
    populateDropdown();
    initCharts();
  })
  .catch(err => {
    statusEl.textContent = "❌ Failed to load JSON data.";
    console.error(err);
  });

// ---------- DROPDOWN ----------
function populateDropdown() {
  selectEl.innerHTML = `<option value="">-- Choose a country --</option>`;

  rawData
    .map(d => d.country)
    .sort()
    .forEach(country => {
      const opt = document.createElement("option");
      opt.value = country;
      opt.textContent = country;
      selectEl.appendChild(opt);
    });

  selectEl.addEventListener("change", handleCountryChange);
}

// ---------- CHART SETUP ----------
function initCharts() {
  chart1 = createLineChart("chart1", "Internet Speed Over Time");
  chart2 = createBarChart("chart2", "2024 Speed by Country");
  chart3 = createBarChart("chart3", "2023 → 2024 Change");
}

function createLineChart(id, title) {
  return new Chart(document.getElementById(id), {
    type: "line",
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: title } }
    }
  });
}

function createBarChart(id, title) {
  return new Chart(document.getElementById(id), {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: title } }
    }
  });
}

// ---------- INTERACTION ----------
function handleCountryChange() {
  const country = selectEl.value;
  if (!country) return;

  const row = rawData.find(d => d.country === country);
  if (!row) return;

  updateCharts(row);
}

// ---------- UPDATE CHARTS ----------
function updateCharts(row) {
  const years = [
    "year_2017","year_2018","year_2019","year_2020",
    "year_2021","year_2022","year_2023","year_2024"
  ];

  const speeds = years.map(y => row[y] ?? 0);

  // Line chart
  chart1.data.labels = years.map(y => y.replace("year_",""));
  chart1.data.datasets = [{
    label: row.country,
    data: speeds,
    borderWidth: 2,
    fill: false
  }];
  chart1.update();

  // Bar chart 2024
  chart2.data.labels = [row.country];
  chart2.data.datasets = [{
    label: "2024 Speed (Mbps)",
    data: [row.year_2024 ?? 0]
  }];
  chart2.update();

  // Change chart
  chart3.data.labels = [row.country];
  chart3.data.datasets = [{
    label: "Change 2023 → 2024",
    data: [(row.year_2024 ?? 0) - (row.year_2023 ?? 0)]
  }];
  chart3.update();
}

