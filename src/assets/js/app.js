/*global Float32Array */

import $ from "jquery";
import "what-input";

// Foundation JS relies on a global varaible. In ES6, all imports are hoisted
// to the top of the file so if we used`import` to import Foundation,
// it would execute earlier than we have assigned the global variable.
// This is why we have to use CommonJS require() here since it doesn't
// have the hoisting behavior.
window.jQuery = $;
require("foundation-sites");

// If you want to pick and choose which modules to include, comment out the above and uncomment
// the line below
//import './lib/foundation-explicit-pieces';

$(document).foundation();
$(document).ready(initPage);

function initPage() {

var canvas = document.getElementById("bg"),
    gl = canvas.getContext('webgl'),
    NUM_METABALLS = 30,
    WIDTH = canvas.width = window.innerWidth,
    HEIGHT = canvas.height = window.innerHeight - $('#body').height();
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  $(window).resize(function() {
    WIDTH = canvas.width = window.innerWidth,
    HEIGHT = canvas.height = window.innerHeight - $('#body').height();
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  });
    
/**
 * Shaders
 */

// Utility to fail loudly on shader compilation failure
function compileShader(shaderSource, shaderType) {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
    }

    return shader;
}

var vertexShader = compileShader('\n\
attribute vec2 position;\n\
\n\
void main() {\n\
    // position specifies only x and y.\n\
    // We set z to be 0.0, and w to be 1.0\n\
    gl_Position = vec4(position, 0.0, 1.0);\n\
}\
', gl.VERTEX_SHADER);

var fragmentShader = compileShader('\n\
precision highp float;\n\
uniform vec3 metaballs[' + NUM_METABALLS + '];\n\
const float WIDTH = ' + WIDTH + '.0;\n\
const float HEIGHT = ' + HEIGHT + '.0;\n\
const float R0A = ' + (252/255) + ';\n\
const float G0A = ' + (154/255) + ';\n\
const float B0A = ' + (112/255) + ';\n\
\n\
const float R0B = ' + (198/255) + ';\n\
const float G0B = ' + (67/255) + ';\n\
const float B0B = ' + (174/255) + ';\n\
\n\
const float R0C = ' + (49/255) + ';\n\
const float G0C = ' + (52/255) + ';\n\
const float B0C = ' + (145/255) + ';\n\
\n\
const float R1A = ' + (52/255) + ';\n\
const float G1A = ' + (76/255) + ';\n\
const float B1A = ' + (225/255) + ';\n\
\n\
const float R1B = ' + (40/255) + ';\n\
const float G1B = ' + (169/255) + ';\n\
const float B1B = ' + (225/255) + ';\n\
\n\
const float R1C = ' + (62/255) + ';\n\
const float G1C = ' + (200/255) + ';\n\
const float B1C = ' + (80/255) + ';\n\
\n\
const float R2A = ' + (254/255) + ';\n\
const float G2A = ' + (162/255) + ';\n\
const float B2A = ' + (156/255) + ';\n\
\n\
const float R2B = ' + (175/255) + ';\n\
const float G2B = ' + (40/255) + ';\n\
const float B2B = ' + (110/255) + ';\n\
\n\
const float R2C = ' + (254/255) + ';\n\
const float G2C = ' + (162/255) + ';\n\
const float B2C = ' + (156/255) + ';\n\
\n\
const float R3A = ' + (254/255) + ';\n\
const float G3A = ' + (245/255) + ';\n\
const float B3A = ' + (214/255) + ';\n\
\n\
const float R3B = ' + (254/255) + ';\n\
const float G3B = ' + (208/255) + ';\n\
const float B3B = ' + (98/255) + ';\n\
\n\
const float R3C = ' + (239/255) + ';\n\
const float G3C = ' + (62/255) + ';\n\
const float B3C = ' + (54/255) + ';\n\
\n\
void main(){\n\
    float x = gl_FragCoord.x;\n\
    float y = gl_FragCoord.y;\n\
    float v0 = 0.0;\n\
    float v1 = 0.0;\n\
    float v2 = 0.0;\n\
    float v3 = 0.0;\n\
    for (int i = 0; i < 4; i++) {\n\
        vec3 mb = metaballs[i];\n\
        float dx = mb.x - x;\n\
        float dy = mb.y - y;\n\
        float r = mb.z;\n\
        v0 += r*r/(dx*dx + dy*dy);\n\
    }\n\
    for (int i = 4; i < 10; i++) {\n\
        vec3 mb = metaballs[i];\n\
        float dx = mb.x - x;\n\
        float dy = mb.y - y;\n\
        float r = mb.z;\n\
        v1 += r*r/(dx*dx + dy*dy);\n\
    }\n\
    for (int i = 10; i < 17; i++) {\n\
        vec3 mb = metaballs[i];\n\
        float dx = mb.x - x;\n\
        float dy = mb.y - y;\n\
        float r = mb.z;\n\
        v2 += r*r/(dx*dx + dy*dy);\n\
    }\n\
    for (int i = 17; i <= ' + NUM_METABALLS + '; i++) {\n\
        vec3 mb = metaballs[i];\n\
        float dx = mb.x - x;\n\
        float dy = mb.y - y;\n\
        float r = mb.z;\n\
        v3 += r*r/(dx*dx + dy*dy);\n\
    }\n\
    if (v0 > 0.75) {\n\
      if ( (y/HEIGHT + x/WIDTH) > 1.0) {\n\
        gl_FragColor = vec4( (R0A + ((HEIGHT - y)/HEIGHT + (WIDTH - x)/WIDTH) * (R0B - R0A)), (G0A + ((HEIGHT - y)/HEIGHT + (WIDTH - x)/WIDTH) * (G0B - G0A)), (B0A + ((HEIGHT - y)/HEIGHT + (WIDTH - x)/WIDTH) * (B0B - B0A)), 1.0);\n\
      } else {\n\
        gl_FragColor = vec4( (R0C + (y/HEIGHT + x/WIDTH) * (R0B - R0C)), (G0C + (y/HEIGHT + x/WIDTH) * (G0B - G0C)), (B0C + (y/HEIGHT + x/WIDTH) * (B0B - B0C)), 1.0);\n\
      }\n\
    } else if (v1 > 0.75) {\n\
      if ( (((HEIGHT - y) / HEIGHT) + x/WIDTH) > 1.0) {\n\
        gl_FragColor = vec4( (R1B + ((HEIGHT - y)/HEIGHT - (WIDTH - x)/WIDTH) * (R1A - R1B)), (G1B + ((HEIGHT - y)/HEIGHT - (WIDTH - x)/WIDTH) * (G1A - G1B)), (B1B + ((HEIGHT - y)/HEIGHT - (WIDTH - x)/WIDTH) * (B1A - B1B)), 1.0);\n\
      } else {\n\
        gl_FragColor = vec4( (R1B + (y/HEIGHT - x/WIDTH) * (R1C - R1B)), (G1B + (y/HEIGHT - x/WIDTH) * (G1C - G1B)), (B1B + (y/HEIGHT - x/WIDTH) * (B1C - B1B)), 1.0);\n\
      }\n\
    } else if (v2 > 0.75) {\n\
      if ( (y/HEIGHT + x/WIDTH) > 1.0) {\n\
        gl_FragColor = vec4( (R2A + ((HEIGHT - y)/HEIGHT + (WIDTH - x)/WIDTH) * (R2B - R2A)), (G2A + ((HEIGHT - y)/HEIGHT + (WIDTH - x)/WIDTH) * (G2B - G2A)), (B2A + ((HEIGHT - y)/HEIGHT + (WIDTH - x)/WIDTH) * (B2B - B2A)), 1.0);\n\
      } else {\n\
        gl_FragColor = vec4( (R2C + (y/HEIGHT + x/WIDTH) * (R2B - R2C)), (G2C + (y/HEIGHT + x/WIDTH) * (G2B - G2C)), (B2C + (y/HEIGHT + x/WIDTH) * (B2B - B2C)), 1.0);\n\
      }\n\
    } else if (v3 > 0.75) {\n\
      if ( (x/WIDTH) < 0.5) {\n\
        gl_FragColor = vec4( (R3A + (x/WIDTH) * 2.0 * (R3B - R3A)), (G3A + (x/WIDTH) * 2.0 * (G3B - G3A)), (B3A + (x/WIDTH) * 2.0 * (B3B - B3A)), 1.0);\n\
      } else {\n\
        gl_FragColor = vec4( (R3C + ((WIDTH - x)/WIDTH) * 2.0 * (R3B - R3C)), (G3C + ((WIDTH - x)/WIDTH) * 2.0 * (G3B - G3C)), (B3C + ((WIDTH - x)/WIDTH) * 2.0 * (B3B - B3C)), 1.0);\n\
      }\n\
    } else {\n\
        gl_FragColor = vec4(1.0, 1.0, 1.0, 0);\n\
    }\n\
}\n\
', gl.FRAGMENT_SHADER);

var program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

/**
 * Geometry setup
 */

// Set up 4 vertices, which we'll draw as a rectangle
// via 2 triangles
//
//   A---C
//   |  /|
//   | / |
//   |/  |
//   B---D
//
// We order them like so, so that when we draw with
// gl.TRIANGLE_STRIP, we draw triangle ABC and BCD.
var vertexData = new Float32Array([
    -1.0,  1.0, // top left
    -1.0, -1.0, // bottom left
     1.0,  1.0, // top right
     1.0, -1.0, // bottom right
]);
var vertexDataBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

/**
 * Attribute setup
 */

// Utility to complain loudly if we fail to find the attribute

function getAttribLocation(program, name) {
    var attributeLocation = gl.getAttribLocation(program, name);
    if (attributeLocation === -1) {
        throw 'Can not find attribute ' + name + '.';
    }
    return attributeLocation;
}

// To make the geometry information available in the shader as attributes, we
// need to tell WebGL what the layout of our data in the vertex buffer is.
var positionHandle = getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionHandle);
gl.vertexAttribPointer(positionHandle,
                       2, // position is a vec2
                       gl.FLOAT, // each component is a float
                       gl.FALSE, // don't normalize values
                       2 * 4, // two 4 byte float components per vertex
                       0 // offset into each span of vertex data
                       );

/**
 * Simulation setup
 */

var metaballs = [];

function random(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

for (var i = 0; i < NUM_METABALLS; i++) {
  var sm = Math.sqrt(HEIGHT * WIDTH) / 14,
  radius = random(sm * 0.8, sm * 2);
  metaballs.push({
    x: random(0, WIDTH),
    y: random(0, HEIGHT),
    vx: (random(-5, 5) / 25),
    vy: (random(-5, 5) / 20),
    r: radius
  });
}

/**
 * Uniform setup
 */

// Utility to complain loudly if we fail to find the uniform
function getUniformLocation(program, name) {
    var uniformLocation = gl.getUniformLocation(program, name);
    if (uniformLocation === -1) {
        throw 'Can not find uniform ' + name + '.';
    }
    return uniformLocation;
}
var metaballsHandle = getUniformLocation(program, 'metaballs');

/**
 * Simulation step, data transfer, and drawing
 */

var step = function() {
  // Update positions and speeds
  for (var i = 0; i < NUM_METABALLS; i++) {
    var mb = metaballs[i];
    
    mb.x += mb.vx;
    if (mb.x < 0) {
//      mb.x = mb.r + 1;
      mb.vx = Math.abs(mb.vx);
    } else if (mb.x > WIDTH) {
//      mb.x = WIDTH - mb.r;
      mb.vx = -Math.abs(mb.vx);
    }
    mb.y += mb.vy;
    if (mb.y < 0) {
//      mb.y = mb.r + 1;
      mb.vy = Math.abs(mb.vy);
    } else if (mb.y > HEIGHT) {
//      mb.y = HEIGHT - mb.r;
      mb.vy = -Math.abs(mb.vy);
    }
  }
  
  // To send the data to the GPU, we first need to
  // flatten our data into a single array.
  var dataToSendToGPU = new Float32Array(3 * NUM_METABALLS);
  for (var j = 0; j < NUM_METABALLS; j++) {
    var baseIndex = 3 * j;
    var b = metaballs[j];
    dataToSendToGPU[baseIndex + 0] = b.x;
    dataToSendToGPU[baseIndex + 1] = b.y;
    dataToSendToGPU[baseIndex + 2] = b.r;
  }
  gl.uniform3fv(metaballsHandle, dataToSendToGPU);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  requestAnimationFrame(step);
};

step();
  
}