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
    initGlobe();
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
  const commonOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } }
  };

  charts.compare = new Chart(document.getElementById("chartCompare"), {
    type: "line",
    data: { labels: YEARS, datasets: [] },
    options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: "Internet Speed Over Time (Selected Countries)" } } }
  });

  charts.improved = new Chart(document.getElementById("chart2"), {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: "Most Improved Countries (2023 → 2024)" } } }
  });

  charts.top = new Chart(document.getElementById("chart1"), {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: "Fastest Internet Speeds Globally (2024)" } } }
  });

  charts.bottom = new Chart(document.getElementById("chartBottom"), {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: "Slowest Internet Speeds Globally (2024)" } } }
  });

  charts.inequality = new Chart(document.getElementById("chartInequality"), {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: "Digital Inequality Index by Region" } } }
  });

  charts.correlation = new Chart(document.getElementById("chartCorrelation"), {
    type: "scatter",
    data: { datasets: [] },
    options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: "Internet Speed vs Employment/Education" } }, scales: { x: { title: { display: true, text: "Internet Speed (Mbps)" } }, y: { title: { display: true, text: "Education Index / Employment %" } } } }
  });
}

// ---------- UPDATE MULTI-COUNTRY COMPARISON ----------
function updateComparisonChart() {
  const selected = [...selectEl.selectedOptions].map(o => o.value);

  if(selected.length === 0) return;

  charts.compare.data.datasets = selected.map((country, i) => {
    const row = rawData.find(d => d.country === country);
    const color = `hsl(${(i*60)%360}, 70%, 50%)`;
    return {
      label: country,
      data: YEARS.map(y => row[y] ?? null),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      tension: 0.3,
      fill: false
    };
  });

  charts.compare.update();
}

// ---------- UPDATE RANKINGS AND OTHER CHARTS ----------
function updateRankings() {
  // Most improved
  const improvements = rawData.map(r => ({
    country: r.country,
    change: (r["2024"] ?? 0) - (r["2023"] ?? 0)
  })).sort((a,b)=>b.change - a.change);

  charts.improved.data.labels = improvements.slice(0,10).map(d=>d.country);
  charts.improved.data.datasets = [{ label:"Mbps Increase", data: improvements.slice(0,10).map(d=>d.change), backgroundColor: 'rgba(16,185,129,0.8)' }];
  charts.improved.update();

  // Top speeds
  const fastest = [...rawData].filter(r=>r["2024"]!=null).sort((a,b)=>b["2024"]-a["2024"]).slice(0,10);
  charts.top.data.labels = fastest.map(d=>d.country);
  charts.top.data.datasets = [{ label:"Mbps", data: fastest.map(d=>d["2024"]), backgroundColor:'rgba(14,165,233,0.8)'}];
  charts.top.update();

  // Bottom speeds
  const slowest = [...rawData].filter(r=>r["2024"]!=null).sort((a,b)=>a["2024"]-b["2024"]).slice(0,10);
  charts.bottom.data.labels = slowest.map(d=>d.country);
  charts.bottom.data.datasets = [{ label:"Mbps", data: slowest.map(d=>d["2024"]), backgroundColor:'rgba(239,68,68,0.8)'}];
  charts.bottom.update();

  // Digital inequality
  const regions = {};
  rawData.forEach(r=>{
    if(!regions[r.region]) regions[r.region] = [];
    regions[r.region].push(r["2024"]??0);
  });
  charts.inequality.data.labels = Object.keys(regions);
  charts.inequality.data.datasets = [{
    label:"DII (Mbps)", 
    data:Object.values(regions).map(arr=>Math.max(...arr)-Math.min(...arr)),
    backgroundColor:'rgba(168,85,247,0.8)'
  }];
  charts.inequality.update();

  // Correlation (mock example with random employment/education)
  const scatterData = rawData.map(r=>({ x: r["2024"]??0, y: r.education_index ?? Math.random()*100 }));
  charts.correlation.data.datasets = [{ label:"Internet vs Education Index", data: scatterData, backgroundColor:'rgba(250,204,21,0.8)'}];
  charts.correlation.update();
}

// ---------- 3D GLOBE ----------
function initGlobe() {
  const container = document.getElementById("globeContainer");
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);
  camera.position.z = 2;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
  const sphereMaterial = new THREE.MeshPhongMaterial({ 
    color:0x0f172a,
    shininess:10,
    transparent:true,
    opacity:0.85,
    wireframe:false
  });
  const globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
  scene.add(globe);

  // Add light
  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(5,5,5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff,0.5));

  // Add points for countries
  rawData.forEach(r=>{
    const phi = (90 - r.lat) * (Math.PI/180);
    const theta = (r.lon + 180) * (Math.PI/180);
    const radius = 1.01 + (r["2024"]??0)/1000; // scale
    const x = radius*Math.sin(phi)*Math.cos(theta);
    const y = radius*Math.cos(phi);
    const z = radius*Math.sin(phi)*Math.sin(theta);

    const pointGeom = new THREE.SphereGeometry(0.01,6,6);
    const pointMat = new THREE.MeshBasicMaterial({color:0x0fb5e5});
    const point = new THREE.Mesh(pointGeom,pointMat);
    point.position.set(x,y,z);
    scene.add(point);
  });

  // Animate
  function animate(){
    requestAnimationFrame(animate);
    globe.rotation.y += 0.0015;
    scene.rotation.y += 0.0005;
    renderer.render(scene,camera);
  }
  animate();

  // Handle resize
  window.addEventListener('resize',()=>{
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w,h);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  });
}

