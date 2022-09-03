/*
 * From https://www.redblobgames.com/x/2234-hunar-alife-simulation/
 * Copyright 2022 Red Blob Games <redblobgames@gmail.com>
 * @license Apache-2.0 <https://www.apache.org/licenses/LICENSE-2.0.html>
 */
'use strict';

const canvas = document.querySelector("#output");
const gl = canvas.getContext('webgl');

const render = {}; // save data I need for webgl

const vert = `
    precision mediump float;
    attribute vec4 a_pos_and_vel;
    uniform vec2 u_size;
    uniform float u_radius;
    void main() {
        gl_Position = vec4(2.0 * (a_pos_and_vel.xy / u_size) - 1.0, 0, 1);
        gl_PointSize = u_radius;
    }
`;

const frag = `
    precision mediump float;
    uniform vec4 u_rgba;
    void main() {
        // Make the squares into circles:
        float dist = distance(vec2(0.5,0.5), gl_PointCoord);
        float alpha = u_rgba.a * min(mix(0.5, 1.0, smoothstep(0.2, 0.4, dist)),
                                     mix(1.0, 0.0, smoothstep(0.4, 0.6, dist)));

        // Fill the circle center:
        gl_FragColor = vec4(alpha * u_rgba.rgb, alpha);
    }
`;

function initializeOutput(width, height) {
    canvas.width = width;
    canvas.height = height;

    let vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vert);
    gl.compileShader(vertShader);
    console.log('compile', gl.getShaderParameter(vertShader, gl.COMPILE_STATUS));

    let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, frag);
    gl.compileShader(fragShader);
    console.log('compile', gl.getShaderParameter(fragShader, gl.COMPILE_STATUS));

    render.program = gl.createProgram();
    gl.attachShader(render.program, vertShader);
    gl.attachShader(render.program, fragShader);
    gl.linkProgram(render.program);
    console.log('link   ', gl.getProgramParameter(render.program, gl.LINK_STATUS));
    console.log('link   ', gl.getProgramInfoLog(render.program));

    render.a_pos_and_vel = gl.getAttribLocation(render.program, 'a_pos_and_vel');
    render.positionBuffer = gl.createBuffer();
    render.u_size = gl.getUniformLocation(render.program, 'u_size');
    render.u_rgba = gl.getUniformLocation(render.program, 'u_rgba');
    render.u_radius = gl.getUniformLocation(render.program, 'u_radius');

    gl.viewport(0, 0, canvas.width, canvas.height);
    // Assume I have only one shader program, and set the parameters here
    gl.useProgram(render.program);
    gl.uniform2f(render.u_size, width, height);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    // TODO: gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA) is what I
    // normally would use but for SRC_ALPHA, ONE looks nicer, and ONE,
    // ONE looks even nicer. Figure out how to fix the fragment shader
    // to make ONE_MINUS_SRC_ALPHA look right.
}

function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(render.program);
    gl.enableVertexAttribArray(render.a_pos_and_vel);
    gl.bindBuffer(gl.ARRAY_BUFFER, render.positionBuffer);
    
    function drawOneColor(particles, count, radius, rgb) {
        gl.bufferData(gl.ARRAY_BUFFER, particles.subarray(0, 4*count), gl.STREAM_DRAW);
        gl.vertexAttribPointer(render.a_pos_and_vel,
                               4 /* vec4 */, gl.FLOAT,
                               false /* normalize? */,
                               0 /* stride */,
                               0 /* offset */);

        gl.uniform4f(render.u_rgba, rgb[0]/255, rgb[1]/255, rgb[2]/255, 1.0);
        gl.uniform1f(render.u_radius, radius);
        gl.drawArrays(gl.POINTS, 0 /* offset */, count);
    }
    drawOneColor(particles[0], parameters.counts[0], 7.0, [255, 50, 20]);
    drawOneColor(particles[1], parameters.counts[1], 3.5, [200, 200, 10]);
    drawOneColor(particles[2], parameters.counts[2], 5.5, [20, 200, 50]);
    drawOneColor(particles[3], parameters.counts[3], 5.0, [30, 150, 255]);
}
