// === Global Variables & State ===
let state         = 'loading';
let sceneTimer    = 0;
let globalTime    = 0;
let faceLandmarks = null;
let handLandmarks = null;
let lastVideoFrame= null;

let indexFingerLastPos = null;
let holdingProgress    = 0;
const HOLD_THRESHOLD   = 0.06;
const HOLD_DURATION    = 2500;

let growingTips  = [];
let flowers      = [];
let particles    = [];
let sparks       = [];
let shockwaves   = [];
let ambientSpores= [];
let vinesAlpha   = 1.0;
let touchStartPos= { x: 0, y: 0 };

// === Configuration Constants ===
const LIGHT = { x: -0.5, y: -0.8, z: 0.3 };
const VINE_GROWTH_SPEED = 5.0;
const VINE_SPLIT_CHANCE = 0.032;  // Xác suất cành rẽ nhánh
const MAX_GENERATIONS   = 4;      // Số đời nhánh tối đa

// Animation durations (tính bằng frame, ~60 frame = 1 giây)
const BLOOM_DURATION    = 160;    // Thời gian hoa nở
const HOVER_DURATION    = 120;    // Thời gian bướm lơ lửng trên hoa
const WITHER_DURATION   = 80;     // Thời gian hoa héo úa và rễ tan biến
const SCATTER_DURATION  = 120;    // Thời gian bướm bay quanh người
const MAX_PARTICLES     = 120;    // Số lượng hạt/bướm/cánh hoa tối đa

// === DOM Elements & Contexts ===
let videoElement, canvasElement, canvasCtx, bloomCanvas, bloomCtx, vignette, uiLayer, statusText, permissionText, instructionBox, vineCanvas, vineCtx;

window.addEventListener('DOMContentLoaded', () => {
    videoElement  = document.getElementById('video');
    canvasElement = document.getElementById('output-canvas');
    canvasCtx     = canvasElement.getContext('2d', { alpha: false });
    bloomCanvas   = document.getElementById('bloom-canvas');
    bloomCtx      = bloomCanvas.getContext('2d');
    vignette      = document.getElementById('vignette');
    uiLayer       = document.getElementById('ui-layer');
    statusText    = document.getElementById('status-text');
    permissionText= document.getElementById('permission-text');
    instructionBox= document.getElementById('instruction-box');

    vineCanvas = document.createElement('canvas');
    vineCtx    = vineCanvas.getContext('2d');

    function resizeCanvas() {
        canvasElement.width = vineCanvas.width = bloomCanvas.width = window.innerWidth;
        canvasElement.height= vineCanvas.height= bloomCanvas.height= window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Khởi tạo ambient spores
    for (let i = 0; i < 60; i++) {
        ambientSpores.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -Math.random() * 0.6 - 0.1,
            size: Math.random() * 2.5 + 0.5,
            alpha: Math.random() * 0.8 + 0.2,
            hue: 120 + Math.random() * 60,
            twinkle: Math.random() * Math.PI * 2
        });
    }
});

function getCanvasCoords(nx, ny) {
    if (!videoElement || !videoElement.videoWidth) return { x: 0, y: 0 };
    const ratio   = Math.max(canvasElement.width / videoElement.videoWidth, canvasElement.height / videoElement.videoHeight);
    const drawW   = videoElement.videoWidth  * ratio;
    const drawH   = videoElement.videoHeight * ratio;
    const offsetX = (canvasElement.width  - drawW) / 2;
    const offsetY = (canvasElement.height - drawH) / 2;
    return { x: (1 - nx) * drawW + offsetX, y: ny * drawH + offsetY };
}
