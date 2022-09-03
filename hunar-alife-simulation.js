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
    counts: [200, 200, 200, 200],
    matrix: [0, 0, 0, 0,
             0, 0, 0, 0,
             0, 0, 0, 0,
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
    slider("#Red",     parameters.counts, 0,   0, 1000);
    slider("#Yellow",  parameters.counts, 1,   0, 1000);
    slider("#Green",   parameters.counts, 2,   0, 1000);
    slider("#Blue",    parameters.counts, 3,   0, 1000);
    
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

function setSliders(values) {
    // Transitioning to matrix value:
    for (let key of Object.keys(values)) {
        let [first, second] = key.split('_');
        let i = COLORS.indexOf(first),
            j = COLORS.indexOf(second);
        if (second === 'count') { parameters.counts[i] = values[key]; }
        else if (i >= 0 && j >= 0) { parameters.matrix[i * COLORS.length + j] = values[key]; }
        else { parameters[key] = values[key]; }
    }
    updateUi();
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
    let params = new URLSearchParams(window.location.hash.slice(1));
    for (const [key, value] of params) {
        switch(key) {
          case 'friction': parameters.friction = parseFloat(value); break;
          case 'exponent': parameters.exponent = parseFloat(value); break;
          case 'counts': parameters.counts.splice(4, value.split(',').map(parseFloat)); break;
          case 'matrix': parameters.matrix.splice(16, value.split(',').map(parseFloat)); break;
        }
    }
    updateUi();
}
window.addEventListener('hashchange', getStateFromUrl);


//////////////////////////////////////////////////////////////////////
// simulation

function randomPos(lo, hi) { return Math.random() * (hi-lo) + lo; }
function randomInt(lo, hi) { return Math.floor(randomPos(lo, hi)); }

function number(particles, count) {
    particles.splice(count);
    for (let i = particles.length; i < count; i++) {
        let p = {
            x: randomPos(MARGIN, WIDTH-MARGIN),
            y: randomPos(MARGIN, HEIGHT-MARGIN),
            vx: 0,
            vy: 0,
        };
        particles.push(p);
    }
}

function rule(particles1, particles2, force, exponent, friction) {
    let g = -force/200;
    const DISTANCE_SCALE = 15;
    const MAX_DISTANCE = 80;
    for (let i = 0; i < particles1.length; i++) {
        let fx = 0,
            fy = 0;
        let a = particles1[i];
        for (let j = 0; j < particles2.length; j++) {
            let b = particles2[j];
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let d = Math.sqrt(dx*dx + dy*dy);
            if (0 < d && d < MAX_DISTANCE) {
                d = DISTANCE_SCALE * Math.pow(d/DISTANCE_SCALE, exponent + 1);
                let F = g * 1/d;
                fx += F * dx;
                fy += F * dy;
            }
        }

        a.vx *= 1 - friction;
        a.vy *= 1 - friction;
        a.vx += fx;
        a.vy += fy
        a.x += a.vx;
        a.y += a.vy;

        if (a.x < 0) { a.x = -a.x; a.vx *= -1; }
        if (a.x >= WIDTH) { a.x = 2*WIDTH - a.x; a.vx *= -1; }
        if (a.y < 0) { a.y = -a.y; a.vy *= -1; }
        if (a.y >= HEIGHT) { a.y = 2*HEIGHT - a.y; a.vy *= -1; }
    }
}

function ruleset1() {
    setSliders({
        friction      : 50,
        exponent      : 0,
        yellow_count  : 200,
        red_count     : 200,
        green_count   : 200,
        blue_count    : 0,
        yellow_yellow : -15,
        yellow_green  : 20,
        red_red       : 10,
        red_green     : 34,
        green_yellow  : -34,
        green_red     : 17,
        green_green   : 32,
    });
}

function ruleset2() {
    setSliders({
        friction      : 50,
        exponent      : 0,
        yellow_count  : 200,
        red_count     : 200,
        green_count   : 200,
        blue_count    : 0,
        yellow_yellow : -1,
        yellow_red    : -15,
        red_red       : -10,
        red_green     : 10,
        green_red     : 20,
        green_green   : 70,
    });
}

function ruleset3() {
    setSliders({
        friction      : 50,
        exponent      : 0,
        yellow_count  : 450,
        red_count     : 200,
        green_count   : 300,
        blue_count    : 0,
        yellow_yellow : -2,
        yellow_red    : -10,
        yellow_green  : 10,
        red_red       : 15,
        red_yellow    : -20,
        red_green     : 30,
        green_yellow  : 25,
        green_red     : -15,
        green_green   : -40,
    });
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
    let sets = [red, yellow, green, blue];
    for (let i = 0; i < 4; i++) {
        number(sets[i], parameters.counts[i]);
        for (let j = 0; j < 4; j++) {
            // NOTE: make sure ui direction and matrix (row vs column major) match
            rule(sets[i], sets[j],
                 parameters.matrix[4*i + j],
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
    initializeOutput(WIDTH, HEIGHT);
    createSliders();
    ruleset3();
    getStateFromUrl();
    update();
}

let yellow = [];
let red = [];
let green = [];
let blue = [];

window.onload = init;
