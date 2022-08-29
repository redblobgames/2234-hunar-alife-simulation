/*
 * From https://www.redblobgames.com/x/2234-hunar-alife-simulation/
 * Based on tutorial https://www.youtube.com/watch?v=0Kx4Y9TVMGg
 */
'use strict';

const WIDTH = 500,
      HEIGHT = 500;
const MARGIN = 50; // start particles out this far from the walls

const canvas = document.querySelector("#output");
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext('2d');

const sliderRanges = { // should be [low, initial, high]
    red_count:     [0, 200, 1000],
    green_count:   [0, 200, 1000],
    yellow_count:  [0, 200, 1000],
    green_green:   [-100, 0, 100],
    green_red:     [-100, 0, 100],
    green_yellow:  [-100, 0, 100],
    red_red:       [-100, 0, 100],
    red_green:     [-100, 0, 100],
    red_yellow:    [-100, 0, 100],
    yellow_yellow: [-100, 0, 100],
    yellow_green:  [-100, 0, 100],
    yellow_red:    [-100, 0, 100],
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
    let g = -G/100;
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
        
        a.vx = (a.vx + fx) * 0.5;
        a.vy = (a.vy + fy) * 0.5;
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
        yellow_count  : 200,
        red_count     : 200,
        green_count   : 200,
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
        yellow_count  : 200,
        red_count     : 200,
        green_count   : 200,
        yellow_yellow : -1,
        yellow_red    : -15,
        red_red       : -10,
        red_green     : 10,
        green_red     : 20,
        green_green   : 70,
    });
}

function randomParameters() {
    setSliders({
        yellow_count:  randomInt(100, 400),
        red_count:     randomInt(100, 400),
        green_count:   randomInt(100, 400),
        yellow_yellow: randomInt(-50, 50),
        yellow_red:    randomInt(-50, 50),
        yellow_green:  randomInt(-50, 50),
        red_yellow:    randomInt(-50, 50),
        red_red:       randomInt(-50, 50),
        red_green:     randomInt(-50, 50),
        green_yellow:  randomInt(-50, 50),
        green_red:     randomInt(-50, 50),
        green_green:   randomInt(-50, 50),
    });
}

function update() {
    readSliders();
    number(yellow, parameters.yellow_count);
    number(red, parameters.red_count);
    number(green, parameters.green_count);
    rule(yellow , yellow, parameters.yellow_yellow);
    rule(yellow , red,    parameters.yellow_red);
    rule(yellow , green,  parameters.yellow_green);
    rule(red    , yellow, parameters.red_yellow);
    rule(red    , red,    parameters.red_red);
    rule(red    , green,  parameters.red_green);
    rule(green  , yellow, parameters.green_yellow);
    rule(green  , red,    parameters.green_red);
    rule(green  , green,  parameters.green_green);
    
    const R = 2;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    function draw(particles, color) {
        ctx.fillStyle = color;
        for (let i = 0; i < particles.length; i++) {
            ctx.fillRect(particles[i].x-R, particles[i].y-R, R*2, R*2);
        }
    }
    draw(yellow, "yellow");
    draw(red, "red");
    draw(green, "green");
    requestAnimationFrame(update);
}

let yellow = [];
let red = [];
let green = [];
createSliders();
ruleset1();
update();
