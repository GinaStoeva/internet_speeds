let rawData = [];
let charts = {};

const statusEl = document.getElementById("status");
const selectEl = document.getElementById("countrySelect");

const YEARS = ["2017","2018","2019","2020","2021","2022","2023","2024"];

// ---------- LOAD JSON ----------
fetch("internet_speeds.json")
  .then(res => res.json())
  .then(data => {
    rawData = data.filter(d => d.country);

    statusEl.textContent = `Loaded ${rawData.length} countries`;

    buildDropdown();
    buildCharts();
    updateRankings();
  })
  .catch(err => {
    console.error(err);
    statusEl.textContent = "❌ Failed to load JSON dataset";
  });

// ---------- DROPDOWN ----------
function buildDropdown() {
  selectEl.multiple = true;
  selectEl.size = 10;
  selectEl.innerHTML = "";

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

// ---------- CHARTS ----------
function buildCharts() {
  charts.compare = new Chart(chart1, {
    type: "line",
    data: { labels: YEARS, datasets: [] },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Internet Speed Over Time (Selected Countries)" }
      }
    }
  });

  charts.improved = new Chart(chart2, {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: {
      plugins: {
        title: { display: true, text: "Most Improved Countries (2023 → 2024)" }
      }
    }
  });

  charts.top = new Chart(chart3, {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: {
      plugins: {
        title: { display: true, text: "Fastest Internet Speeds Globally (2024)" }
      }
    }
  });
}

// ---------- MULTI COUNTRY COMPARISON ----------
function updateComparisonChart() {
  const selected = [...selectEl.selectedOptions].map(o => o.value);

  charts.compare.data.datasets = selected.map(country => {
    const row = rawData.find(d => d.country === country);

    return {
      label: country,
      data: YEARS.map(y => row[y] ?? null),
      borderWidth: 2,
      tension: 0.3
    };
  });

  charts.compare.update();
}

// ---------- RANKINGS ----------
function updateRankings() {
  const improvements = rawData.map(r => ({
    country: r.country,
    change: (r["2024"] ?? 0) - (r["2023"] ?? 0)
  })).sort((a,b) => b.change - a.change);

  const top10 = improvements.slice(0, 10);

  charts.improved.data.labels = top10.map(d => d.country);
  charts.improved.data.datasets = [{
    label: "Mbps Increase",
    data: top10.map(d => d.change)
  }];
  charts.improved.update();

  const fastest = [...rawData]
    .filter(r => r["2024"] != null)
    .sort((a,b) => b["2024"] - a["2024"])
    .slice(0, 10);

  charts.top.data.labels = fastest.map(d => d.country);
  charts.top.data.datasets = [{
    label: "Mbps (2024)",
    data: fastest.map(d => d["2024"])
  }];
  charts.top.update();
}

