let rawData = [];
}


function updateCountrySelect() {
const region = regionSelect.value;
const countries = rawData
.filter(d => region === "All" || d.region === region)
.map(d => d.country)
.sort();


countrySelect.innerHTML = '<option value="All">All Countries</option>';
countries.forEach(c => countrySelect.innerHTML += `<option>${c}</option>`);
}


let barChart, lineChart;


function updateCharts() {
const region = regionSelect.value;
const country = countrySelect.value;


const filtered = rawData.filter(d =>
(region === "All" || d.region === region) &&
(country === "All" || d.country === country)
);


const labels = filtered.map(d => d.country);
const speeds = filtered.map(d => d.speed2024);


if (barChart) barChart.destroy();


barChart = new Chart(document.getElementById("barChart"), {
type: "bar",
data: {
labels,
datasets: [{
label: "2024 Avg Speed (Mbps)",
data: speeds
}]
}
});


if (country !== "All") {
const c = filtered[0];


if (lineChart) lineChart.destroy();


lineChart = new Chart(document.getElementById("lineChart"), {
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
