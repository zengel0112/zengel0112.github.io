const delayedCursor = document.querySelector(".cursor-delayed");
const pointerCursor = document.querySelector(".cursor-pointer");

let cursorX = 0, cursorY = 0;
let targetX = 0, targetY = 0;
let isTouching = false;

// Chamleon color changing based on background brightness
function updateCursorColor() {
    const body = document.body;
    const bodyColor = window.getComputedStyle(body).backgroundColor;

    const rgb = bodyColor.match(/(\d+)/g); 
    const [r, g, b] = rgb.map(val => parseInt(val)); 

    const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (brightness < 128) {
        pointerCursor.style.background = "white";
    } else {
        pointerCursor.style.background = "black";
    }
}

// Cursor animation with smoother delayed effect
function animateCursor() {
    cursorX += (targetX - cursorX) * 0.1; // Adjust smoothness
    cursorY += (targetY - cursorY) * 0.1;

    // Update the position of the delayed cursor
    delayedCursor.style.top = `${cursorY}px`;
    delayedCursor.style.left = `${cursorX}px`;

    // Update the position of the main cursor
    pointerCursor.style.top = `${cursorY}px`;
    pointerCursor.style.left = `${cursorX}px`;

    requestAnimationFrame(animateCursor);
}

// Mouse movement event (for desktop)
document.addEventListener("mousemove", (e) => {
    if (!isTouching) {  // Only move if not on mobile
        const x = e.clientX;
        const y = e.clientY;

        targetX = x;
        targetY = y;

        pointerCursor.style.display = "block"; 
        delayedCursor.style.display = "block"; 

        clearTimeout(timeout); 
    }
});

// Mobile touch events
document.addEventListener("touchmove", (e) => {
    const touch = e.touches[0]; // Get the first touch point
    const x = touch.clientX;
    const y = touch.clientY;

    targetX = x;
    targetY = y;

    pointerCursor.style.display = "block"; 
    delayedCursor.style.display = "block"; 

    isTouching = true; // Indicate the user is touching the screen

    clearTimeout(timeout); 
});

// When the touch ends, stop touch handling
document.addEventListener("touchend", () => {
    isTouching = false; // Reset the flag when touch ends
});

// Start the animation loop for the cursors
animateCursor();

// Update the cursor color on page load and resize
window.addEventListener("load", updateCursorColor);
window.addEventListener("resize", updateCursorColor);

// Collision detection logic (if necessary)
function checkCollision() {
    const pointerRect = pointerCursor.getBoundingClientRect();
    const delayedRect = delayedCursor.getBoundingClientRect();

    const isColliding = 
        pointerRect.left < delayedRect.right &&
        pointerRect.right > delayedRect.left &&
        pointerRect.top < delayedRect.bottom &&
        pointerRect.bottom > delayedRect.top;

    if (isColliding) {
        let currentColor = window.getComputedStyle(pointerCursor).backgroundColor;
        let [r, g, b] = currentColor.match(/\d+/g).map(Number);

        if (r > 0 || g > 0 || b > 0) {
            pointerCursor.style.backgroundColor = `rgb(${Math.max(r - 5, 0)}, ${Math.max(g - 5, 0)}, ${Math.max(b - 5, 0)})`;
        }
    } else {
        pointerCursor.style.backgroundColor = "white";
    }

    requestAnimationFrame(checkCollision);
}

// Start the collision detection loop
checkCollision();

