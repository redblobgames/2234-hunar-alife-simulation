/*
 * From https://www.redblobgames.com/x/2234-hunar-alife-simulation/
 * Based on tutorial https://www.youtube.com/watch?v=0Kx4Y9TVMGg
 */
'use strict';

const WIDTH = 660,
      HEIGHT = 330;

const canvas = document.querySelector("#output");
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext('2d');

function draw(x, y, color, s) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, s, s);
}

let particles = [];
function particle(x, y, color) {
    return {x, y, vx: 0, vy: 0, color};
}

function randomPos(lo, hi) {
    return Math.random() * (hi-lo) + lo;
}

function create(count, color) {
    const margin = 50;
    let group = [];
    for (let i = 0; i < count; i++) {
        let p = particle(randomPos(margin, WIDTH-margin), randomPos(margin, HEIGHT-margin), color);
        group.push(p);
        particles.push(p);
    }
    return group;
}

function update() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < particles.length; i++) {
        draw(particles[i].x, particles[i].y, particles[i].color, 5);
    }
    requestAnimationFrame(update);
}

let yellow = create(200, "yellow");
update();
