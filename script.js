// DEBUG: confirm script loaded
console.log("script.js loaded");

let rawData = [];

// SAFER fetch with error output
fetch("data/internet_speeds.json")
  .then(res => {
    if (!res.ok) {
      throw new Error("JSON not found");
    }
    return res.json();
  })
  .then(data => {
    console.log("Loaded data:", data);
    rawData = data;
    populateSelectors();
    updateCharts();
  })
  .catch(err => {
    console.error("Data loading error:", err);
  });

const regionSelect = document.getElementById("regionSelect");
const countrySelect = document.getElementById("countrySelect");

// Safety check
if (!regionSelect || !countrySelect) {
  console.error("Dropdown elements not found in HTML");
}

function populateSelectors() {
  const regions = [...new Set(rawData.map(d => d.region))].sort();

  regionSelect.innerHTML = '<option value="All">All Regions</option>';
  regions.forEach(r => {
    regionSelect.innerHTML += `<option value="${r}">${r}</option>`;
  });

  updateCountrySelect();

  regionSelect.onchange = () => {
    updateCountrySelect();
    updateCharts();
  };

  countrySelect.onchange = updateCharts;
}

function updateCountrySelect() {
  const region = regionSelect.value;

  const countries = rawData
    .filter(d => region === "All" || d.region === region)
    .map(d => d.country)
    .sort();

  countrySelect.innerHTML = '<option value="All">All Countries</option>';
  countries.forEach(c => {
    countrySelect.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

let barChart = null;
let lineChart = null;

function updateCharts() {
  const region = regionSelect.value;
  const country = countrySelect.value;

  let filtered = rawData.filter(d =>
    (region === "All" || d.region === region)
  );

  // ---------- BAR CHART (Top Countries) ----------
  const sorted = [...filtered].sort((a, b) => b.speed2024 - a.speed2024).slice(0, 10);

  if (barChart) barChart.destroy();
  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: sorted.map(d => d.country),
      datasets: [{
        label: "Top 10 Speeds (2024)",
        data: sorted.map(d => d.speed2024)
      }]
    }
  });

  // ---------- RANKING CHART ----------
  if (rankChart) rankChart.destroy();
  rankChart = new Chart(document.getElementById("rankChart"), {
    type: "horizontalBar",
    data: {
      labels: sorted.map(d => d.country),
      datasets: [{
        label: "Country Ranking",
        data: sorted.map(d => d.speed2024)
      }]
    }
  });

  // ---------- REGION AVERAGES ----------
  const regionMap = {};
  filtered.forEach(d => {
    regionMap[d.region] = (regionMap[d.region] || []).concat(d.speed2024);
  });

  const regionLabels = Object.keys(regionMap);
  const regionAvgs = regionLabels.map(r =>
    regionMap[r].reduce((a, b) => a + b, 0) / regionMap[r].length
  );

  if (regionChart) regionChart.destroy();
  regionChart = new Chart(document.getElementById("regionChart"), {
    type: "bar",
    data: {
      labels: regionLabels,
      datasets: [{
        label: "Regional Average Speed",
        data: regionAvgs
      }]
    }
  });

  // ---------- LINE CHART (Country Trend) ----------
  if (country !== "All") {
    const c = rawData.find(d => d.country === country);
    if (!c) return;

    if (lineChart) lineChart.destroy();
    lineChart = new Chart(document.getElementById("lineChart"), {
      type: "line",
      data: {
        labels: ["2023", "2024"],
        datasets: [{
          label: `${c.country} Speed Trend`,
          data: [c.speed2023, c.speed2024]
        }]
      }
    });
  }
}
