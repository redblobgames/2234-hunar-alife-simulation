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
    red_count: [0, 200, 3000],
    green_count: [0, 200, 3000],
    yellow_count: [0, 200, 3000],
};
let sliders = {}; // pointers to the <input> elements
let parameters = {}; // set from sliders

function createSliders() {
    const sliderDiv = document.querySelector("#sliders");
    for (let [key, [lo, v, hi]] of Object.entries(sliderRanges)) {
        const label = document.createElement("label");
        const slider = document.createElement("input");
        slider.setAttribute('type', "range");
        slider.setAttribute('min', lo);
        slider.setAttribute('max', hi);
        slider.setAttribute('value', v);
        label.append(key, slider);
        sliderDiv.append(label);
        
        parameters[key] = v;
        sliders[key] = slider;
    }
}

function readSliders() {
    for (let [key, slider] of Object.entries(sliders)) {
        parameters[key] = slider.valueAsNumber;
    }
}

function randomPos(lo, hi) {
    return Math.random() * (hi-lo) + lo;
}

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
    number(yellow, 200);
    number(red, 200);
    number(green, 200);
    rule(green, green, 32)
    rule(green, red, 17)
    rule(green, yellow, -34)
    rule(red, red, 10)
    rule(red, green, 34)
    rule(yellow, yellow, -15)
    rule(yellow, green, 20)
}

function ruleset2() {
    number(yellow, 200);
    number(red, 200);
    number(green, 200);
    rule(red, red, -10);
    rule(yellow, red, -15);
    rule(green, green, 70);
    rule(green, red, 20);
    rule(red, green, 10);
    rule(yellow, yellow, -1);
}

function update() {
    readSliders();
    ruleset1();
    
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
update();
