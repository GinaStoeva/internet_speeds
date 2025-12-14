// ===============================
// Global Internet Speed Analyzer
// script.js (FULL FILE)
// ===============================

// Stores all CSV data
let rawData = [];

// Load CSV when page opens
fetch("data.csv")
  .then(response => response.text())
  .then(text => {
    const lines = text.split("\n").slice(1); // skip header

    lines.forEach(line => {
      const parts = line.split(",");
      if (parts.length < 11) return;

      rawData.push({
        country: parts[0],
        region: parts[2],
        speed2023: parseFloat(parts[9]) || 0,
        speed2024: parseFloat(parts[10]) || 0
      });
    });

    // Visible confirmation (no console needed)
    document.getElementById("status").innerText =
      "Loaded " + rawData.length + " countries";

    populateDropdown();
    drawCharts();
  });

// ===============================
// Dropdown Population
// ===============================

function populateDropdown() {
  const select = document.getElementById("countrySelect");
  select.innerHTML = "";

  rawData.forEach(row => {
    const option = document.createElement("option");
    option.value = row.country;
    option.textContent = row.country;
    select.appendChild(option);
  });

  select.addEventListener("change", updateCountryChart);
}

// ===============================
// Chart Setup
// ===============================

let topChart;
let countryChart;

function drawCharts() {
  drawTopCountriesChart();
  drawCountryChart(rawData[0]);
}

// -------------------------------
// Chart 1: Top 10 Countries
// -------------------------------

function drawTopCountriesChart() {
  const top = [...rawData]
    .sort((a, b) => b.speed2024 - a.speed2024)
    .slice(0, 10);

  topChart = new Chart(document.getElementById("chart1"), {
    type: "bar",
    data: {
      labels: top.map(c => c.country),
      datasets: [{
        label: "Top 10 Internet Speeds (2024)",
        data: top.map(c => c.speed2024)
      }]
    }
  });
}

// -------------------------------
// Chart 2: Selected Country
// -------------------------------

function drawCountryChart(country) {
  countryChart = new Chart(document.getElementById("chart2"), {
    type: "bar",
    data: {
      labels: ["2023", "2024"],
      datasets: [{
        label: country.country + " Internet Speed",
        data: [country.speed2023, country.speed2024]
      }]
    }
  });
}

// Update country chart on dropdown change
function updateCountryChart() {
  const selected = document.getElementById("countrySelect").value;
  const country = rawData.find(c => c.country === selected);

  countryChart.destroy();
  drawCountryChart(country);
}
