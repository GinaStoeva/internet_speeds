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

  const filtered = rawData.filter(d =>
    (region === "All" || d.region === region) &&
    (country === "All" || d.country === country)
  );

  const barCanvas = document.getElementById("barChart");
  if (!barCanvas) {
    console.error("barChart canvas missing");
    return;
  }

  const labels = filtered.map(d => d.country);
  const speeds = filtered.map(d => d.speed2024);

  if (barChart) barChart.destroy();

  barChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "2024 Avg Speed (Mbps)",
        data: speeds
      }]
    }
  });

  if (country !== "All" && filtered.length === 1) {
    const c = filtered[0];
    const lineCanvas = document.getElementById("lineChart");
    if (!lineCanvas) return;

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(lineCanvas, {
      type: "line",
      data: {
        labels: ["2023", "2024"],
        datasets: [{
          label: c.country + " Speed Trend",
          data: [c.speed2023, c.speed2024]
        }]
      }
    });
  }
}
