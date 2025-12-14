let rawData = [];
let countryChart, topChart, regionChart, compareChart;

// ================= LOAD CSV =================
fetch("./data.csv")
  .then(res => res.text())
  .then(text => {
    const lines = text.trim().split(/\r?\n/).slice(1);

    lines.forEach(line => {
      const p = line.split(",");
      if (p.length < 11) return;

      rawData.push({
        country: p[0].trim(),
        region: p[2].trim(),
        lat: parseFloat(p[5]),
        lng: parseFloat(p[6]),
        speed2023: parseFloat(p[9]) || 0,
        speed2024: parseFloat(p[10]) || 0
      });
    });

    document.getElementById("status").innerText =
      `Loaded ${rawData.length} countries`;

    populateDropdown();
    drawCharts();
    createGlobe();
  });

// ================= DROPDOWN =================
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

// ================= CHARTS =================
function drawCharts() {
  const ctxTop = document.getElementById("chartTop");
  const ctxCountry = document.getElementById("chartCountry");
  const ctxRegion = document.getElementById("chartRegion");
  const ctxCompare = document.getElementById("chartComparison");

  Chart.getChart(ctxTop)?.destroy();
  Chart.getChart(ctxCountry)?.destroy();
  Chart.getChart(ctxRegion)?.destroy();
  Chart.getChart(ctxCompare)?.destroy();

  const selected = document.getElementById("countrySelect").value;
  const selectedData = rawData.find(d => d.country === selected);

  // TOP 10 SPEEDS
  const top = [...rawData]
    .sort((a,b)=>b.speed2024-a.speed2024)
    .slice(0,10);

  topChart = new Chart(ctxTop, {
    type: "bar",
    data: {
      labels: top.map(d=>d.country),
      datasets: [{
        label: "Top 10 Internet Speeds (2024)",
        data: top.map(d=>d.speed2024)
      }]
    }
  });

  if (selectedData) {
    // COUNTRY YEAR COMPARISON
    countryChart = new Chart(ctxCountry, {
      type: "bar",
      data: {
        labels: ["2023", "2024"],
        datasets: [{
          label: selectedData.country,
          data: [selectedData.speed2023, selectedData.speed2024]
        }]
      }
    });

    // REGION AVERAGE
    const regionData = rawData.filter(d=>d.region===selectedData.region);
    const avg = regionData.reduce((a,b)=>a+b.speed2024,0)/regionData.length;

    regionChart = new Chart(ctxRegion, {
      type: "bar",
      data: {
        labels: ["Country", "Region Avg"],
        datasets: [{
          label: "Speed Comparison",
          data: [selectedData.speed2024, avg]
        }]
      }
    });

    // GLOBAL VS COUNTRY
    const globalAvg = rawData.reduce((a,b)=>a+b.speed2024,0)/rawData.length;

    compareChart = new Chart(ctxCompare, {
      type: "doughnut",
      data: {
        labels: ["Country", "Global Avg"],
        datasets: [{
          data: [selectedData.speed2024, globalAvg]
        }]
      }
    });
  }
}

// ================= 3D GLOBE =================
function createGlobe() {
  const container = document.getElementById("globeContainer");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, container.offsetWidth / 500, 0.1, 1000);
  camera.position.z = 300;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.offsetWidth, 500);
  container.appendChild(renderer.domElement);

  const globe = new ThreeGlobe()
    .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
    .pointsData(rawData)
    .pointLat(d => d.lat)
    .pointLng(d => d.lng)
    .pointAltitude(d => d.speed2024 / 300)
    .pointColor(() => "#38bdf8");

  scene.add(globe);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;

  function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.0008;
    renderer.render(scene, camera);
  }

  animate();
}
