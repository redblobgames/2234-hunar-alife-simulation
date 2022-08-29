/*
 * From https://www.redblobgames.com/x/2234-hunar-alife-simulation/
 * Copyright 2022 Red Blob Games <redblobgames@gmail.com>
 * @license Apache-2.0 <https://www.apache.org/licenses/LICENSE-2.0.html>
 */
'use strict';

const canvas = document.querySelector("#output");
const ctx = canvas.getContext('2d');

function initializeOutput(width, height) {
    canvas.width = width;
    canvas.height = height;
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function drawOneColor(R, particles, color) {
        ctx.fillStyle = color;
        for (let i = 0; i < particles.length; i++) {
            ctx.fillRect(particles[i].x-R, particles[i].y-R, R*2, R*2);
        }
    }
    drawOneColor(2, yellow, "hsl(60, 100%, 75%)");
    drawOneColor(2, red, "hsl(0, 100%, 50%)");
    drawOneColor(2, green, "hsl(110, 100%, 40%)");
    drawOneColor(2, blue, "hsl(230, 100%, 70%)");
}

