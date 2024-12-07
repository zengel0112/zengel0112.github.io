







// Save checkbox state to localStorage
window.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('switch');
    const isChecked = localStorage.getItem('bgChecked') === 'true';
    checkbox.checked = isChecked;

    checkbox.addEventListener('change', () => {
      localStorage.setItem('bgChecked', checkbox.checked);
    });
});










const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl");

canvas.width = window.innerWidth;
canvas.height = 900;
gl.viewport(0, 0, canvas.width, canvas.height);

// Configurable parameters
const config = {
    particleCount: 5000,
    textArray: ["Hello Im Tsengel", "你好", "안녕하세요", "Hallo", "Hola", "مرحباً"],
    mouseRadius: 0.1,
    particleSize: 2,
    forceMultiplier: 0.001,
    returnSpeed: 0.005,
    velocityDamping: 0.95,
    colorMultiplier: 40000,
    saturationMultiplier: 1000,
    textChangeInterval: 10000,
    rotationForceMultiplier: 0.5
};

let currentTextIndex = 0;
let nextTextTimeout;
let textCoordinates = [];

const mouse = {
    x: -500,
    y: -500,
    radius: config.mouseRadius
};

const particles = [];
for (let i = 0; i < config.particleCount; i++) {
    particles.push({ x: 0, y: 0, baseX: 0, baseY: 0, vx: 0, vy: 0 });
}

const vertexShaderSource = `
    attribute vec2 a_position;
    attribute float a_hue;
    attribute float a_saturation;
    varying float v_hue;
    varying float v_saturation;
    void main() {
        gl_PointSize = ${config.particleSize.toFixed(1)};
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_hue = a_hue;
        v_saturation = a_saturation;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying float v_hue;
    varying float v_saturation;
    void main() {
        float c = v_hue * 6.0;
        float x = 1.0 - abs(mod(c, 2.0) - 1.0);
        vec3 color;
        if (c < 1.0) color = vec3(1.0, x, 0.0);
        else if (c < 2.0) color = vec3(x, 1.0, 0.0);
        else if (c < 3.0) color = vec3(0.0, 1.0, x);
        else if (c < 4.0) color = vec3(0.0, x, 1.0);
        else if (c < 5.0) color = vec3(x, 0.0, 1.0);
        else color = vec3(1.0, 0.0, x);
        vec3 finalColor = mix(vec3(1.0), color, v_saturation);
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const hueAttributeLocation = gl.getAttribLocation(program, "a_hue");
const saturationAttributeLocation = gl.getAttribLocation(
    program,
    "a_saturation"
);

const positionBuffer = gl.createBuffer();
const hueBuffer = gl.createBuffer();
const saturationBuffer = gl.createBuffer();

const positions = new Float32Array(config.particleCount * 2);
const hues = new Float32Array(config.particleCount);
const saturations = new Float32Array(config.particleCount);

function getTextCoordinates(text) {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = canvas.width;
    ctx.canvas.height = canvas.height;
    const fontSize = Math.min(canvas.width / 8, canvas.height / 8);
    ctx.font = `600 ${fontSize}px Arial`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const coordinates = [];
    for (let y = 0; y < canvas.height; y += 4) {
        for (let x = 0; x < canvas.width; x += 4) {
            const index = (y * canvas.width + x) * 4;
            if (imageData[index + 3] > 128) {
                coordinates.push({
                    x: (x / canvas.width) * 2 - 1,
                    y: (y / canvas.height) * -2 + 1
                });
            }
        }
    }
    return coordinates;
}

function createParticles() {
    textCoordinates = getTextCoordinates(config.textArray[currentTextIndex]);
    for (let i = 0; i < config.particleCount; i++) {
        const randomIndex = Math.floor(Math.random() * textCoordinates.length);
        const { x, y } = textCoordinates[randomIndex];
        particles[i].x = particles[i].baseX = x;
        particles[i].y = particles[i].baseY = y;
    }
}
function updateParticles() {
    for (let i = 0; i < config.particleCount; i++) {
        const particle = particles[i];
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const maxDistance = mouse.radius;
        const force = (maxDistance - distance) / maxDistance;
        const directionX = forceDirectionX * force * config.forceMultiplier;
        const directionY = forceDirectionY * force * config.forceMultiplier;

        const angle = Math.atan2(dy, dx);

        const rotationForceX = Math.sin(
            -Math.cos(angle * -1) *
                Math.sin(config.rotationForceMultiplier * Math.cos(force)) *
                Math.sin(distance * distance) *
                Math.sin(angle * distance)
        );

        const rotationForceY = Math.sin(
            Math.cos(angle * 1) *
                Math.sin(config.rotationForceMultiplier * Math.sin(force)) *
                Math.sin(distance * distance) *
                Math.cos(angle * distance)
        );

        if (distance < mouse.radius) {
            particle.vx -= directionX + rotationForceX;
            particle.vy -= directionY + rotationForceY;
        } else {
            particle.vx += (particle.baseX - particle.x) * config.returnSpeed;
            particle.vy += (particle.baseY - particle.y) * config.returnSpeed;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= config.velocityDamping;
        particle.vy *= config.velocityDamping;

        const speed = Math.sqrt(
            particle.vx * particle.vx + particle.vy * particle.vy
        );
        const hue = (speed * config.colorMultiplier) % 360;

        hues[i] = hue / 360;
        saturations[i] = Math.min(speed * config.saturationMultiplier, 1);
        positions[i * 2] = particle.x;
        positions[i * 2 + 1] = particle.y;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, hueBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, hues, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, saturationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, saturations, gl.DYNAMIC_DRAW);
}

function animate() {
    updateParticles();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, hueBuffer);
    gl.vertexAttribPointer(hueAttributeLocation, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(hueAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, saturationBuffer);
    gl.vertexAttribPointer(saturationAttributeLocation, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(saturationAttributeLocation);
    gl.useProgram(program);
    gl.drawArrays(gl.POINTS, 0, config.particleCount);
    requestAnimationFrame(animate);
}

canvas.addEventListener("mousemove", (event) => {
    const offsetX = window.scrollX;
    const offsetY = window.scrollY;

    // Adjust mouse position based on the canvas and scroll offsets
    mouse.x = ((event.clientX + offsetX) / canvas.width) * 2 - 1;
    mouse.y = ((event.clientY + offsetY) / canvas.height) * -2 + 1;
});


canvas.addEventListener("mouseleave", () => {
    mouse.x = -500;
    mouse.y = -500;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    createParticles();
});

function changeText() {
    currentTextIndex = (currentTextIndex + 1) % config.textArray.length;
    const newCoordinates = getTextCoordinates(config.textArray[currentTextIndex]);
    for (let i = 0; i < config.particleCount; i++) {
        const randomIndex = Math.floor(Math.random() * newCoordinates.length);
        const { x, y } = newCoordinates[randomIndex];
        particles[i].baseX = x;
        particles[i].baseY = y;
    }
    nextTextTimeout = setTimeout(changeText, config.textChangeInterval);
}

gl.clearColor(0, 0, 0, 0); // Transparent background
createParticles();
animate();
nextTextTimeout = setTimeout(changeText, config.textChangeInterval);












// remove particles on mobile
window.addEventListener('resize', function () {
    const div = document.querySelector('div');
    if (window.innerWidth <= 768) {
        div.style.display = 'none'; // Hide on mobile
    } else {
        div.style.display = 'block'; // Show on desktop
    }
});

// Call the function initially to set the correct state on page load
window.dispatchEvent(new Event('resize'));








//disable right click 
document.addEventListener("contextmenu", function(event) {
    event.preventDefault();
});
//disable keyboard shortcuts
document.addEventListener("keydown", function(event) {
    if (event.key === "F12" || (event.ctrlKey && event.shiftKey && event.key === "I")) {
        event.preventDefault();
    }
});






//scroll up 
// Wait for the document to be ready
document.addEventListener("DOMContentLoaded", function() {
    const scrollUpButton = document.querySelector('.scrollup');

    // Check if the button exists
    if (scrollUpButton) {
        // Add click event listener
        scrollUpButton.addEventListener('click', function() {
            // Scroll to top with smooth behavior
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});



