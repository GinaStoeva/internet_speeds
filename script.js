let rawData = [];
let chartTop, chartCountry, chartCompare;

fetch("./data.csv")
  .then(res => res.text())
  .then(text => {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",");

    const countryIdx = headers.indexOf("Country");
    const speed2023Idx = headers.indexOf("Speed 2023");
    const speed2024Idx = headers.indexOf("Speed 2024");

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (!cols[countryIdx]) continue;

      rawData.push({
        country: cols[countryIdx],
        speed2023: parseFloat(cols[speed2023Idx]) || 0,
        speed2024: parseFloat(cols[speed2024Idx]) || 0
      });
    }

    document.getElementById("status").innerText =
      `Loaded ${rawData.length} countries`;

    populateDropdown();
    drawCharts();
  });

function populateDropdown() {
  const select = document.getElementById("countrySelect");
  rawData.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.country;
    opt.textContent = d.country;
    select.appendChild(opt);
  });

  select.addEventListener("change", drawCharts);
}

function drawCharts() {
  const selected = document.getElementById("countrySelect").value;
  const selectedData = rawData.find(d => d.country === selected);

  Chart.getChart("chart1")?.destroy();
  Chart.getChart("chart2")?.destroy();
  Chart.getChart("chart3")?.destroy();

  // TOP 10 COUNTRIES
  const top = [...rawData]
    .sort((a, b) => b.speed2024 - a.speed2024)
    .slice(0, 10);

  chartTop = new Chart(document.getElementById("chart1"), {
    type: "bar",
    data: {
      labels: top.map(d => d.country),
      datasets: [{
        label: "Top 10 Internet Speeds (2024)",
        data: top.map(d => d.speed2024)
      }]
    }
  });

  if (!selectedData) return;

  // COUNTRY COMPARISON
  chartCountry = new Chart(document.getElementById("chart2"), {
    type: "bar",
    data: {
      labels: ["2023", "2024"],
      datasets: [{
        label: selectedData.country,
        data: [selectedData.speed2023, selectedData.speed2024]
      }]
    }
  });

  // GLOBAL VS COUNTRY
  const globalAvg =
    rawData.reduce((sum, d) => sum + d.speed2024, 0) / rawData.length;

  chartCompare = new Chart(document.getElementById("chart3"), {
    type: "doughnut",
    data: {
      labels: ["Country", "Global Avg"],
      datasets: [{
        data: [selectedData.speed2024, globalAvg]
      }]
    }
  });
}
