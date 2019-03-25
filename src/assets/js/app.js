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
    NUM_METABALLS = 10,
    WIDTH = canvas.width = window.innerWidth,
    HEIGHT = canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  $(window).resize(function() {
    WIDTH = canvas.width = window.innerWidth,
    HEIGHT = canvas.height = window.innerHeight;
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
uniform vec3 metaballsOne[' + NUM_METABALLS + '];\n\
const float WIDTH = ' + WIDTH + '.0;\n\
const float HEIGHT = ' + HEIGHT + '.0;\n\
\n\
void main(){\n\
    float x = gl_FragCoord.x;\n\
    float y = gl_FragCoord.y;\n\
    float v = 0.0;\n\
    for (int i = 0; i < ' + NUM_METABALLS + '; i++) {\n\
        vec3 mb = metaballsOne[i];\n\
        float dx = mb.x - x;\n\
        float dy = mb.y - y;\n\
        float r = mb.z;\n\
        v += r*r/(dx*dx + dy*dy);\n\
    }\n\
    if (v > 1.0) {\n\
        gl_FragColor = vec4(1.0, x/WIDTH,\n\
                                y/HEIGHT, 1.0);\n\
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

var metaballsOne = [],
    metaballsTwo = [];

function random(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

for (var i = 0; i < NUM_METABALLS; i++) {
  var radiusOne = random(20, Math.sqrt(HEIGHT * WIDTH) / 7);
  metaballsOne.push({
    x: random(0, WIDTH),
    y: random(0, HEIGHT),
    vx: random(-1, 1),
    vy: random(-1, 1),
    r: radiusOne
  });
}
for (var j = 0; j < NUM_METABALLS; j++) {
  var radiusTwo = Math.random() * 100 + 10;
  metaballsTwo.push({
    x: random(0, WIDTH),
    y: random(0, HEIGHT),
    vx: random(-1, 1),
    vy: random(-1, 1),
    r: radiusTwo
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
var metaballsHandle = getUniformLocation(program, 'metaballsOne');

/**
 * Simulation step, data transfer, and drawing
 */

var step = function() {
  // Update positions and speeds
  for (var i = 0; i < NUM_METABALLS; i++) {
    var mb = metaballsOne[i];
    
    mb.x += mb.vx;
    if (mb.x - mb.r < 0) {
      mb.x = mb.r + 1;
      mb.vx = Math.abs(mb.vx);
    } else if (mb.x + mb.r > WIDTH) {
      mb.x = WIDTH - mb.r;
      mb.vx = -Math.abs(mb.vx);
    }
    mb.y += mb.vy;
    if (mb.y - mb.r < 0) {
      mb.y = mb.r + 1;
      mb.vy = Math.abs(mb.vy);
    } else if (mb.y + mb.r > HEIGHT) {
      mb.y = HEIGHT - mb.r;
      mb.vy = -Math.abs(mb.vy);
    }
  }
  
  // To send the data to the GPU, we first need to
  // flatten our data into a single array.
  var dataToSendToGPU = new Float32Array(3 * NUM_METABALLS);
  for (var i = 0; i < NUM_METABALLS; i++) {
    var baseIndex = 3 * i;
    var mb = metaballsOne[i];
    dataToSendToGPU[baseIndex + 0] = mb.x;
    dataToSendToGPU[baseIndex + 1] = mb.y;
    dataToSendToGPU[baseIndex + 2] = mb.r;
  }
  gl.uniform3fv(metaballsHandle, dataToSendToGPU);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  requestAnimationFrame(step);
};

step();
  
}

//
//function initPageOld() {
//  
//  var canvas = document.getElementById('bg'),
//      h = canvas.height = window.innerHeight,
//      w = canvas.width = window.innerWidth,
//      bgColor = "red",
//      circlesNum = 5,
//      circles = [],
//      pxs = 8, // Pixel size
//      sumThreshold = 1.2;
//  
//  if (canvas.getContext) {
//    var ctx = canvas.getContext('2d');
//  } else {
//    console.log("Canvas not supported.");
//  }
//  function random(min, max) {
//    return Math.floor(Math.random() * (max - min) ) + min;
//  }
//  
//  // Initialize a Circle's values
//  
//  function Circle() {
//    this.x = random(0, w);
//    this.y = random(0, h);
//    this.r = random(Math.sqrt(w * h) / 10, Math.sqrt(w * h) / 5);
//    this.vx = random(-2, 2);
//    this.vy = random(-2, 2);
//    this.color = 'rgb(' + random(200, 255) + ',' + random(100, 150) + ',' + random(100,150) + ')';
////    this.color = 'rgb(' + random(200, 255) + ',' + random(100, 150) + ',' + random(100,150) + ')';
//  }
//  
//  // Draw a Circle
//  
//  Circle.prototype.draw = function() {
//    ctx.beginPath();
//    ctx.fillStyle = this.color;
//    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, true);
//    ctx.fill();
//  }
//  
//  // Change the circle's velocity if it collides with the edge of the canvas
//  
//  Circle.prototype.update = function() {
//    //bounce off right wall
//    if ((this.x + this.r) >= w) { 
//      this.vx = -Math.abs(this.vx);
//    }
//    //bounce off left wall
//    if ((this.x - this.r) <= 0) {
//      this.vx = Math.abs(this.vx);
//    }
//    //bounce off floor
//    if ((this.y + this.r) >= h) {
//      this.vy = -Math.abs(this.vy);
//    }
//    //bounce off ceiling
//    if ((this.y - this.r) <= 0) {
//      this.vy = Math.abs(this.vy);
//    }
//    
//    this.x += this.vx;
//    this.y += this.vy;
//  }
//  
//  
//  // Animate frames
//  
//  function animate() {
//    
//    // paint the background
//    
//    ctx.fillStyle = bgColor;
//    ctx.fillRect(0, 0, w, h);
//    
//    // paint the circles' position
//    while (circles.length < circlesNum) {
//      var circle = new Circle();
//      circles.push(circle);
//    }
//    for (var i = 0; i < circles.length; i++) {
//      circles[i].draw();
//      circles[i].update();
//    }
//    
//    // paint the pixels in between
//    for (var x = 0; x < w; x += pxs) {
//      for (var y = 0; y < h; y += pxs) {
//        var sum = 0;
//        var closestD2 = 99999;
//        var closestColor = "red";
//        for (var k = 0; k < circles.length; k++) {
//          var c = circles[k];
//          var dx = x - c.x;
//          var dy = y - c.y;
//          var d2 = dx * dx + dy * dy;
//          sum += c.r * c.r / d2;
//
//          if (d2 < closestD2) {
//            closestD2 = d2;
//            closestColor = c.color;
//          }
//        }
//        if (sum > sumThreshold) {
////          console.log(closestColor);
//          
////          ctx.fillStyle(closestColor);
//          ctx.fillRect(x,y,pxs,pxs);
//        }
//      }
//    }
//    requestAnimationFrame(animate);
//  }
//  
//  animate();
//  
//  $(window).resize(function() {
//      h = canvas.height = window.innerHeight,
//      w = canvas.width = window.innerWidth;
//  });
//  
//}
//  
  
  
//  
//  
//  for (var i = 0; i < circlesNum; i++) {
//    circles.push({
//      x: random(0, canvas.width),
//      y: random(0, canvas.height),
//      r: random(50, 200),
//      vx: random(-2, 2),
//      vy: random(-2, 2),
//      red: random(50, 255),
//      blue: random(50, 255),
//      green: random(50, 255)
//    });
//  }
//  
//  
//  function drawBG() {
//    ctx.fillStyle = bgColor;
//    ctx.fillRect(0, 0, canvas.width, canvas.height);
//  }
//
//  function drawCircle() {
//    ctx.fillStyle = blobColor;
//    ctx.beginPath();
//    ctx.arc(300, 300, 200, 0, Math.PI * 2, true);
//    ctx.fill();
//  }
//
//
//  drawBG();
//  drawCircle();
  
  
//  function drawBG() {
//    canvas._ctx.fillStyle = bgColor;
//    canvas._ctx.fillRect(0, 0, canvas._canvas.width, canvas._canvas.height);
//  }
//  
//  drawBG();
  
  
// var bouncingCircles = base.clone({
//    canvas: document.getElementById("bouncing-circles"),
//    cellSize: 100,
//    draw: function() {
//        this.drawBg();
//        this.drawCircles();
//    }
//});
//animateOnScroll(bouncingCircles);

//  Circle.prototype.collisionDetect = function() {
//    var j;
//    for (j = 0; j < circles.length; j++) {
//      if ( (!(this.x === circles[j].x && this.y === circles[j].y && this.vx === circles[j].vx && this.vy === circles[j].vy)) ) {
//        var dx = this.x - circles[j].x;
//        var dy = this.y - circles[j].y;
//        var distance = Math.sqrt(dx * dx + dy * dy);
//        
//        if (distance < this.r + circles[j].size) {
//          circles[j].c = this.c = 'rgb(' + random(50, 255) + ',' + random(50, 255) + ',' + random(50,255) + ')'; 
//        }
//      }
//    }
//  }