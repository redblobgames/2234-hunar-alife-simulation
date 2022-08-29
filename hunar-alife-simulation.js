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

const sliderRanges = { // should be [low, initial, high]
    friction:      [10, 50, 100],
    yellow_count:  [0, 200, 1000],
    red_count:     [0, 200, 1000],
    green_count:   [0, 200, 1000],
    blue_count:    [0, 200, 1000],
    yellow_yellow: [-100, 0, 100],
    yellow_red:    [-100, 0, 100],
    yellow_green:  [-100, 0, 100],
    yellow_blue:   [-100, 0, 100],
    red_yellow:    [-100, 0, 100],
    red_red:       [-100, 0, 100],
    red_green:     [-100, 0, 100],
    red_blue:      [-100, 0, 100],
    green_yellow:  [-100, 0, 100],
    green_red:     [-100, 0, 100],
    green_green:   [-100, 0, 100],
    green_blue:    [-100, 0, 100],
    blue_yellow:   [-100, 0, 100],
    blue_red:      [-100, 0, 100],
    blue_green:    [-100, 0, 100],
    blue_blue:     [-100, 0, 100],
};
let sliders = {}; // pointers to the <input> and <output> elements
let parameters = {}; // set from sliders

function createSliders() {
    const sliderDiv = document.querySelector("#sliders");
    for (let [key, [lo, v, hi]] of Object.entries(sliderRanges)) {
        const label = document.createElement("label");
        const span = document.createElement("span");
        const input = document.createElement("input");
        const output = document.createElement("output");
        input.setAttribute('type', "range");
        input.setAttribute('min', lo);
        input.setAttribute('max', hi);
        input.setAttribute('value', v);
        span.append(key);
        label.append(span, input, output);
        sliderDiv.append(label);
        
        parameters[key] = v;
        sliders[key] = [input, output];
    }
}

function setSliders(values) {
    for (let [key, [input, _]] of Object.entries(sliders)) {
        input.value = values[key] ?? 0;
    }
}

function readSliders() {
    for (let [key, [input, output]] of Object.entries(sliders)) {
        parameters[key] = input.valueAsNumber;
        output.innerText = input.value;
    }
}

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

function rule(particles1, particles2, G) {
    const friction = parameters.friction / 100;
    let g = -G/200;
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
            if (0 < d && d < MAX_DISTANCE) { // TODO: could use a spatial hash to speed this up
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
    for (let [key, [input, _]] of Object.entries(sliders)) {
        let value = randomInt(sliderRanges[key][0], sliderRanges[key][2]);
        // special cases, pushing towards values I think are better:
        if (key.endsWith('count')) value = Math.floor(Math.sqrt(randomPos(10, 100000)));
        input.value = value;
    }
}

function simulate() {
    readSliders();
    number(yellow, parameters.yellow_count);
    number(red,    parameters.red_count);
    number(green,  parameters.green_count);
    number(blue,   parameters.blue_count);
    rule(yellow , yellow, parameters.yellow_yellow);
    rule(yellow , red,    parameters.yellow_red);
    rule(yellow , green,  parameters.yellow_green);
    rule(yellow , blue,   parameters.yellow_blue);
    rule(red    , yellow, parameters.red_yellow);
    rule(red    , red,    parameters.red_red);
    rule(red    , green,  parameters.red_green);
    rule(red    , blue,   parameters.red_blue);
    rule(green  , yellow, parameters.green_yellow);
    rule(green  , red,    parameters.green_red);
    rule(green  , green,  parameters.green_green);
    rule(green  , blue,   parameters.green_blue);
    rule(blue   , yellow, parameters.blue_yellow);
    rule(blue   , red,    parameters.blue_red);
    rule(blue   , green,  parameters.blue_green);
    rule(blue   , blue,   parameters.blue_blue);
}

function update() {
    simulate();
    draw();
    requestAnimationFrame(update);
}

function init() {
    initializeOutput(WIDTH, HEIGHT);
    createSliders();
    ruleset3();
    update();
}

let yellow = [];
let red = [];
let green = [];
let blue = [];

window.onload = init;

