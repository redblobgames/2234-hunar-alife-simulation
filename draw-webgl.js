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
    attribute vec2 a_position;
    uniform vec2 u_size;
    uniform float u_radius;
    void main() {
        gl_Position = vec4(2.0 * (a_position / u_size) - 1.0, 0, 1);
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

    render.a_position = gl.getAttribLocation(render.program, 'a_position');
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

let buffer = new Float32Array(2000);
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(render.program);
    gl.enableVertexAttribArray(render.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, render.positionBuffer);
    
    function drawOneColor(particles, radius, rgb) {
        for (let i = 0; i < particles.length; i++) {
            buffer[2 * i    ] = particles[i].x;
            buffer[2 * i + 1] = particles[i].y;
        }

        gl.uniform4f(render.u_rgba, rgb[0]/255, rgb[1]/255, rgb[2]/255, 1.0);
        gl.uniform1f(render.u_radius, radius);
        gl.bufferData(gl.ARRAY_BUFFER, buffer.subarray(0, 2*particles.length), gl.STREAM_DRAW);
        gl.vertexAttribPointer(render.a_position,
                               2 /* vec2 */, gl.FLOAT,
                               false /* normalize? */,
                               0 /* stride */,
                               0 /* offset */);
        gl.drawArrays(gl.POINTS, 0 /* offset */, particles.length /* count */);
    }
    drawOneColor(red,    7.0, [255, 50, 20]);
    drawOneColor(yellow, 3.5, [200, 200, 10]);
    drawOneColor(green,  5.5, [20, 200, 50]);
    drawOneColor(blue,   5.0, [30, 150, 255]);
}
