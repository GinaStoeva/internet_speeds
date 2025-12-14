window.onload = () => {



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });


renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);


camera.position.z = 3;


const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 6;


const light = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(light);


const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg");


const globe = new THREE.Mesh(
new THREE.SphereGeometry(1, 64, 64),
new THREE.MeshStandardMaterial({ map: earthTexture })
);


scene.add(globe);


function animate() {
requestAnimationFrame(animate);
globe.rotation.y += 0.0008;
renderer.render(scene, camera);
}


animate();


window.addEventListener("resize", () => {
camera.aspect = container.clientWidth / container.clientHeight;
camera.updateProjectionMatrix();
renderer.setSize(container.clientWidth, container.clientHeight);
});
};
