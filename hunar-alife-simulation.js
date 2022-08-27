/*
 * From https://www.redblobgames.com/x/2234-hunar-alife-simulation/
 * Based on tutorial https://www.youtube.com/watch?v=0Kx4Y9TVMGg
 */
'use strict';

const WIDTH = 500,
      HEIGHT = 500;

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

function rule(particles1, particles2, g) {
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
                let F = g * 1/d;
                fx += F * dx;
                fy += F * dy;
            }
        }
        
        a.vx = (a.vx + fx) * 0.5;
        a.vy = (a.vy + fy) * 0.5;
        a.x += a.vx;
        a.y += a.vy;

        // NOTE: this isn't sufficient, I think. Hunar limited the
        // force distance to 80 (which is quite short, as the forces
        // *do* have an effect past that distance) so this seems like
        // it works, but you can check how many particles are within
        // range, and see that it's not keeping them in the box.
        if (a.x <= 0 || a.x >= WIDTH-1) a.vx *= -1;
        if (a.y <= 0 || a.y >= HEIGHT-1) a.vy *= -1;
    }
}

function update() {
    rule(green, green, -0.32);
    rule(green, red, -0.17);
    rule(green, yellow, 0.34);
    rule(red, red, -0.10);
    rule(red, green, -0.34);
    rule(yellow, yellow, 0.15);
    rule(yellow, green, -0.20);
    /*
    rule(red, red, 0.1);
    rule(yellow, red, 0.15);
    rule(green, green, -0.7);
    rule(green, red, -0.2);
    rule(red, green, -0.1);
    rule(yellow, yellow, 0.01);
    */
    /*
    rule(green, green, -0.32)
    rule(green, red, -0.17)
    rule(green, yellow, 0.34)
    rule(red, red, -0.10)
    rule(red, green, -0.34)
    rule(yellow, yellow, 0.15)
    rule(yellow, green, -0.20)
    */
    
    const inRange = (p) => 0 <= p.x && p.x < WIDTH && 0 <= p.y && p.y < HEIGHT;
    document.querySelector("#in-range-yellow").innerText = yellow.filter(inRange).length;
    document.querySelector("#in-range-red").innerText = red.filter(inRange).length;
    document.querySelector("#in-range-green").innerText = green.filter(inRange).length;
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < particles.length; i++) {
        draw(particles[i].x, particles[i].y, particles[i].color, 5);
    }
    requestAnimationFrame(update);
}

let yellow = create(1000, "yellow")
let red = create(200, "red")
let green = create(200, "green")
update();
