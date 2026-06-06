const API_BASE =
window.location.hostname === "127.0.0.1" && window.location.port === "5500"
? "http://127.0.0.1:5000"
: window.location.origin;

const originalFetch = window.fetch.bind(window);

window.fetch = function(url, options){

    if(typeof url === "string"){

        url = url.replace(
            "http://127.0.0.1:5000",
            API_BASE
        );

    }

    return originalFetch(url, options);

};
let bridgeData = [];
let liveData = null;
let currentRefreshRate = 2000;

let realtimeHistory = [];
const REALTIME_MAX_POINTS = 30;


let tempChart = null;
let fftChart = null;
let degChart = null;
let forecastChart = null;

let clockInterval = null;
let liveInterval = null;

// ================= PAGE ROUTER =================

function showPage(page){

const c = document.getElementById("page-content");

if(page === "dashboard"){
    loadDashboard();
}

if(page === "digitalTwin"){

    c.innerHTML = `
    <h1>🌉 DIGITAL TWIN SURAMADU</h1>

    <div id="bridge3d"></div>

    <div class="twin-panel">

        <div class="card">
            <h3>Temperature</h3>
            <h2 id="twinTemp">--</h2>
        </div>

        <div class="card">
            <h3>Wind Speed</h3>
            <h2 id="twinWind">--</h2>
        </div>

        <div class="card">
            <h3>Bridge Health</h3>
            <h2 id="twinHealth">--</h2>
        </div>

        <div class="card">
            <h3>Status</h3>
            <h2 id="twinStatus">--</h2>
        </div>

    </div>
    `;

    setTimeout(init3D,100);
}

if(page === "cctv"){

    c.innerHTML = `
    <h1>📷 CCTV MONITORING CENTER</h1>

    <div class="cctv-grid">

        <div class="cctv-box">
            <h3>CCTV 1 - Main Bridge</h3>
            <canvas id="cam1"></canvas>
        </div>

        <div class="cctv-box">
            <h3>CCTV 2 - Side View</h3>
            <canvas id="cam2"></canvas>
        </div>

        <div class="cctv-box">
            <h3>CCTV 3 - Top View</h3>
            <canvas id="cam3"></canvas>
        </div>

        <div class="cctv-box">
            <h3>CCTV 4 - Traffic View</h3>
            <canvas id="cam4"></canvas>
        </div>

    </div>
    `;

    setTimeout(initCCTV,100);
}

if(page === "traffic"){

    c.innerHTML = `
    <h1>🚗 TRAFFIC MONITORING CENTER</h1>

    <div class="cards">

        <div class="card">
            <h3>Total Vehicle</h3>
            <h1 id="trafficTotal">--</h1>
        </div>

        <div class="card">
            <h3>Cars</h3>
            <h1 id="trafficCars">--</h1>
        </div>

        <div class="card">
            <h3>Trucks</h3>
            <h1 id="trafficTrucks">--</h1>
        </div>

        <div class="card">
            <h3>Motorcycles</h3>
            <h1 id="trafficMotors">--</h1>
        </div>

    </div>

    <div class="traffic-layout">

        <div class="traffic-canvas-box">
            <h2>Live Traffic Flow</h2>
            <canvas id="trafficCanvas"></canvas>
        </div>

        <div class="traffic-info">

            <div class="traffic-card">
                <h3>Traffic Status</h3>
                <h2 id="trafficStatus">--</h2>
            </div>

            <div class="traffic-card">
                <h3>Average Speed</h3>
                <h2 id="trafficSpeed">--</h2>
            </div>

            <div class="traffic-card">
                <h3>Wind Influence</h3>
                <h2 id="trafficWind">--</h2>
            </div>

            <div class="traffic-card">
                <h3>Bridge Risk</h3>
                <h2 id="trafficRisk">--</h2>
            </div>

        </div>

    </div>

    <div class="traffic-chart-box">
        <h2>Traffic Volume Trend</h2>
        <canvas id="trafficChart"></canvas>
    </div>
    `;

    setTimeout(initTraffic,100);
}


if(page === "analytics"){

    c.innerHTML = `
    <h1>📈 STRUCTURAL ANALYTICS CENTER</h1>

    <div class="analytics-grid">

        <div class="analytics-card">
            <h3>Avg FFT Peak</h3>
            <h1 id="avgFFT">--</h1>
        </div>

        <div class="analytics-card">
            <h3>Avg Degradation</h3>
            <h1 id="avgDeg">--</h1>
        </div>

        <div class="analytics-card">
            <h3>Max Vibration</h3>
            <h1 id="maxVibration">--</h1>
        </div>

        <div class="analytics-card">
            <h3>Risk Level</h3>
            <h1 id="analyticsRisk">--</h1>
        </div>

    </div>

    <div class="analytics-layout">

        <div class="analytics-chart-box">
            <h3>FFT Peak Frequency Analysis</h3>
            <canvas id="analyticsFFTChart"></canvas>
        </div>

        <div class="analytics-chart-box">
            <h3>Degradation Score Analysis</h3>
            <canvas id="analyticsDegChart"></canvas>
        </div>

        <div class="analytics-chart-box">
            <h3>Acceleration Magnitude</h3>
            <canvas id="analyticsAccChart"></canvas>
        </div>

        <div class="analytics-chart-box">
            <h3>Forecast vs Degradation</h3>
            <canvas id="analyticsForecastChart"></canvas>
        </div>

    </div>

    <div class="sensor-table-box">
        <h2>Sensor Data Summary</h2>

        <table class="sensor-table">
            <thead>
                <tr>
                    <th>Sensor ID</th>
                    <th>FFT Peak</th>
                    <th>Degradation</th>
                    <th>Damage Class</th>
                    <th>Risk</th>
                </tr>
            </thead>

            <tbody id="analyticsTable">
            </tbody>
        </table>
    </div>
    `;

    setTimeout(initAnalytics,100);
}

if(page === "forecast"){

    c.innerHTML = `
    <h1>🔮 PREDICTIVE MAINTENANCE FORECAST</h1>

    <div class="forecast-grid">

        <div class="forecast-card">
            <h3>Current Damage</h3>
            <h1 id="forecastDamage">--</h1>
        </div>

        <div class="forecast-card">
            <h3>Current Health</h3>
            <h1 id="forecastHealth">--</h1>
        </div>

        <div class="forecast-card">
            <h3>30-Day Forecast</h3>
            <h1 id="forecast30">--</h1>
        </div>

        <div class="forecast-card">
            <h3>Maintenance Priority</h3>
            <h1 id="forecastPriority">--</h1>
        </div>

    </div>

    <div class="forecast-layout">

        <div class="forecast-chart-box">
            <h2>Forecast Score vs Degradation Trend</h2>
            <canvas id="forecastMainChart"></canvas>
        </div>

        <div class="maintenance-box">
            <h2>Maintenance Recommendation</h2>

            <div class="maintenance-item">
                <h3>Inspection Status</h3>
                <p id="inspectionStatus">--</p>
            </div>

            <div class="maintenance-item">
                <h3>Recommended Action</h3>
                <p id="recommendedAction">--</p>
            </div>

            <div class="maintenance-item">
                <h3>Estimated Maintenance Window</h3>
                <p id="maintenanceWindow">--</p>
            </div>

        </div>

    </div>

    <div class="forecast-table-box">
        <h2>Forecast Data Summary</h2>

        <table class="forecast-table">
            <thead>
                <tr>
                    <th>Sensor ID</th>
                    <th>Current Degradation</th>
                    <th>30-Day Forecast</th>
                    <th>Damage Class</th>
                    <th>Priority</th>
                </tr>
            </thead>

            <tbody id="forecastTable"></tbody>
        </table>
    </div>
    `;

    setTimeout(initForecastPage,100);
}

if(page === "settings"){

    c.innerHTML = `
    <h1>⚙ SYSTEM SETTINGS</h1>

    <div class="settings-grid">

        <div class="settings-card">
            <h3>API Status</h3>
            <h1 id="settingsApiStatus">Checking...</h1>
        </div>

        <div class="settings-card">
            <h3>Refresh Rate</h3>
            <h1 id="settingsRefreshRate">2 s</h1>
        </div>

        <div class="settings-card">
            <h3>System Mode</h3>
            <h1>Local Simulation</h1>
        </div>

    </div>

    <div class="settings-layout">

        <div class="settings-panel">
            <h2>Bridge Information</h2>

            <div class="settings-row">
                <span>Bridge ID</span>
                <strong>B001</strong>
            </div>

            <div class="settings-row">
                <span>Bridge Name</span>
                <strong>Suramadu Bridge</strong>
            </div>

            <div class="settings-row">
                <span>Digital Twin Model</span>
                <strong>surmadnew.glb</strong>
            </div>

            <div class="settings-row">
                <span>Dataset Source</span>
                <strong>bridge_dataset.csv</strong>
            </div>

            <div class="settings-row">
                <span>Sensor Status</span>
                <strong>4 Online</strong>
            </div>
        </div>

        <div class="settings-panel">
            <h2>System Configuration</h2>

            <div class="settings-row">
                <span>Realtime Refresh Rate</span>

                <select id="refreshSelect" class="settings-input">
                    <option value="1000">1 second</option>
                    <option value="2000" selected>2 seconds</option>
                    <option value="3000">3 seconds</option>
                    <option value="5000">5 seconds</option>
                </select>
            </div>

            <div class="settings-row">
                <span>Dashboard Theme</span>

                <select id="themeSelect" class="settings-input">
                    <option value="dark" selected>Dark Industrial</option>
                    <option value="blue">Blue Control Room</option>
                    <option value="green">Green Monitoring</option>
                </select>
            </div>

            <div class="settings-row">
                <span>API Endpoint</span>
                <strong>http://127.0.0.1:5000</strong>
            </div>

            <div class="settings-row">
                <span>History Endpoint</span>
                <strong>/api/history</strong>
            </div>

            <div class="settings-row">
                <span>Live Endpoint</span>
                <strong>/api/live</strong>
            </div>

            <button class="settings-button" onclick="testApiConnection()">
                Test API Connection
            </button>

            <p id="apiTestResult"></p>
        </div>

    </div>
    `;

    setTimeout(initSettingsPage,100);
}

}

// ================= DASHBOARD =================

function loadDashboard(){

const c = document.getElementById("page-content");

c.innerHTML = `
<div class="dashboard-header">

    <div>
        <h1>SMART BRIDGE COMMAND CENTER</h1>
        <h3>Bridge ID : B001</h3>
    </div>

    <div class="system-info">
        <h2 id="bridgeStatus">🟢 SAFE</h2>
        <h3 id="clock">00:00:00</h3>
    </div>

</div>

<div class="cards">

    <div class="card">
        <h3>Temperature</h3>
        <h1 id="temp">--</h1>
    </div>

    <div class="card">
        <h3>Humidity</h3>
        <h1 id="hum">--</h1>
    </div>

    <div class="card">
        <h3>Wind Speed</h3>
        <h1 id="wind">--</h1>
    </div>

    <div class="card">
        <h3>Bridge Health</h3>
        <h1 id="health">--</h1>
    </div>

</div>

<div class="status-section">

    <div class="status-card">
        <h2>🚨 Alarm Center</h2>
        <div id="alarmPanel">Waiting Data...</div>
    </div>

    <div class="status-card">
        <h2>📊 Structural Status</h2>
        <h3 id="damage">--</h3>
        <h3>Forecast : <span id="forecast">--</span></h3>
    </div>

</div>

<div class="sensor-summary">

    <div class="summary-box">Total Sensor : 4</div>
    <div class="summary-box">Online : 4</div>
    <div class="summary-box">Offline : 0</div>
    <div class="summary-box">Data Quality : 99.8%</div>

</div>

<div class="charts">

    <div class="chart-box">
        <h3>Temperature Trend</h3>
        <canvas id="c1"></canvas>
    </div>

    <div class="chart-box">
        <h3>FFT Analysis</h3>
        <canvas id="c2"></canvas>
    </div>

    <div class="chart-box">
        <h3>Degradation Trend</h3>
        <canvas id="c3"></canvas>
    </div>

    <div class="chart-box">
        <h3>Forecast Trend</h3>
        <canvas id="c4"></canvas>
    </div>

</div>
`;

startClock();
fetchData();
fetchLive();

}

// ================= CLOCK =================

function startClock(){

if(clockInterval){
    clearInterval(clockInterval);
}

clockInterval = setInterval(()=>{

    const clock = document.getElementById("clock");

    if(clock){
        const now = new Date();
        clock.innerText = now.toLocaleTimeString();
    }

},1000);

}

// ================= DATA =================

function fetchData(){

fetch("http://127.0.0.1:5000/api/history")
.then(r => r.json())
.then(d => {

    bridgeData = d;

    if(document.getElementById("c1")){
        renderCharts();
    }

})
.catch(err => console.error("History API Error:", err));

}

function fetchLive(){

fetch("http://127.0.0.1:5000/api/live")
.then(r => r.json())
.then(d => {

    liveData = d;

    let status = "🟢 SAFE";

    if(d.degradation_score > 40){
        status = "🟡 WARNING";
    }

    if(d.degradation_score > 70){
        status = "🔴 CRITICAL";
    }

    let alarm = [];

    if(d.temperature_c > 35){
        alarm.push("🟡 High Temperature");
    }

    if(d.wind_speed_mps > 8){
        alarm.push("🟡 High Wind");
    }

    if(d.degradation_score > 70){
        alarm.push("🔴 Structural Damage");
    }

    if(alarm.length === 0){
        alarm.push("🟢 All Systems Normal");
    }

    setText("temp", d.temperature_c.toFixed(1));
    setText("hum", d.humidity_percent.toFixed(1));
    setText("wind", d.wind_speed_mps.toFixed(1));
    setText("health", (100 - d.degradation_score).toFixed(1));
    setText("damage", d.damage_class);
    setText("forecast", d.forecast_score_next_30d.toFixed(1));
    setText("bridgeStatus", status);

    const alarmPanel = document.getElementById("alarmPanel");

    if(alarmPanel){
        alarmPanel.innerHTML = alarm.join("<br>");
    }

    setText("twinTemp", d.temperature_c.toFixed(1) + " °C");
    setText("twinWind", d.wind_speed_mps.toFixed(1) + " m/s");
    setText("twinHealth", (100 - d.degradation_score).toFixed(1) + "%");
    setText("twinStatus", status);

    pushRealtimeHistory(d);

    updateAllRealtimeCharts();

    if(document.getElementById("trafficTotal")){
        updateTrafficPanel();
    }

    if(document.getElementById("avgFFT")){
        updateAnalyticsRealtimeCards();
        updateAnalyticsRealtimeTable();
    }

    if(document.getElementById("forecastDamage")){
        updateForecastRealtimeCards();
        updateForecastRealtimeTable();
    }

})
.catch(err => console.error("Live API Error:", err));

}

function setText(id,value){

const el = document.getElementById(id);

if(el){
    el.innerText = value;
}

}


// ================= CHART =================

function renderCharts(){

if(!bridgeData || bridgeData.length === 0){
    return;
}

const labels = bridgeData.map(x => x.sensor_id);

if(tempChart) tempChart.destroy();
if(fftChart) fftChart.destroy();
if(degChart) degChart.destroy();
if(forecastChart) forecastChart.destroy();

tempChart = new Chart(document.getElementById("c1"), {
    type:"line",
    data:{
        labels:labels,
        datasets:[{
            label:"Temperature",
            data:bridgeData.map(x => x.temperature_c)
        }]
    },
    options:{
        responsive:true,
        maintainAspectRatio:false
    }
});

fftChart = new Chart(document.getElementById("c2"), {
    type:"bar",
    data:{
        labels:labels,
        datasets:[{
            label:"FFT Peak Frequency",
            data:bridgeData.map(x => x.fft_peak_freq)
        }]
    },
    options:{
        responsive:true,
        maintainAspectRatio:false
    }
});

degChart = new Chart(document.getElementById("c3"), {
    type:"line",
    data:{
        labels:labels,
        datasets:[{
            label:"Degradation Score",
            data:bridgeData.map(x => x.degradation_score)
        }]
    },
    options:{
        responsive:true,
        maintainAspectRatio:false
    }
});

forecastChart = new Chart(document.getElementById("c4"), {
    type:"bar",
    data:{
        labels:labels,
        datasets:[{
            label:"Forecast Score",
            data:bridgeData.map(x => x.forecast_score_next_30d)
        }]
    },
    options:{
        responsive:true,
        maintainAspectRatio:false
    }
});

}

// ================= DIGITAL TWIN 3D =================

function init3D(){

const el = document.getElementById("bridge3d");
if(!el) return;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb9e3ff);

const camera = new THREE.PerspectiveCamera(
    55,
    el.clientWidth / el.clientHeight,
    0.1,
    10000
);

camera.position.set(35, 55, 170);

const renderer = new THREE.WebGLRenderer({
    antialias:true
});

renderer.setSize(el.clientWidth, el.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

if(renderer.outputEncoding !== undefined){
    renderer.outputEncoding = THREE.sRGBEncoding;
}

el.innerHTML = "";
el.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 15, 0);
controls.minDistance = 40;
controls.maxDistance = 450;
controls.maxPolarAngle = Math.PI / 2.05;

// ================= LIGHTING =================

const ambient = new THREE.HemisphereLight(
    0xffffff,
    0xcfe8d1,
    1.25
);

scene.add(ambient);

const sun = new THREE.DirectionalLight(
    0xffffff,
    1.8
);

sun.position.set(120, 220, 120);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

scene.add(sun);

// ================= LOAD BRIDGE MODEL =================

let bridgeModel = null;

const loader = new THREE.GLTFLoader();

loader.load(
    "models/surmadnew.glb",

    function(gltf){

        bridgeModel = gltf.scene;

        bridgeModel.scale.set(1,1,1);
        bridgeModel.position.set(0,0,0);

        bridgeModel.traverse(function(obj){

            if(obj.isMesh){

                obj.castShadow = true;
                obj.receiveShadow = true;

                if(obj.material){
                    obj.material.roughness = 0.95;
                    obj.material.metalness = 0.05;
                }

            }

        });

        scene.add(bridgeModel);

    },

    undefined,

    function(error){
        console.error("GLB Load Error:", error);
    }
);

// ================= VEHICLE MODEL =================

function createVehicle(color, type){

    const group = new THREE.Group();

    let length = 5;
    let width = 2.1;
    let height = 1.4;

    if(type === "truck"){
        length = 8;
        width = 2.5;
        height = 2.1;
    }

    if(type === "motor"){
        length = 2.6;
        width = 0.9;
        height = 1.0;
    }

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, length),
        new THREE.MeshStandardMaterial({
            color:color
        })
    );

    body.position.y = 1.15;
    body.castShadow = true;
    group.add(body);

    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.8, height * 0.8, length * 0.42),
        new THREE.MeshStandardMaterial({
            color:color
        })
    );

    cabin.position.set(0, 2.0, -length * 0.12);
    cabin.castShadow = true;
    group.add(cabin);

    function makeWheel(x,z){

        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.42, 0.42, 0.28, 18),
            new THREE.MeshStandardMaterial({
                color:0x111111
            })
        );

        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.42, z);
        wheel.castShadow = true;

        return wheel;
    }

    group.add(makeWheel(-width * 0.48, -length * 0.3));
    group.add(makeWheel(width * 0.48, -length * 0.3));
    group.add(makeWheel(-width * 0.48, length * 0.3));
    group.add(makeWheel(width * 0.48, length * 0.3));

    return group;
}

// ================= VEHICLE ROAD PATH =================
// Kalau kendaraan masih terlalu kiri / kanan, ubah ROAD_CENTER_X.
// Kalau kendaraan terlalu dekat pembatas, ubah LANE_OFFSET.

const ROAD_CENTER_X = 0;
const LANE_OFFSET = 1.55;

const laneForward = new THREE.CatmullRomCurve3([
    new THREE.Vector3(ROAD_CENTER_X - LANE_OFFSET, 0, 190),
    new THREE.Vector3(ROAD_CENTER_X - LANE_OFFSET, 0, 120),
    new THREE.Vector3(ROAD_CENTER_X - LANE_OFFSET, 0, 60),
    new THREE.Vector3(ROAD_CENTER_X - LANE_OFFSET, 0, 0),
    new THREE.Vector3(ROAD_CENTER_X - LANE_OFFSET, 0, -70),
    new THREE.Vector3(ROAD_CENTER_X - LANE_OFFSET, 0, -150),
    new THREE.Vector3(ROAD_CENTER_X - LANE_OFFSET, 0, -220)
]);

const laneBackward = new THREE.CatmullRomCurve3([
    new THREE.Vector3(ROAD_CENTER_X + LANE_OFFSET, 0, -220),
    new THREE.Vector3(ROAD_CENTER_X + LANE_OFFSET, 0, -150),
    new THREE.Vector3(ROAD_CENTER_X + LANE_OFFSET, 0, -70),
    new THREE.Vector3(ROAD_CENTER_X + LANE_OFFSET, 0, 0),
    new THREE.Vector3(ROAD_CENTER_X + LANE_OFFSET, 0, 60),
    new THREE.Vector3(ROAD_CENTER_X + LANE_OFFSET, 0, 120),
    new THREE.Vector3(ROAD_CENTER_X + LANE_OFFSET, 0, 190)
]);

// ================= RAYCAST TO SURFACE =================

const raycaster = new THREE.Raycaster();

function getBridgeSurface(x,z){

    if(!bridgeModel){
        return null;
    }

    const origin = new THREE.Vector3(x, 300, z);
    const direction = new THREE.Vector3(0, -1, 0);

    raycaster.set(origin, direction);

    const hits = raycaster.intersectObject(bridgeModel, true);

    if(hits.length > 0){
        return hits[0].point.clone();
    }

    return null;
}

// ================= ADD VEHICLES =================

const vehicles = [];

function addVehicle(path, speed, color, type, startT){

    const mesh = createVehicle(color, type);

    scene.add(mesh);

    vehicles.push({
        mesh:mesh,
        path:path,
        speed:speed,
        t:startT
    });
}

addVehicle(laneForward, 0.00055, 0xef4444, "car", 0.05);
addVehicle(laneForward, 0.00043, 0x2563eb, "truck", 0.28);
addVehicle(laneForward, 0.00072, 0xfacc15, "motor", 0.55);

addVehicle(laneBackward, 0.00058, 0x22c55e, "car", 0.12);
addVehicle(laneBackward, 0.00047, 0xffffff, "car", 0.42);
addVehicle(laneBackward, 0.00039, 0xfb923c, "truck", 0.72);

// ================= UPDATE VEHICLES =================

function updateVehicle(v){

    v.t += v.speed;

    if(v.t > 1){
        v.t = 0;
    }

    const p = v.path.getPointAt(v.t);
    const pNext = v.path.getPointAt((v.t + 0.003) % 1);

    const surface = getBridgeSurface(p.x, p.z);
    const nextSurface = getBridgeSurface(pNext.x, pNext.z);

    if(surface && nextSurface){

        v.mesh.position.set(
            surface.x,
            surface.y + 0.06,
            surface.z
        );

        const dx = nextSurface.x - surface.x;
        const dz = nextSurface.z - surface.z;

        v.mesh.rotation.y = Math.atan2(dx, dz);

    }else{

        v.mesh.position.set(
            p.x,
            2.5,
            p.z
        );

    }

}

// ================= RESIZE =================

window.addEventListener("resize", function(){

    if(!el) return;

    camera.aspect = el.clientWidth / el.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        el.clientWidth,
        el.clientHeight
    );

});

// ================= ANIMATION =================

function animate(){

    requestAnimationFrame(animate);

    vehicles.forEach(updateVehicle);

    controls.update();

    renderer.render(
        scene,
        camera
    );

}

animate();

}
// ================= CCTV =================

function initCCTV(){

drawMainBridge("cam1");
drawSideView("cam2");
drawTopView("cam3");
drawTrafficView("cam4");

}

function drawMainBridge(id){

const canvas = document.getElementById(id);
if(!canvas) return;

const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 300;

let x = -60;

function animate(){

    ctx.fillStyle = "#020617";
    ctx.fillRect(0,0,500,300);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0,0,500,130);

    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(130,70,20,160);
    ctx.fillRect(350,70,20,160);

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(140,80);
    ctx.lineTo(250,150);
    ctx.lineTo(360,80);
    ctx.stroke();

    ctx.fillStyle = "#475569";
    ctx.fillRect(60,210,380,35);

    ctx.strokeStyle = "#facc15";
    ctx.setLineDash([20,15]);
    ctx.beginPath();
    ctx.moveTo(70,228);
    ctx.lineTo(430,228);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x,190,45,20);

    ctx.fillStyle = "#111827";
    ctx.fillRect(x+5,210,8,8);
    ctx.fillRect(x+32,210,8,8);

    x += 2.2;

    if(x > 520){
        x = -70;
    }

    requestAnimationFrame(animate);

}

animate();

}

function drawSideView(id){

const canvas = document.getElementById(id);
if(!canvas) return;

const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 300;

let x = -80;

function animate(){

    ctx.fillStyle = "#020617";
    ctx.fillRect(0,0,500,300);

    ctx.fillStyle = "#64748b";
    ctx.fillRect(30,145,440,45);

    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(100,190,25,80);
    ctx.fillRect(240,190,25,80);
    ctx.fillRect(380,190,25,80);

    ctx.fillStyle = "#0369a1";
    ctx.fillRect(0,260,500,40);

    ctx.strokeStyle = "#f8fafc";
    ctx.setLineDash([25,15]);
    ctx.beginPath();
    ctx.moveTo(40,168);
    ctx.lineTo(460,168);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x,120,65,30);

    ctx.fillStyle = "#1e40af";
    ctx.fillRect(x+45,105,30,45);

    ctx.fillStyle = "#111827";
    ctx.fillRect(x+8,150,10,10);
    ctx.fillRect(x+55,150,10,10);

    x += 1.8;

    if(x > 540){
        x = -120;
    }

    requestAnimationFrame(animate);

}

animate();

}

function drawTopView(id){

const canvas = document.getElementById(id);
if(!canvas) return;

const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 300;

let y1 = -60;
let y2 = 360;

function animate(){

    ctx.fillStyle = "#052e16";
    ctx.fillRect(0,0,500,300);

    ctx.fillStyle = "#075985";
    ctx.fillRect(0,0,150,300);
    ctx.fillRect(350,0,150,300);

    ctx.fillStyle = "#334155";
    ctx.fillRect(160,0,180,300);

    ctx.strokeStyle = "#f8fafc";
    ctx.setLineDash([20,15]);

    ctx.beginPath();
    ctx.moveTo(220,0);
    ctx.lineTo(220,300);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(280,0);
    ctx.lineTo(280,300);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(190,y1,30,55);

    ctx.fillStyle = "#f97316";
    ctx.fillRect(285,y2,30,55);

    y1 += 2.3;
    y2 -= 1.9;

    if(y1 > 330){
        y1 = -70;
    }

    if(y2 < -80){
        y2 = 360;
    }

    requestAnimationFrame(animate);

}

animate();

}

function drawTrafficView(id){

const canvas = document.getElementById(id);
if(!canvas) return;

const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 300;

let x1 = -60;
let x2 = -180;
let x3 = -300;

let count = 0;

function animate(){

    ctx.fillStyle = "#020617";
    ctx.fillRect(0,0,500,300);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "20px Arial";
    ctx.fillText("TRAFFIC MONITOR",20,35);

    ctx.font = "16px Arial";
    ctx.fillText("Vehicle Count : " + count,20,65);
    ctx.fillText("Status : NORMAL",20,90);
    ctx.fillText("Camera : ONLINE",20,115);

    ctx.fillStyle = "#475569";
    ctx.fillRect(0,180,500,50);

    ctx.strokeStyle = "#facc15";
    ctx.setLineDash([25,15]);
    ctx.beginPath();
    ctx.moveTo(0,205);
    ctx.lineTo(500,205);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x1,160,45,20);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(x2,200,35,18);

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x3,150,70,28);

    x1 += 2.8;
    x2 += 2.2;
    x3 += 1.5;

    if(x1 > 530){
        x1 = -80;
        count++;
    }

    if(x2 > 530){
        x2 = -120;
        count++;
    }

    if(x3 > 560){
        x3 = -200;
        count++;
    }

    requestAnimationFrame(animate);

}

animate();

}

let trafficChart = null;
let trafficAnimationId = null;

function initTraffic(){

updateTrafficPanel();
drawTrafficSimulation();
renderTrafficChart();

}

function updateTrafficPanel(){

let wind = 0;
let degradation = 0;

if(liveData){
    wind = liveData.wind_speed_mps;
    degradation = liveData.degradation_score;
}

let baseCars = 80;
let baseTrucks = 22;
let baseMotors = 45;

let windPenalty = Math.max(0, Math.round(wind * 2));
let riskPenalty = degradation > 70 ? 20 : degradation > 40 ? 10 : 0;

let cars = Math.max(20, baseCars - windPenalty);
let trucks = Math.max(5, baseTrucks - Math.round(windPenalty / 2));
let motors = Math.max(10, baseMotors - riskPenalty);

let total = cars + trucks + motors;

let status = "🟢 NORMAL";
let speed = 70;

if(wind > 8){
    status = "🟡 SLOW";
    speed = 45;
}

if(degradation > 70){
    status = "🔴 RESTRICTED";
    speed = 25;
}

setText("trafficTotal", total);
setText("trafficCars", cars);
setText("trafficTrucks", trucks);
setText("trafficMotors", motors);
setText("trafficStatus", status);
setText("trafficSpeed", speed + " km/h");
setText("trafficWind", wind.toFixed(1) + " m/s");

let risk = "LOW";

if(degradation > 40){
    risk = "MEDIUM";
}

if(degradation > 70){
    risk = "HIGH";
}

setText("trafficRisk", risk);

}

function drawTrafficSimulation(){

const canvas = document.getElementById("trafficCanvas");

if(!canvas){
    return;
}

const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 360;

let x1 = -80;
let x2 = -250;
let x3 = -420;
let x4 = -600;

if(trafficAnimationId){
    cancelAnimationFrame(trafficAnimationId);
}

function animate(){

ctx.fillStyle = "#020617";
ctx.fillRect(0,0,900,360);

// background panel
ctx.fillStyle = "#0f172a";
ctx.fillRect(0,0,900,90);

ctx.fillStyle = "#e5e7eb";
ctx.font = "26px Arial";
ctx.fillText("SMART BRIDGE LIVE TRAFFIC",25,40);

ctx.font = "16px Arial";

let statusText = "NORMAL";

if(liveData){
    if(liveData.wind_speed_mps > 8){
        statusText = "SLOW DUE TO WIND";
    }

    if(liveData.degradation_score > 70){
        statusText = "RESTRICTED DUE TO STRUCTURAL RISK";
    }
}

ctx.fillText("Status : " + statusText,25,68);

// road
ctx.fillStyle = "#334155";
ctx.fillRect(0,150,900,100);

// road borders
ctx.fillStyle = "#94a3b8";
ctx.fillRect(0,145,900,5);
ctx.fillRect(0,250,900,5);

// lane divider
ctx.strokeStyle = "#facc15";
ctx.lineWidth = 4;
ctx.setLineDash([35,25]);

ctx.beginPath();
ctx.moveTo(0,200);
ctx.lineTo(900,200);
ctx.stroke();

ctx.setLineDash([]);

// bridge side barrier
ctx.fillStyle = "#cbd5e1";
for(let i=0; i<900; i+=35){
    ctx.fillRect(i,130,18,12);
    ctx.fillRect(i,262,18,12);
}

// vehicle speed influenced by realtime data
let speedFactor = 1;

if(liveData){
    if(liveData.wind_speed_mps > 8){
        speedFactor = 0.55;
    }

    if(liveData.degradation_score > 70){
        speedFactor = 0.35;
    }
}

// car
drawCar(ctx,x1,165,"#ef4444");
drawCar(ctx,x2,215,"#22c55e");

// truck
drawTruck(ctx,x3,158,"#3b82f6");

// motor
drawMotor(ctx,x4,225,"#facc15");

x1 += 4.0 * speedFactor;
x2 += 3.4 * speedFactor;
x3 += 2.4 * speedFactor;
x4 += 5.2 * speedFactor;

if(x1 > 980) x1 = -100;
if(x2 > 980) x2 = -180;
if(x3 > 1050) x3 = -300;
if(x4 > 980) x4 = -220;

trafficAnimationId = requestAnimationFrame(animate);

}

animate();

}

function drawCar(ctx,x,y,color){

ctx.fillStyle = color;
ctx.fillRect(x,y,70,28);

ctx.fillStyle = "#bfdbfe";
ctx.fillRect(x+12,y+5,18,10);
ctx.fillRect(x+38,y+5,18,10);

ctx.fillStyle = "#111827";
ctx.beginPath();
ctx.arc(x+15,y+30,7,0,Math.PI*2);
ctx.fill();

ctx.beginPath();
ctx.arc(x+55,y+30,7,0,Math.PI*2);
ctx.fill();

}

function drawTruck(ctx,x,y,color){

ctx.fillStyle = color;
ctx.fillRect(x,y,95,35);

ctx.fillStyle = "#1e40af";
ctx.fillRect(x+65,y-15,35,50);

ctx.fillStyle = "#bfdbfe";
ctx.fillRect(x+73,y-8,16,15);

ctx.fillStyle = "#111827";
ctx.beginPath();
ctx.arc(x+20,y+38,8,0,Math.PI*2);
ctx.fill();

ctx.beginPath();
ctx.arc(x+75,y+38,8,0,Math.PI*2);
ctx.fill();

}

function drawMotor(ctx,x,y,color){

ctx.fillStyle = color;
ctx.fillRect(x,y,38,14);

ctx.fillStyle = "#111827";
ctx.beginPath();
ctx.arc(x+8,y+16,5,0,Math.PI*2);
ctx.fill();

ctx.beginPath();
ctx.arc(x+30,y+16,5,0,Math.PI*2);
ctx.fill();

ctx.fillStyle = "#e5e7eb";
ctx.fillRect(x+15,y-12,8,12);

}

function renderTrafficChart(){

const canvas = document.getElementById("trafficChart");

if(!canvas || !bridgeData || bridgeData.length === 0){
    return;
}

if(trafficChart){
    trafficChart.destroy();
}

const labels = bridgeData.slice(0,20).map((_,i) => "T" + (i+1));

const volumeData = bridgeData.slice(0,20).map(d => {

    let base = 120;

    if(d.wind_speed_mps > 8){
        base -= 30;
    }

    if(d.degradation_score > 70){
        base -= 45;
    }

    return Math.max(30, base + Math.round(Math.random() * 20));

});

trafficChart = new Chart(canvas,{
    type:"line",
    data:{
        labels:labels,
        datasets:[{
            label:"Traffic Volume",
            data:volumeData,
            tension:0.35,
            pointRadius:3,
            borderWidth:2
        }]
    },
    options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
            legend:{
                labels:{
                    boxWidth:20
                }
            }
        },
        scales:{
            y:{
                beginAtZero:true,
                max:160
            },
            x:{
                ticks:{
                    maxRotation:0,
                    autoSkip:true,
                    maxTicksLimit:10
                }
            }
        }
    }
});

}

let analyticsFFTChart = null;
let analyticsDegChart = null;
let analyticsAccChart = null;
let analyticsForecastChart = null;

function initAnalytics(){

if(!bridgeData || bridgeData.length === 0){
    fetch("http://127.0.0.1:5000/api/history")
    .then(r => r.json())
    .then(d => {
        bridgeData = d;
        renderAnalytics();
    });

    return;
}

renderAnalytics();

}

function renderAnalytics(){

if(!bridgeData || bridgeData.length === 0){
    return;
}

const avgFFT =
bridgeData.reduce((sum,d)=>sum+d.fft_peak_freq,0) / bridgeData.length;

const avgDeg =
bridgeData.reduce((sum,d)=>sum+d.degradation_score,0) / bridgeData.length;

const maxVibration =
Math.max(
...bridgeData.map(d =>
    Math.sqrt(
        d.acceleration_x*d.acceleration_x +
        d.acceleration_y*d.acceleration_y +
        d.acceleration_z*d.acceleration_z
    )
)
);

let risk = "LOW";
let riskClass = "risk-low";

if(avgDeg > 40){
    risk = "MEDIUM";
    riskClass = "risk-medium";
}

if(avgDeg > 70){
    risk = "HIGH";
    riskClass = "risk-high";
}

setText("avgFFT", avgFFT.toFixed(2) + " Hz");
setText("avgDeg", avgDeg.toFixed(1));
setText("maxVibration", maxVibration.toFixed(2));
setText("analyticsRisk", risk);

const riskElement = document.getElementById("analyticsRisk");

if(riskElement){
    riskElement.className = riskClass;
}

renderAnalyticsCharts();
renderAnalyticsTable();

}

function renderAnalyticsCharts(){

const labels =
bridgeData.map((d,i)=>d.sensor_id + "-" + (i+1));

const fftData =
bridgeData.map(d=>d.fft_peak_freq);

const degData =
bridgeData.map(d=>d.degradation_score);

const accData =
bridgeData.map(d =>
    Math.sqrt(
        d.acceleration_x*d.acceleration_x +
        d.acceleration_y*d.acceleration_y +
        d.acceleration_z*d.acceleration_z
    )
);

const forecastData =
bridgeData.map(d=>d.forecast_score_next_30d);

if(analyticsFFTChart) analyticsFFTChart.destroy();
if(analyticsDegChart) analyticsDegChart.destroy();
if(analyticsAccChart) analyticsAccChart.destroy();
if(analyticsForecastChart) analyticsForecastChart.destroy();

analyticsFFTChart = new Chart(
document.getElementById("analyticsFFTChart"),
{
    type:"line",
    data:{
        labels:labels,
        datasets:[{
            label:"FFT Peak Frequency",
            data:fftData,
            tension:0.35,
            borderWidth:2,
            pointRadius:2
        }]
    },
    options:{
        responsive:true,
        maintainAspectRatio:false
    }
}
);

analyticsDegChart = new Chart(
document.getElementById("analyticsDegChart"),
{
    type:"bar",
    data:{
        labels:labels,
        datasets:[{
            label:"Degradation Score",
            data:degData
        }]
    },
    options:{
        responsive:true,
        maintainAspectRatio:false,
        scales:{
            y:{
                beginAtZero:true,
                max:100
            }
        }
    }
}
);

analyticsAccChart = new Chart(
document.getElementById("analyticsAccChart"),
{
    type:"line",
    data:{
        labels:labels,
        datasets:[{
            label:"Acceleration Magnitude",
            data:accData,
            tension:0.35,
            borderWidth:2,
            pointRadius:2
        }]
    },
    options:{
        responsive:true,
        maintainAspectRatio:false
    }
}
);

analyticsForecastChart = new Chart(
document.getElementById("analyticsForecastChart"),
{
    type:"line",
    data:{
        labels:labels,
        datasets:[
            {
                label:"Forecast Score",
                data:forecastData,
                tension:0.35,
                borderWidth:2,
                pointRadius:2
            },
            {
                label:"Degradation Score",
                data:degData,
                tension:0.35,
                borderWidth:2,
                pointRadius:2
            }
        ]
    },
    options:{
        responsive:true,
        maintainAspectRatio:false,
        scales:{
            y:{
                beginAtZero:true,
                max:100
            }
        }
    }
}
);

}

function renderAnalyticsTable(){

const table =
document.getElementById("analyticsTable");

if(!table){
    return;
}

let rows = "";

bridgeData.slice(0,15).forEach(d=>{

    let risk = "LOW";
    let riskClass = "risk-low";

    if(d.degradation_score > 40){
        risk = "MEDIUM";
        riskClass = "risk-medium";
    }

    if(d.degradation_score > 70){
        risk = "HIGH";
        riskClass = "risk-high";
    }

    rows += `
    <tr>
        <td>${d.sensor_id}</td>
        <td>${d.fft_peak_freq.toFixed(2)}</td>
        <td>${d.degradation_score.toFixed(1)}</td>
        <td>${d.damage_class}</td>
        <td class="${riskClass}">${risk}</td>
    </tr>
    `;

});

table.innerHTML = rows;

}

let forecastMainChart = null;

function initForecastPage(){

if(!bridgeData || bridgeData.length === 0){

    fetch("http://127.0.0.1:5000/api/history")
    .then(r => r.json())
    .then(d => {
        bridgeData = d;
        renderForecastPage();
    });

    return;
}

renderForecastPage();

}

function renderForecastPage(){

if(!bridgeData || bridgeData.length === 0){
    return;
}

const latest = liveData || bridgeData[0];

const currentHealth =
100 - latest.degradation_score;

const forecastScore =
latest.forecast_score_next_30d;

let priority = "LOW";
let priorityClass = "priority-low";

let inspectionStatus =
"Bridge condition is stable. Routine monitoring is sufficient.";

let recommendedAction =
"Continue normal monitoring and periodic sensor validation.";

let maintenanceWindow =
"Next scheduled inspection cycle.";

if(forecastScore > 60 || latest.degradation_score > 40){

    priority = "MEDIUM";
    priorityClass = "priority-medium";

    inspectionStatus =
    "Early signs of structural degradation detected.";

    recommendedAction =
    "Perform visual inspection and verify vibration sensor readings.";

    maintenanceWindow =
    "Inspection recommended within 30 days.";
}

if(forecastScore > 80 || latest.degradation_score > 70){

    priority = "HIGH";
    priorityClass = "priority-high";

    inspectionStatus =
    "High structural risk detected from degradation and forecast score.";

    recommendedAction =
    "Immediate engineering inspection and maintenance planning required.";

    maintenanceWindow =
    "Maintenance action recommended as soon as possible.";
}

setForecastText("forecastDamage", latest.damage_class);
setForecastText("forecastHealth", currentHealth.toFixed(1) + "%");
setForecastText("forecast30", forecastScore.toFixed(1));
setForecastText("forecastPriority", priority);

const priorityElement =
document.getElementById("forecastPriority");

if(priorityElement){
    priorityElement.className = priorityClass;
}

setForecastText("inspectionStatus", inspectionStatus);
setForecastText("recommendedAction", recommendedAction);
setForecastText("maintenanceWindow", maintenanceWindow);

renderForecastChart();
renderForecastTable();

}

function setForecastText(id,value){

const el =
document.getElementById(id);

if(el){
    el.innerText = value;
}

}

function renderForecastChart(){

const canvas =
document.getElementById("forecastMainChart");

if(!canvas || !bridgeData || bridgeData.length === 0){
    return;
}

if(forecastMainChart){
    forecastMainChart.destroy();
}

const dataSlice =
bridgeData.slice(0,30);

const labels =
dataSlice.map((_,i) => "T" + (i+1));

const degradationData =
dataSlice.map(d => d.degradation_score);

const forecastData =
dataSlice.map(d => d.forecast_score_next_30d);

forecastMainChart = new Chart(canvas,{
    type:"line",
    data:{
        labels:labels,
        datasets:[
            {
                label:"30-Day Forecast Score",
                data:forecastData,
                tension:0.35,
                borderWidth:2,
                pointRadius:3
            },
            {
                label:"Degradation Score",
                data:degradationData,
                tension:0.35,
                borderWidth:2,
                pointRadius:3
            }
        ]
    },
    options:{
        responsive:true,
        maintainAspectRatio:false,
        scales:{
            y:{
                beginAtZero:true,
                max:100
            },
            x:{
                ticks:{
                    maxRotation:0,
                    autoSkip:true,
                    maxTicksLimit:12
                }
            }
        }
    }
});

}

function renderForecastTable(){

const table =
document.getElementById("forecastTable");

if(!table || !bridgeData){
    return;
}

let rows = "";

bridgeData.slice(0,15).forEach(d => {

    let priority = "LOW";
    let priorityClass = "priority-low";

    if(d.forecast_score_next_30d > 60 || d.degradation_score > 40){
        priority = "MEDIUM";
        priorityClass = "priority-medium";
    }

    if(d.forecast_score_next_30d > 80 || d.degradation_score > 70){
        priority = "HIGH";
        priorityClass = "priority-high";
    }

    rows += `
    <tr>
        <td>${d.sensor_id}</td>
        <td>${d.degradation_score.toFixed(1)}</td>
        <td>${d.forecast_score_next_30d.toFixed(1)}</td>
        <td>${d.damage_class}</td>
        <td class="${priorityClass}">${priority}</td>
    </tr>
    `;

});

table.innerHTML = rows;

}

function initSettingsPage(){

testApiConnection();

const refreshSelect =
document.getElementById("refreshSelect");

if(refreshSelect){

    refreshSelect.value =
    String(currentRefreshRate);

    refreshSelect.addEventListener("change", function(){

        currentRefreshRate =
        Number(this.value);

        setText(
            "settingsRefreshRate",
            (currentRefreshRate / 1000) + " s"
        );

        if(typeof liveInterval !== "undefined" && liveInterval){
            clearInterval(liveInterval);
        }

        liveInterval =
        setInterval(fetchLive,currentRefreshRate);

    });

}

const themeSelect =
document.getElementById("themeSelect");

if(themeSelect){

    themeSelect.addEventListener("change", function(){

        applyDashboardTheme(this.value);

    });

}

}

function testApiConnection(){

const statusText =
document.getElementById("settingsApiStatus");

const result =
document.getElementById("apiTestResult");

fetch("http://127.0.0.1:5000/")
.then(r => r.text())
.then(text => {

    if(statusText){
        statusText.innerText = "ONLINE";
        statusText.className = "api-online";
    }

    if(result){
        result.innerText =
        "API connected successfully: " + text;
        result.className = "api-online";
    }

})
.catch(() => {

    if(statusText){
        statusText.innerText = "OFFLINE";
        statusText.className = "api-offline";
    }

    if(result){
        result.innerText =
        "API connection failed. Make sure Flask server is running.";
        result.className = "api-offline";
    }

});

}

function applyDashboardTheme(theme){

if(theme === "dark"){

    document.body.style.background = "#0b1220";

    document.querySelector(".sidebar").style.background =
    "#0f172a";

}

if(theme === "blue"){

    document.body.style.background = "#071a2f";

    document.querySelector(".sidebar").style.background =
    "#082f49";

}

if(theme === "green"){

    document.body.style.background = "#052e16";

    document.querySelector(".sidebar").style.background =
    "#064e3b";

}

}

function pushRealtimeHistory(d){

const now = new Date();

const label =
now.toLocaleTimeString();

const accMagnitude =
Math.sqrt(
    d.acceleration_x*d.acceleration_x +
    d.acceleration_y*d.acceleration_y +
    d.acceleration_z*d.acceleration_z
);

let trafficVolume = 120;

if(d.wind_speed_mps > 8){
    trafficVolume -= 30;
}

if(d.degradation_score > 70){
    trafficVolume -= 45;
}

trafficVolume =
Math.max(30, trafficVolume + Math.round(Math.random()*15));

let risk = "LOW";

if(d.degradation_score > 40){
    risk = "MEDIUM";
}

if(d.degradation_score > 70){
    risk = "HIGH";
}

let priority = "LOW";

if(d.forecast_score_next_30d > 60 || d.degradation_score > 40){
    priority = "MEDIUM";
}

if(d.forecast_score_next_30d > 80 || d.degradation_score > 70){
    priority = "HIGH";
}

realtimeHistory.push({
    label: label,
    sensor_id: d.sensor_id,
    damage_class: d.damage_class,
    temperature: d.temperature_c,
    humidity: d.humidity_percent,
    wind: d.wind_speed_mps,
    fft: d.fft_peak_freq,
    degradation: d.degradation_score,
    forecast: d.forecast_score_next_30d,
    acceleration: accMagnitude,
    traffic: trafficVolume,
    risk: risk,
    priority: priority
});

if(realtimeHistory.length > REALTIME_MAX_POINTS){
    realtimeHistory.shift();
}

}

function updateChartRealtime(chart, labels, datasets){

if(!chart){
    return;
}

chart.data.labels = labels;

datasets.forEach((data,index)=>{

    if(chart.data.datasets[index]){
        chart.data.datasets[index].data = data;
    }

});

chart.update("none");

}

function updateAllRealtimeCharts(){

if(realtimeHistory.length < 2){
    return;
}

const labels =
realtimeHistory.map(d => d.label);

const temperatureData =
realtimeHistory.map(d => d.temperature);

const fftData =
realtimeHistory.map(d => d.fft);

const degradationData =
realtimeHistory.map(d => d.degradation);

const forecastData =
realtimeHistory.map(d => d.forecast);

const accelerationData =
realtimeHistory.map(d => d.acceleration);

const trafficData =
realtimeHistory.map(d => d.traffic);

/* DASHBOARD CHARTS */

if(typeof tempChart !== "undefined" && tempChart && document.getElementById("c1")){
    updateChartRealtime(tempChart, labels, [temperatureData]);
}

if(typeof fftChart !== "undefined" && fftChart && document.getElementById("c2")){
    updateChartRealtime(fftChart, labels, [fftData]);
}

if(typeof degChart !== "undefined" && degChart && document.getElementById("c3")){
    updateChartRealtime(degChart, labels, [degradationData]);
}

if(typeof forecastChart !== "undefined" && forecastChart && document.getElementById("c4")){
    updateChartRealtime(forecastChart, labels, [forecastData]);
}

/* TRAFFIC CHART */

if(typeof trafficChart !== "undefined" && trafficChart && document.getElementById("trafficChart")){
    updateChartRealtime(trafficChart, labels, [trafficData]);
}

/* ANALYTICS CHARTS */

if(typeof analyticsFFTChart !== "undefined" && analyticsFFTChart && document.getElementById("analyticsFFTChart")){
    updateChartRealtime(analyticsFFTChart, labels, [fftData]);
}

if(typeof analyticsDegChart !== "undefined" && analyticsDegChart && document.getElementById("analyticsDegChart")){
    updateChartRealtime(analyticsDegChart, labels, [degradationData]);
}

if(typeof analyticsAccChart !== "undefined" && analyticsAccChart && document.getElementById("analyticsAccChart")){
    updateChartRealtime(analyticsAccChart, labels, [accelerationData]);
}

if(typeof analyticsForecastChart !== "undefined" && analyticsForecastChart && document.getElementById("analyticsForecastChart")){
    updateChartRealtime(
        analyticsForecastChart,
        labels,
        [forecastData, degradationData]
    );
}

/* FORECAST CHART */

if(typeof forecastMainChart !== "undefined" && forecastMainChart && document.getElementById("forecastMainChart")){
    updateChartRealtime(
        forecastMainChart,
        labels,
        [forecastData, degradationData]
    );
}

}

function updateAnalyticsRealtimeCards(){

if(!liveData){
    return;
}

const accMagnitude =
Math.sqrt(
    liveData.acceleration_x*liveData.acceleration_x +
    liveData.acceleration_y*liveData.acceleration_y +
    liveData.acceleration_z*liveData.acceleration_z
);

let risk = "LOW";
let riskClass = "risk-low";

if(liveData.degradation_score > 40){
    risk = "MEDIUM";
    riskClass = "risk-medium";
}

if(liveData.degradation_score > 70){
    risk = "HIGH";
    riskClass = "risk-high";
}

setText("avgFFT", liveData.fft_peak_freq.toFixed(2) + " Hz");
setText("avgDeg", liveData.degradation_score.toFixed(1));
setText("maxVibration", accMagnitude.toFixed(2));
setText("analyticsRisk", risk);

const riskElement =
document.getElementById("analyticsRisk");

if(riskElement){
    riskElement.className = riskClass;
}

}

function updateForecastRealtimeCards(){

if(!liveData){
    return;
}

const currentHealth =
100 - liveData.degradation_score;

const forecastScore =
liveData.forecast_score_next_30d;

let priority = "LOW";
let priorityClass = "priority-low";

let inspectionStatus =
"Bridge condition is stable. Routine monitoring is sufficient.";

let recommendedAction =
"Continue normal monitoring and periodic sensor validation.";

let maintenanceWindow =
"Next scheduled inspection cycle.";

if(forecastScore > 60 || liveData.degradation_score > 40){

    priority = "MEDIUM";
    priorityClass = "priority-medium";

    inspectionStatus =
    "Early signs of structural degradation detected.";

    recommendedAction =
    "Perform visual inspection and verify vibration sensor readings.";

    maintenanceWindow =
    "Inspection recommended within 30 days.";
}

if(forecastScore > 80 || liveData.degradation_score > 70){

    priority = "HIGH";
    priorityClass = "priority-high";

    inspectionStatus =
    "High structural risk detected from degradation and forecast score.";

    recommendedAction =
    "Immediate engineering inspection and maintenance planning required.";

    maintenanceWindow =
    "Maintenance action recommended as soon as possible.";
}

setText("forecastDamage", liveData.damage_class);
setText("forecastHealth", currentHealth.toFixed(1) + "%");
setText("forecast30", forecastScore.toFixed(1));
setText("forecastPriority", priority);

const priorityElement =
document.getElementById("forecastPriority");

if(priorityElement){
    priorityElement.className = priorityClass;
}

setText("inspectionStatus", inspectionStatus);
setText("recommendedAction", recommendedAction);
setText("maintenanceWindow", maintenanceWindow);

}

function updateAnalyticsRealtimeTable(){

const table =
document.getElementById("analyticsTable");

if(!table || realtimeHistory.length === 0){
    return;
}

let rows = "";

realtimeHistory
.slice(-15)
.reverse()
.forEach(d => {

    let riskClass = "risk-low";

    if(d.risk === "MEDIUM"){
        riskClass = "risk-medium";
    }

    if(d.risk === "HIGH"){
        riskClass = "risk-high";
    }

    rows += `
    <tr>
        <td>${d.sensor_id}</td>
        <td>${d.fft.toFixed(2)}</td>
        <td>${d.degradation.toFixed(1)}</td>
        <td>${d.damage_class}</td>
        <td class="${riskClass}">${d.risk}</td>
    </tr>
    `;

});

table.innerHTML = rows;

}

function updateForecastRealtimeTable(){

const table =
document.getElementById("forecastTable");

if(!table || realtimeHistory.length === 0){
    return;
}

let rows = "";

realtimeHistory
.slice(-15)
.reverse()
.forEach(d => {

    let priorityClass = "priority-low";

    if(d.priority === "MEDIUM"){
        priorityClass = "priority-medium";
    }

    if(d.priority === "HIGH"){
        priorityClass = "priority-high";
    }

    rows += `
    <tr>
        <td>${d.sensor_id}</td>
        <td>${d.degradation.toFixed(1)}</td>
        <td>${d.forecast.toFixed(1)}</td>
        <td>${d.damage_class}</td>
        <td class="${priorityClass}">${d.priority}</td>
    </tr>
    `;

});

table.innerHTML = rows;

}
// ================= INIT =================

showPage("dashboard");

if(liveInterval){
    clearInterval(liveInterval);
}

liveInterval = setInterval(fetchLive,currentRefreshRate);