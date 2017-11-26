"use strict";

var canvas;
var gl;
var rotX = 0;
var rotY = 0;
var rotZ = 0;
var pos3 = vec3(0,0,0);
var scale3 = vec3(1,1,1);
var thetaz = [0, 0, 0];
var axis = 0;
var flag = true;
var coordinateVertices = [
    -20, 0, 0, 1,
    20, 0, 0, 1,
    0, -20, 0, 1,
    0, 20, 0, 1,
    0, 0, -20, 1,
    0, 0, 20, 1
 ];
  var image;
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];
var texSize = 64;
var texture;
var near = 0.3;
var far = 11.0;
var radius = 0.5;
var theta  = 0.5;
var phi    = 0.5;
var dr = 5.0 * Math.PI/180.0;
var eyeX = 0;
var eyeY = 0;
var eyeZ = 5;
var tarX = 0;
var tarY = 0;
var tarZ = 0;

var  fovy = 45.0;   // Field-of-view in Y direction angle (in degrees)
var  aspect = 0.5;       // Viewport aspect ratio

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var normalMatrix, normalMatrixLoc;

var eye;
var at;
const up = vec3(0.0, 1.0, 0.0);

var program;

var axes_vBuffer, sphere_vBuffer, sphere_iBuffer, sphere_nBuffer;
var vPosition, vNormal;

var lightPosition = vec4(1.0, 1.0, 1.0, 1.0 );
var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0, 0, 0, 0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 19.0;

var lightPosXSlider = document.getElementById('lightPosXSlider');
var lightPosYSlider = document.getElementById('lightPosYSlider');
var lightPosZSlider = document.getElementById('lightPosZSlider');
var ambientColor, diffuseColor, specularColor;

var spherePoints = [];
var sphereNormals = [];
var sphereIndices = [];
var texCoordsArray = [];
var shadingType = 0; //0 Gouraud, 1 Phong, 2 Wireframe
var Stacknum=8;
var Slicenum=16;
function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA,gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

function generateSphere(){


        for (var latNumber=0; latNumber <=Stacknum; latNumber++) {
           theta = latNumber * Math.PI / Stacknum;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber=0; longNumber <= Slicenum; longNumber++) {
                var phi = longNumber * 2 * Math.PI /Slicenum;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
               var u = 1 - (longNumber / Slicenum);
                var v = 1 - (latNumber / Stacknum);


                sphereNormals.push(x);
                sphereNormals.push(y);
               sphereNormals.push(z);
              sphereNormals.push(1);
			   texCoordsArray.push(u);
               texCoordsArray.push(v);
			  
               spherePoints.push(x);
                spherePoints.push(y);
                spherePoints.push(z);
                spherePoints.push(0);
            }
        }

       
        for (var latNumber=0; latNumber < Stacknum; latNumber++) {
            for (var longNumber=0; longNumber < Slicenum; longNumber++) {
                var first = (latNumber * (Slicenum + 1)) + longNumber;
                var second = first + Slicenum + 1;
               sphereIndices.push(first);
                sphereIndices.push(second);
                sphereIndices.push(first + 1);

                sphereIndices.push(second);
                sphereIndices.push(second + 1);
                sphereIndices.push(first + 1);
            }
        }
	
	
	
	
   
    //for debug
    console.log(spherePoints);





 sphere_iBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphere_iBuffer);
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereIndices), gl.STATIC_DRAW );
	
 sphere_nBuffer= gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,sphere_nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals), gl.STATIC_DRAW);
        sphere_nBuffer.itemSize = 4;
       sphere_nBuffer.numItems =sphereNormals.length;

    sphere_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, sphere_vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(spherePoints), gl.STATIC_DRAW );
    sphere_vBuffer.itemSize = 4;
    sphere_vBuffer.numItems = spherePoints.length;
	
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, sphere_vBuffer.itemSize, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, sphere_nBuffer.itemSize, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);
	  var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
	

}

function setupShading(){
    if (shadingType == 0) {
        program = initShaders( gl, "gouraud-vertex-shader", "gouraud-fragment-shader" );

		
		
    }else{
        program = initShaders( gl, "phong-vertex-shader", "phong-fragment-shader" );
    }
    gl.useProgram( program );
   

var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
  gl.uniform4fv( gl.getUniformLocation(program,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
	     gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess);
  
  		
    
    generateSphere();

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
	

}


function setupScene(){
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    aspect =  canvas.width/canvas.height;

	
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    axes_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, axes_vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(coordinateVertices), gl.STATIC_DRAW);
    axes_vBuffer.itemSize = 4;
    axes_vBuffer.numItems = 6;
	

    setupShading();

  generateSphere();
  


 image = new Image();
    image.onload = function() {
       configureTexture( image );
    }
    //image.src = "SA2011_black.gif"//
	// image.src = "moon.gif"//
image.src = "earth-specular.gif"
//image.src = "earth.jpg"//
    configureTexture( image );
  
 
    

		

	
    // sliders for viewing parameters
    document.getElementById("fovySlider").oninput = function(event) {
        fovy = event.target.value;//* Math.PI/180.0;
    };

    document.getElementById("objRotationYSlider").oninput = function(event) {
        rotY = event.target.value;//* Math.PI/180.0;
    };

    document.getElementById("objRotationZSlider").oninput = function(event) {
        rotZ = event.target.value;//* Math.PI/180.0;
    };

    document.getElementById("inp_tarX").onchange = function(event) {
        tarX = event.target.value;
    };
    document.getElementById("inp_tarY").onchange = function(event) {
        tarY = event.target.value;
    };
    document.getElementById("inp_tarZ").onchange = function(event) {
        tarZ = event.target.value;
    };
    document.getElementById("inp_camX").onchange = function(event) {
        eyeX = event.target.value;
    };
    document.getElementById("inp_camY").onchange = function(event) {
        eyeY = event.target.value;
    };
    document.getElementById("inp_camZ").onchange = function(event) {
        eyeZ = event.target.value;
    };
    document.getElementById("inp_objX").onchange = function(event) {
        pos3[0] = event.target.value;
    };
    document.getElementById("inp_objY").onchange = function(event) {
        pos3[1] = event.target.value;
    };
    document.getElementById("inp_objZ").onchange = function(event) {
        pos3[2] = event.target.value;
    };
    document.getElementById("inp_obj_scaleX").onchange = function(event) {
        scale3[0] = event.target.value;
    };
    document.getElementById("inp_obj_scaleY").onchange = function(event) {
        scale3[1] = event.target.value;
    };
    document.getElementById("inp_obj_scaleZ").onchange = function(event) {
        scale3[2] = event.target.value;
    };
   
    document.getElementById("lightPosXSlider").oninput = function(event) {
lightPosition[0]=event.target.value;
setupShading();
    };
    document.getElementById("lightPosYSlider").oninput = function(event) {
lightPosition[1]=event.target.value;

 setupShading();
    };
    document.getElementById("lightPosZSlider").oninput = function(event) {
lightPosition[2]=event.target.value;

setupShading();
    };
    document.getElementById("shadingMenu").onchange = function(event) {
       shadingType = event.target.value;
       if (shadingType != 2) {
            setupShading();
            generateSphere();
       }
    };
    document.getElementById("inp_slices").onchange = function(event) {
		Slicenum = Math.round(event.target.value);

            generateSphere();
    };

    document.getElementById("inp_stacks").onchange = function(event) {
     Stacknum=event.target.value;


            generateSphere();
    };
	
    document.getElementById("redSlider").oninput = function(event) {

		materialAmbient[0]=event.target.value;
		
		setupShading();
      
    };
    document.getElementById("greenSlider").oninput = function(event) {
        materialAmbient[1]=event.target.value;
			setupShading();
    };
    document.getElementById("blueSlider").oninput = function(event) {
        materialAmbient[2]=event.target.value;
			setupShading();
    };
    document.getElementById("shininessSlider").oninput = function(event) {
      materialShininess=event.target.value;
	  setupShading();
    };
    document.getElementById("diffuseSlider").oninput = function(event) {
lightDiffuse[0]=event.target.value;
lightDiffuse[1]=event.target.value;
lightDiffuse[2]=event.target.value;	
   setupShading();
    };
    document.getElementById("specularSlider").oninput = function(event) {
       lightSpecular[0]=event.target.value;
	    lightSpecular[1]=event.target.value;
		 lightSpecular[2]=event.target.value;
  setupShading();
    };
    document.getElementById("ambientSlider").oninput = function(event) {
   lightAmbient[0]=event.target.value;
      lightAmbient[1]=event.target.value;
	     lightAmbient[2]=event.target.value;
		  setupShading();0
		  
    };

    render();
}

window.onload = function init() {
    setupScene();
}

function drawAxes(){

    gl.bindBuffer(gl.ARRAY_BUFFER, axes_vBuffer);
    gl.vertexAttribPointer(vPosition, axes_vBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, 6);

}

function drawSphere(){
   
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere_vBuffer);
    gl.vertexAttribPointer(vPosition, sphere_vBuffer.itemSize, gl.FLOAT, false, 0, 0);

	     gl.bindBuffer(gl.ARRAY_BUFFER, sphere_nBuffer);
    gl.vertexAttribPointer(vNormal, sphere_nBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_iBuffer);
    
    if(shadingType == 2)
        gl.drawElements( gl.LINE_LOOP, sphereIndices.length, gl.UNSIGNED_SHORT, 0 );
    else
        gl.drawElements( gl.TRIANGLES, sphereIndices.length, gl.UNSIGNED_SHORT, 0 );
    
}


function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

var render = function(){

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //initial setup for modelview and projection matrices
    eye = vec3(eyeX, eyeY, eyeZ);
    at = vec3(tarX, tarY, tarZ);
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    
    //draw the coordinate axes
    drawAxes();
if (flag)thetaz[axis]+=0.5;

    //update modelview matrix before drawing the sphere 
    modelViewMatrix = mult(modelViewMatrix, translate(pos3[0],pos3[1],pos3[2]));
	    modelViewMatrix = mult(modelViewMatrix, rotate(rotY, 0, 1, 0 ));
    modelViewMatrix = mult(modelViewMatrix, rotate(rotZ, 0, 0, 1 ));
	 modelViewMatrix = mult(modelViewMatrix, rotate(thetaz[rotX], [0, 1, 0]));


    modelViewMatrix = mult(modelViewMatrix, scalem(scale3[0]*0.5,scale3[1]*0.5,scale3[2]*0.5));


 normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];


      gl.uniformMatrix3fv(normalMatrixLoc, false,flatten(normalMatrix) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
  gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    // draw the sphere
       drawSphere();
	
	modelViewMatrix = mult(modelViewMatrix, translate((1.5),(0),(1)));
	
	    modelViewMatrix = mult(modelViewMatrix, rotate(thetaz[rotX]*10.0, [0, 1, 0]));
	modelViewMatrix = mult(modelViewMatrix, scalem(0.3,0.3,0.3));
	
	  gl.uniformMatrix3fv(normalMatrixLoc, false,flatten(normalMatrix) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
  gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
	
   drawSphere();
  modelViewMatrix = mult(modelViewMatrix, translate((1.5),(0),(1)));
modelViewMatrix = mult(modelViewMatrix, scalem(0.3,0.3,0.3));
modelViewMatrix = mult(modelViewMatrix, rotate(thetaz[rotX]*20.0, [0, 1, 0]));
	  
	  gl.uniformMatrix3fv(normalMatrixLoc, false,flatten(normalMatrix) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
  gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
	
   drawSphere();
   
    window.requestAnimFrame(render);
}
