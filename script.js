let rawData = [];
let charts = {};
const YEARS = ["2017","2018","2019","2020","2021","2022","2023","2024"];
const statusEl = document.getElementById("status");
const selectEl = document.getElementById("countrySelect");

// ---------- LOAD CSV ----------
Papa.parse("data/internet_speeds.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    rawData = results.data.map(d=>{
      let obj = { country: d.country, major_area: d.major_area, region: d.region };
      YEARS.forEach(y => obj[y] = parseFloat(d[`year ${y}`]) || null);
      return obj;
    }).filter(d=>d.country);
    
    statusEl.textContent = `✅ Loaded ${rawData.length} countries`;
    buildDropdown();
    buildCharts();
    updateAllCharts();
    initGlobe();
  },
  error: function() { statusEl.textContent = "❌ Failed to load CSV dataset"; }
});

// ---------- DROPDOWN ----------
function buildDropdown() {
  selectEl.innerHTML = "";
  rawData.map(d=>d.country).sort().forEach(country=>{
    const opt = document.createElement("option");
    opt.value = country;
    opt.textContent = country;
    selectEl.appendChild(opt);
  });
  selectEl.multiple = true;
  selectEl.addEventListener("change", updateComparisonChart);
}

// ---------- CHARTS ----------
function buildCharts() {
  const commonOptions = { responsive:true, plugins:{ legend:{ position:'top' } } };

  charts.top = new Chart(document.getElementById("chartTop"), {
    type: "bar",
    data: { labels:[], datasets:[] },
    options: {...commonOptions, plugins:{ title:{ display:true, text:"Fastest Internet Speeds Globally (2024)" } } }
  });

  charts.compare = new Chart(document.getElementById("chartCompare"), {
    type: "line",
    data: { labels:YEARS, datasets:[] },
    options: {...commonOptions, plugins:{ title:{ display:true, text:"Selected Countries Speed Over Years" } } }
  });

  charts.improved = new Chart(document.getElementById("chartImproved"), {
    type: "bar",
    data: { labels:[], datasets:[] },
    options: {...commonOptions, plugins:{ title:{ display:true, text:"Most Improved Countries (2023→2024)" } } }
  });

  charts.inequality = new Chart(document.getElementById("chartInequality"), {
    type: "bar",
    data: { labels:[], datasets:[] },
    options: {...commonOptions, plugins:{ title:{ display:true, text:"Digital Inequality Index by Region" } } }
  });

  charts.correlation = new Chart(document.getElementById("chartCorrelation"), {
    type: "scatter",
    data: { datasets:[] },
    options: {...commonOptions, plugins:{ title:{ display:true, text:"Internet Speed vs Inequality" } } }
  });
}

// ---------- UPDATE CHARTS ----------
function updateAllCharts() {
  updateTopChart();
  updateComparisonChart();
  updateImprovedChart();
  updateInequalityChart();
  updateCorrelationChart();
}

function updateTopChart() {
  const top10 = [...rawData].filter(r=>r["2024"]!=null).sort((a,b)=>b["2024"]-a["2024"]).slice(0,10);
  charts.top.data.labels = top10.map(d=>d.country);
  charts.top.data.datasets = [{ label:"Mbps (2024)", data:top10.map(d=>d["2024"]), backgroundColor:'#0ea5e9' }];
  charts.top.update();
}

function updateComparisonChart() {
  const selected = [...selectEl.selectedOptions].map(o=>o.value);
  charts.compare.data.datasets = selected.map(c=>{
    const row = rawData.find(d=>d.country===c);
    return { label:c, data:YEARS.map(y=>row[y]||0), borderWidth:2, tension:0.3 };
  });
  charts.compare.update();
}

function updateImprovedChart() {
  const improvements = rawData.map(r=>({ country:r.country, change:(r["2024"]||0)-(r["2023"]||0) }))
    .sort((a,b)=>b.change-a.change).slice(0,10);
  charts.improved.data.labels = improvements.map(d=>d.country);
  charts.improved.data.datasets = [{ label:"Mbps Increase", data:improvements.map(d=>d.change), backgroundColor:'#f97316' }];
  charts.improved.update();
}

function updateInequalityChart() {
  const regions = {};
  rawData.forEach(r=>{ if(!regions[r.region]) regions[r.region]=[]; regions[r.region].push(r["2024"]||0); });
  const labels = Object.keys(regions);
  const values = labels.map(region=>Math.max(...regions[region])-Math.min(...regions[region]));
  charts.inequality.data.labels = labels;
  charts.inequality.data.datasets = [{ label:"DII (Mbps)", data:values, backgroundColor:'#22c55e' }];
  charts.inequality.update();
}

function updateCorrelationChart() {
  const points = rawData.map(r=>{
    const speed = r["2024"]||0;
    const inequality = Math.max(...YEARS.map(y=>r[y]||0))-Math.min(...YEARS.map(y=>r[y]||0));
    return { x:speed, y:inequality, label:r.country };
  });
  charts.correlation.data.datasets = [{ label:"Country", data:points, backgroundColor:'#6366f1' }];
  charts.correlation.update();
}

// ---------- 3D ROTATING GLOBE ----------
function initGlobe() {
  const container = document.getElementById("globeContainer");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.1, 1000);
  camera.position.z = 3;
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.SphereGeometry(1,64,64);
  const texture = new THREE.TextureLoader().load("https://threejs.org/examples/textures/earth_atmos_2048.jpg");
  const material = new THREE.MeshStandardMaterial({ map:texture });
  const globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  const light = new THREE.AmbientLight(0xffffff,1);
  scene.add(light);

  function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.0015;
    renderer.render(scene, camera);
  }
  animate();
}

