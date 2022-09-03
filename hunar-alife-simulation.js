/*
 * From https://www.redblobgames.com/x/2234-hunar-alife-simulation/
 * Copyright 2022 Red Blob Games <redblobgames@gmail.com>
 * @license Apache-2.0 <https://www.apache.org/licenses/LICENSE-2.0.html>
 * Some code based on https://www.youtube.com/watch?v=0Kx4Y9TVMGg
 */
'use strict';

const WIDTH = 500,
      HEIGHT = 500;
const MARGIN = 50; // start particles out this far from the walls

const COLORS = ['red', 'yellow', 'green', 'blue'];
let parameters = {
    friction: 50,
    exponent: 100,
    counts: [200, 450, 300, 0],
    matrix: [15, -20, 30, 0,
             -10, -2, 10, 0,
             -15, 25, -40, 0,
             0, 0, 0, 0],
};

//////////////////////////////////////////////////////////////////////
// ui to control parameters

let _uiUpdaters = []; // functions to call when we set parameters outside of the ui
function updateUi() {
    for (let f of _uiUpdaters) { f(); }
    setUrlFromState();
}

function createSliders() {
    const sliderDiv = document.querySelector("#sliders");
    function slider(name, obj, key, lo, hi, digits=0) {
        const label = document.createElement("label");
        const span = document.createElement("span");
        const input = document.createElement("input");
        const output = document.createElement("output");
        input.setAttribute('type', "range");
        input.setAttribute('min', lo);
        input.setAttribute('max', hi);
        span.append(name);
        label.append(span, input, output);
        sliderDiv.append(label);

        function updateThisSlider() {
            input.value = obj[key];
            output.innerText = (obj[key] / Math.pow(10, digits)).toFixed(digits);
        }
           
        function handleUiEvent() {
            obj[key] = input.valueAsNumber;
            updateUi();
        }
        input.addEventListener('input', handleUiEvent);
        _uiUpdaters.push(updateThisSlider);
    }

    slider("Friction", parameters, 'friction', 0,  100, 2);
    slider("Exponent", parameters, 'exponent', -50, 200, 2);
    slider("#Red",     parameters.counts, 0,   0, MAX_COUNT);
    slider("#Yellow",  parameters.counts, 1,   0, MAX_COUNT);
    slider("#Green",   parameters.counts, 2,   0, MAX_COUNT);
    slider("#Blue",    parameters.counts, 3,   0, MAX_COUNT);
    
    function div(innerHTML) {
        let el = document.createElement('div');
        el.innerHTML = innerHTML;
        return el;
    }
    
    const colorNames = ["Red", "Yel", "Grn", "Blu"];
    const els = [];
    els.push(div(""));
    for (let col = 0; col < colorNames.length; col++) {
        els.push(div("→" + colorNames[col]));
    }
    for (let row = 0; row < COLORS.length; row++) {
        els.push(div(colorNames[row] + "→"));
        for (let col = 0; col < COLORS.length; col++) {
            let matrixIndex = row * COLORS.length + col;
            let el = document.createElement('input');
            el.setAttribute('type', "number");
            el.setAttribute('size', "3");
            el.setAttribute('min', "-100");
            el.setAttribute('max', "100");
            el.style.width = "100%";
            el.style.height = "100%";
            el.style.color = "white";
            el.style.cursor = "ew-resize";
            el.style.userSelect = "none";

            // Dragging up/right on this box should change the value
            let dragging = null;
            el.addEventListener('pointerdown', (event) => {
                if (dragging) return;
                event.preventDefault();
                event.stopPropagation();
                dragging = {x: event.x, y: event.y, initialValue: parameters.matrix[matrixIndex]};
                event.target.setPointerCapture(event.pointerId);
            });
            el.addEventListener('pointerup', (_event) => {
                dragging = null;
            });
            el.addEventListener('pointermove', (event) => {
                if (dragging) {
                    event.preventDefault();
                    event.stopPropagation();
                    let dx = event.x - dragging.x,
                        dy = event.y - dragging.y;
                    let newValue = dragging.initialValue + dx - dy;
                    if (newValue < -100) newValue = -100;
                    if (newValue > 100) newValue = 100;
                    parameters.matrix[matrixIndex] = Math.round(newValue);
                    updateUi();
                }
            });
            function updateThisSlider() {
                let value = parameters.matrix[matrixIndex];
                el.value = value;
                let hue = value < 0? 300 : 30;
                let sat = Math.floor(5 * Math.sqrt(Math.abs(value))); // non-linear to make low values more sensitive
                let val = 25 + Math.floor(Math.abs(value) / 2);
                el.style.backgroundColor = `hsl(${hue}, ${sat}%, ${val}%)`;
            }
            _uiUpdaters.push(updateThisSlider);
            els.push(el);
        }
    }
    document.querySelector("#matrix").append(...els);
}

//////////////////////////////////////////////////////////////////////
// url to control parameters

let _setUrlFromStateTimeout = null;
function _setUrlFromState() {
    _setUrlFromStateTimeout = null;
    let fragment = [
        `friction=${parameters.friction}`,
        `exponent=${parameters.exponent}`,
        `counts=${parameters.counts}`,
        `matrix=${parameters.matrix}`,
    ].join("&");

    let url = window.location.pathname + "#" + fragment;
    window.history.replaceState({}, null, url);
}
function setUrlFromState() {
    // Rate limit the url update because some browsers (like Safari
    // iOS) throw an error if you change the url too quickly.
    if (_setUrlFromStateTimeout === null) {
        _setUrlFromStateTimeout = setTimeout(_setUrlFromState, 500);
    }
}


function getStateFromUrl() {
    function updateArray(array, values) {
        for (let i = 0; i < array.length && i < values.length; i++) {
            array[i] = values[i] ?? 0;
        }
    }
    
    let params = new URLSearchParams(window.location.hash.slice(1));
    for (const [key, value] of params) {
        switch(key) {
          case 'friction': parameters.friction = parseFloat(value); break;
          case 'exponent': parameters.exponent = parseFloat(value); break;
          case 'counts': updateArray(parameters.counts, value.split(',').map(parseFloat)); break;
          case 'matrix': updateArray(parameters.matrix, value.split(',').map(parseFloat)); break;
        }
    }
    updateUi();
}
window.addEventListener('hashchange', getStateFromUrl);


//////////////////////////////////////////////////////////////////////
// simulation

// Float32Array storage for particles, can be used with webgl
//    array[4*i   ] is x
//    array[4*i+1] is y
//    array[4*i+2] is vx
//    array[4*i+3] is vy
const MAX_COUNT = 1000;
let particles = COLORS.map(() => new Float32Array(MAX_COUNT * 4));

function randomPos(lo, hi) { return Math.random() * (hi-lo) + lo; }
function randomInt(lo, hi) { return Math.floor(randomPos(lo, hi)); }

function rule(receivers, receiverCount, senders, senderCount, force, exponent, friction) {
    let g = -force/200;
    const DISTANCE_SCALE = 15;
    const DISTANCE_LIMIT = 80;
    const distanceSquaredLimit = DISTANCE_LIMIT**2;
    for (let i = 0; i < receiverCount; i++) {
        let receiverX  = receivers[4*i  ],
            receiverY  = receivers[4*i+1],
            receiverVx = receivers[4*i+2],
            receiverVy = receivers[4*i+3];
        let fx = 0,
            fy = 0;
        for (let j = 0; j < senderCount; j++) {
            let senderX = senders[4*j  ],
                senderY = senders[4*j+1];
            let dx = receiverX - senderX;
            let dy = receiverY - senderY;
            let distanceSquared = dx*dx + dy*dy;
            if (0 < distanceSquared && distanceSquared < distanceSquaredLimit) {
                let distance = Math.sqrt(distanceSquared);
                distance = DISTANCE_SCALE * Math.pow(distance/DISTANCE_SCALE, exponent + 1);
                let F = g * 1/distance;
                fx += F * dx;
                fy += F * dy;
            }
        }

        receiverVx *= 1 - friction;
        receiverVy *= 1 - friction;
        receiverVx += fx;
        receiverVy += fy
        receiverX += receiverVx;
        receiverY += receiverVy;

        if (receiverX < 0) { receiverX = -receiverX; receiverVx *= -1; }
        if (receiverX >= WIDTH) { receiverX = 2*WIDTH - receiverX; receiverVx *= -1; }
        if (receiverY < 0) { receiverY = -receiverY; receiverVy *= -1; }
        if (receiverY >= HEIGHT) { receiverY = 2*HEIGHT - receiverY; receiverVy *= -1; }

        receivers[4*i  ] = receiverX;
        receivers[4*i+1] = receiverY;
        receivers[4*i+2] = receiverVx;
        receivers[4*i+3] = receiverVy;
    }
}

function randomParameters() {
    parameters.friction = randomInt(10, 90);
    parameters.exponent = Math.round(120 * (randomPos(0, 1) ** 2)) - 10;
    parameters.counts[0] = Math.floor(Math.sqrt(randomPos(10, 20000)));
    parameters.counts[1] = Math.floor(Math.sqrt(randomPos(100, 600000)));
    parameters.counts[2] = Math.floor(Math.sqrt(randomPos(10, 50000)));
    parameters.counts[3] = Math.floor(Math.sqrt(randomPos(50, 200000)));
    for (let i = 0; i < parameters.matrix.length; i++) { parameters.matrix[i] = randomInt(-100, 100); }
    updateUi();
}

function simulate() {
    for (let i = 0; i < COLORS.length; i++) {
        for (let j = 0; j < COLORS.length; j++) {
            // NOTE: make sure ui direction and matrix (row vs column major) match
            rule(particles[i], parameters.counts[i],
                 particles[j], parameters.counts[j],
                 parameters.matrix[COLORS.length*i + j],
                 parameters.exponent/100,
                 parameters.friction / 100);
        }
    }
}


//////////////////////////////////////////////////////////////////////
// main loop

function update() {
    simulate();
    draw();
    requestAnimationFrame(update);
}

function init() {
    for (let color = 0; color < COLORS.length; color++) {
        for (let i = 0; i < MAX_COUNT; i++) {
            let index = 4 * i;
            particles[color][index  ] = randomPos(MARGIN, WIDTH-MARGIN);
            particles[color][index+1] = randomPos(MARGIN, HEIGHT-MARGIN);
            particles[color][index+2] = 0;
            particles[color][index+3] = 0;
        }
    }
    
    initializeOutput(WIDTH, HEIGHT);
    createSliders();
    getStateFromUrl();
    update();
}

window.onload = init;
