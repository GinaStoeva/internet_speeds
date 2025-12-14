document.addEventListener("DOMContentLoaded", () => {

  const statusEl = document.getElementById("status");
  const selectEl = document.getElementById("countrySelect");

  let rawData = {};
  let charts = {};

  // ---------- LOAD CSV ----------
  Papa.parse("data/internet_speeds.csv", {
    download: true,
    header: true,
    complete: res => {

      res.data.forEach(d => {
        if (!d.country) return;
        rawData[d.country] = {
          region: d.region,
          y: {
            2017: +d["year 2017"],
            2018: +d["year 2018"],
            2019: +d["year 2019"],
            2020: +d["year 2020"],
            2021: +d["year 2021"],
            2022: +d["year 2022"],
            2023: +d["year 2023"],
            2024: +d["year 2024"]
          }
        };
      });

      statusEl.textContent = `Loaded ${Object.keys(rawData).length} countries`;

      buildDropdown();
      buildCharts();
      updateCompare();
      showRankings();
      showInequality();
      showCorrelation();
      buildGlobe();
    }
  });

  // ---------- DROPDOWN ----------
  function buildDropdown() {
    Object.keys(rawData).sort().forEach(c => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      selectEl.appendChild(o);
    });
    selectEl.addEventListener("change", updateCompare);
  }

  // ---------- YEARS ----------
  const years = ["2017","2018","2019","2020","2021","2022","2023","2024"];

  // ---------- CHARTS ----------
  function buildCharts() {
    charts.compare = new Chart(chartCompare, {
      type: "line",
      data: { labels: years, datasets: [] },
      options: { plugins: { title: { display: true, text: "Country Speed Comparison" }}}
    });

    charts.top = new Chart(chartTop, {
      type: "bar",
      data: { labels: [], datasets: [] },
      options: { plugins: { title: { display: true, text: "Most Improved Countries (2023–24)" }}}
    });

    charts.bottom = new Chart(chartBottom, {
      type: "bar",
      data: { labels: [], datasets: [] },
      options: { plugins: { title: { display: true, text: "Least Improved Countries (2023–24)" }}}
    });

    charts.inequality = new Chart(chartInequality, {
      type: "bar",
      data: { labels: [], datasets: [] },
      options: { plugins: { title: { display: true, text: "Digital Inequality Index by Region" }}}
    });

    charts.corr = new Chart(chartCorrelation, {
      type: "scatter",
      data: { datasets: [] },
      options: { plugins: { title: { display: true, text: "Speed vs Improvement Correlation" }}}
    });
  }

  // ---------- COMPARISON ----------
  function updateCompare() {
    const sel = [...selectEl.selectedOptions].map(o => o.value);
    charts.compare.data.datasets = sel.map(c => ({
      label: c,
      data: years.map(y => rawData[c].y[y] || 0),
      borderWidth: 2
    }));
    charts.compare.update();
  }

  // ---------- RANKINGS ----------
  function showRankings() {
    const arr = Object.entries(rawData).map(([c,d]) => ({
      c,
      diff: (d.y[2024]||0)-(d.y[2023]||0)
    })).sort((a,b)=>b.diff-a.diff);

    charts.top.data.labels = arr.slice(0,10).map(d=>d.c);
    charts.top.data.datasets=[{label:"Mbps",data:arr.slice(0,10).map(d=>d.diff)}];
    charts.top.update();

    charts.bottom.data.labels = arr.slice(-10).map(d=>d.c);
    charts.bottom.data.datasets=[{label:"Mbps",data:arr.slice(-10).map(d=>d.diff)}];
    charts.bottom.update();
  }

  // ---------- INEQUALITY ----------
  function showInequality() {
    const regions={};
    Object.values(rawData).forEach(d=>{
      regions[d.region]??=[];
      regions[d.region].push(d.y[2024]||0);
    });

    charts.inequality.data.labels=Object.keys(regions);
    charts.inequality.data.datasets=[{
      label:"Inequality",
      data:Object.values(regions).map(v=>Math.max(...v)-Math.min(...v))
    }];
    charts.inequality.update();
  }

  // ---------- CORRELATION ----------
  function showCorrelation() {
    charts.corr.data.datasets=[{
      label:"Countries",
      data:Object.values(rawData).map(d=>({
        x:d.y[2024]||0,
        y:(d.y[2024]||0)-(d.y[2023]||0)
      }))
    }];
    charts.corr.update();
  }

  // ---------- 3D GLOBE ----------
  function buildGlobe() {
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(45,1,0.1,1000);
    const renderer=new THREE.WebGLRenderer({alpha:true});
    renderer.setSize(420,420);
    document.getElementById("globeContainer").appendChild(renderer.domElement);

    const geo=new THREE.SphereGeometry(2,64,64);
    const mat=new THREE.MeshStandardMaterial({color:0x38bdf8});
    const globe=new THREE.Mesh(geo,mat);
    scene.add(globe);

    const light=new THREE.PointLight(0xffffff,1);
    light.position.set(5,5,5);
    scene.add(light);

    camera.position.z=5;

    function animate(){
      globe.rotation.y+=0.002;
      renderer.render(scene,camera);
      requestAnimationFrame(animate);
    }
    animate();
  }

});
