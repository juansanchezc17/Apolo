/*******************************************************************
*  SENA CENTRO DE INDUSTRIA Y DE LA CONSTRUCCION                   *
*  Codigo JavaScript para pruebas de elaboracion de un cohete      *
*  Autor: Marco Leon Mora                                          *
*  Version: 1.0                                                    *
*  Fecha: Sept/2017                                                *
*                                                                  *
*******************************************************************/
window.addEventListener('load', iniciar, false);
window.document.addEventListener("keydown", detectarTecla, false);

/********** PROPIEDADES GLOBALES **********************************/
var escena, camara, renderer, ALTURA, ANCHO;
var particleSystem =  null;
var particulas = null;
var particulas1 = null;
var particulas2 = null;
var cohete = null;
var puntoVista = new THREE.Vector3( 0, 0, 0 );
var valorTecla = 0;
var deltaRueda = 0;

//var	mensaje;		//provisional para visualizar valores

/******************************************************************
 Funcion inicial, despues de haber cargado los recursos (archivos)
 ******************************************************************/
function iniciar() {
	crearEscena();
	crearCamara();
	crearLuces();
	crearMundo();
	crearCohete();

//	mensaje = document.getElementById('mensaje');	
	ciclo();
}


/******************************************************************
 Ciclo principal de la animacion, repite para calcular y dibujar 
 ******************************************************************/
function ciclo(){
	leerTecla();
	leerMouse();
	calcularEstado();
	particulas.updateParticles();
	particulas1.updateParticles();
	particulas2.updateParticles();
	renderer.render(escena, camara);
	requestAnimationFrame(ciclo);
}

/******************************************************************
 construye todos los objetos en el mundo 
 ******************************************************************/
function crearEscena(){
	ALTURA = window.innerHeight;
	ANCHO = window.innerWidth;

	// Create the scene
	escena = new THREE.Scene();
	// Create the renderer
	renderer = new THREE.WebGLRenderer({ 
		alpha: true,  // Allow transparency to show the gradient background we defined in the CSS
		antialias: true 
	});

	renderer.setSize(ANCHO, ALTURA);
	renderer.shadowMap.enabled = true;
	
	// Add the DOM element of the renderer to the container we created in the HTML
	container = document.getElementById('world');
	container.appendChild(renderer.domElement);
	
	// f the user resizes the screen we have to update the camera and the renderer size
	window.addEventListener('resize', reajustarPantalla, false);

}


/******************************************************************
 define los parametros de la camara y la agrega a la escena 
 ******************************************************************/
function crearCamara(){
	//Create the camera
	aspectRatio = ANCHO / ALTURA;
	fieldOfView = 55;	//60
	nearPlane = 0.1;
	farPlane = 10000;
	camara = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
	camara.position.x = 20;
	camara.position.z = 200; 
	camara.position.y = 90; 
//	camara.lookAt(escena.position);
	camara.lookAt(puntoVista);
	escena.add(camara);
}


/******************************************************************
 Desplaza la camara, segun teclas 38:up; 37:left, 40:down; 39:right
 ******************************************************************/
function moverCamara(val){
//	var deltaAlfa = 0.0872666666666667; //5 grados, en radianes	
	var deltaAlfa = 0.0174533333333333; //1 grado, en radianes	

	if(val == 40 || val == 39) deltaAlfa *= -1;
	switch (val) {
		case 38: // up  		//Plano Y-Z
		case 40: // down
			var dist = Math.sqrt(camara.position.z*camara.position.z + camara.position.y*camara.position.y);
			var alfa = Math.atan(camara.position.y/camara.position.z) + deltaAlfa;
			var y1 = dist * Math.sin(alfa);
			var z1 = dist * Math.cos(alfa);
			camara.position.y = y1;
			camara.position.z = z1;
			break;
		case 39: // right		//Plano X-Z
		case 37: // left
			var dist = Math.sqrt(camara.position.z*camara.position.z + camara.position.x*camara.position.x);
			var alfa = Math.atan(camara.position.z/camara.position.x) + deltaAlfa;
			var z1 = dist * Math.sin(alfa);
			var x1 = dist * Math.cos(alfa);
			//if(alfa < -1.5708) z1 *=-1;
			camara.position.x = x1;
			camara.position.z = z1;
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++			
//			mensaje.innerHTML = " a: " + (alfa * 57.29564553093965) + "<br>"+" X: "+ x1 + "<br> Z: "+z1;
//			mensaje.innerHTML = " a: " + alfa;
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++			

			break;
	}
//	camara.lookAt(escena.position);
	camara.lookAt(puntoVista);
}

/******************************************************************
 Define las luces y las agrega a la escena
 ******************************************************************/
var hemisphereLight, shadowLight;
function crearLuces(){
	// A hemisphere light is a gradient colored light; 
	// the first parameter is the sky color, the second parameter is the ground color, 
	// the third parameter is the intensity of the light
	hemisphereLight = new THREE.HemisphereLight(0xAAAAAA,0x000000, .9)
	
	// A directional light shines from a specific direction. 
	// It acts like the sun, that means that all the rays produced are parallel. 
	shadowLight = new THREE.DirectionalLight(0xffffff, .9);

	// Set the direction of the light  
	shadowLight.position.set(300, 300, 300);   //150, 350, 350
	
	// Allow shadow casting 
	shadowLight.castShadow = true;

	// define the visible area of the projected shadow
	shadowLight.shadow.camera.left = -800;		//-400
	shadowLight.shadow.camera.right = 800;
	shadowLight.shadow.camera.top = 800;
	shadowLight.shadow.camera.bottom = -800;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1000;

	// define the resolution of the shadow; the higher the better, 
	// but also the more expensive and less performant
	shadowLight.shadow.mapSize.width = 1024; //2048
	
	// to activate the lights, just add them to the scene
	escena.add(hemisphereLight);  
	escena.add(shadowLight);

	// an ambient light modifies the global color of a scene and makes the shadows softer
	ambientLight = new THREE.AmbientLight(0xdc8874, .5);	//.5
	escena.add(ambientLight);

	var helper = new THREE.DirectionalLightHelper( shadowLight, 20 );
	escena.add( helper );
}

/******************************************************************
 Cea el plano de referencia y los ejes
 ******************************************************************/
function crearMundo(){
	var geometria = new THREE.PlaneGeometry(10000,10000);
//	var map = THREE.ImageUtils.loadTexture("terreno.jpg");
//	var material = new THREE.MeshLambertMaterial({color: 0x088A08, map: map, side:THREE.DoubleSide});
	var material = new THREE.MeshLambertMaterial({color: 0x088A08});
	plano = new THREE.Mesh(geometria, material);
	plano.receiveShadow = true;
	plano.rotation.z = -.5 * Math.PI;
	plano.rotation.x = -.5 * Math.PI;
	plano.receiveShadow = true;
	var axisHelper = new THREE.AxisHelper(1000);
  	escena.add(axisHelper);
	escena.add(plano);
/*
	var geometria1 = new THREE.SphereGeometry(500,50,50);
	var map1 = THREE.ImageUtils.loadTexture("img/cielito.jpg");
	var material1 = new THREE.MeshBasicMaterial({map: map1, side: THREE.FrontSide});
	esfera = new THREE.Mesh(geometria1, material1);	
	escena.add(esfera);
*/
}

/******************************************************************
 construye todos los objetos en el mundo 
 ******************************************************************/
function crearCohete(){
	fuerzaE = new THREE.Vector3(0,1000,0);
	vel = new THREE.Vector3(0,1000,0);
	pos = new THREE.Vector3(0,0,0);	
	cohete = new Modulo(1000,fuerzaE,vel,1000,500,pos);
	cohete = new SaturnoV();
	cohete.mesh.position.set(0,26,0);	
	escena.add(cohete.mesh);

	torre = new Plataforma();
	torre.mesh.rotation.y = -3.1416/2;
	escena.add(torre.mesh);
	
	moduloLunar = new ModuloLunar();
	moduloLunar.mesh.position.set(0,295,0);
	cohete.mesh.add(moduloLunar.mesh);

	particulas = new Particles();
	particulas.mesh.position.set(0,-500,0);
	cohete.mesh.add(particulas.mesh);

	particulas1 = new Particles();
	particulas1.updateParticles();
	particulas1.mesh.position.set(-14,-500,0);
	cohete.mesh.add(particulas1.mesh);

	particulas2 = new Particles();
	particulas2.updateParticles();
	particulas2.mesh.position.set(14,-500,0);
	cohete.mesh.add(particulas2.mesh);


	
//	escena.add(moduloLunar.mesh);

}
/*function crearCohete(){
	cohete = new SaturnoV();
	cohete.mesh.position.set(0,26,0);	
	escena.add(cohete.mesh);

	torre = new Plataforma();
	torre.mesh.rotation.y = -3.1416/2;
	escena.add(torre.mesh);
	
	moduloLunar = new ModuloLunar();
	moduloLunar.mesh.position.set(0,295,0);

	cohete.mesh.add(moduloLunar.mesh);
//	escena.add(moduloLunar.mesh);

}
*/

/******************************************************************
  
 ******************************************************************/
function calcularEstado(){

}


/******************************************************************
  
 ******************************************************************/
function reajustarPantalla(){
	// update height and width of the renderer and the camera
	ALTURA = window.innerHeight;
	ANCHO = window.innerWidth;
	renderer.setSize(ANCHO, ALTURA);
	camara.aspect = ANCHO / ALTURA;
	camara.updateProjectionMatrix();
}

//++++++++++++ FUNCIONES AUXILIARES +++++++++++++++++++++++++++++++

/******************************************************************
 Manejador del evento "keydown". Toma el valor ascii de la tecla pulsada 
 ******************************************************************/
function detectarTecla(e){
	var ev = (e)? e: event;
	valorTecla = (ev.which)? ev.which: event.keyCode;
}

/******************************************************************
 Manejador del evento "wheel". al mover la rueda del mouse, cambia distancia de la camara 
 ******************************************************************/
document.addEventListener('wheel', function(event){
	var evt = window.event || e //equalize event object
	deltaRueda = evt.detail? evt.detail*(-120) : evt.wheelDelta 
})


/******************************************************************
 para programar acciones con las teclas
 ******************************************************************/
 var actPart = null;
function leerTecla(){
	switch (valorTecla) {
		case 32: // Space
			activarParticulas();
			break;
		case 38: // up
		case 37: // left
		case 40: // down
		case 39: // right
			moverCamara(valorTecla);
			break;

		case 65: // a
			moverCohete(+5);
			break;

		case 83: // s
			moverCohete(-5);
			break;

		case 81:
		case 113: 		//Q + sube punto de vista camara
			moverPuntoVista(5)
			break;

		case 87:
		case 119: 		//W - baja punto de vista camara
			moverPuntoVista(-5)
			break;

	}
	valorTecla=0;
}


/******************************************************************
 para programar acciones con el Mouse.
 con la rueda, acerca o aleja la camara. deltaRueda 
 ******************************************************************/
function leerMouse(){
	//--- Rueda del Mouse ---------------
	if(Math.abs(deltaRueda) > 0){
		var kd = -0.05;				//constante de ajuste
		var x = camara.position.x;
		var y = camara.position.y;
		var z = camara.position.z;
		//OJO: CALCULAR HASTA puntoVista, no al 0,0,0

		var dir = new THREE.Vector3();
 		dir.subVectors( camara.position, puntoVista ).normalize(); //Vect Unit en direccion punto de vista
 		dir.multiplyScalar (deltaRueda * kd);		//Vector de desplazamiento a sumar
		camara.position.addVectors ( camara.position, dir );

/*		var d0 = Math.sqrt(x*x + y*y + z*z);		//Distancia inicial
		var d1 = d0 + (deltaRueda * kd);				//Nueva distancia
		var fact = d1 / d0;								//porcentaje de ajuste a cada eje
		camara.position	.x = x * fact;
		camara.position	.y = y * fact;
		camara.position	.z = z * fact;*/
	}
	deltaRueda	= 0;
}

//---------------- PRUEBA -------------------------------
function moverCohete(delta){
	posY = cohete.mesh.position.y;
	cohete.mesh.position.set(0, posY+delta, 0);
}


//Cambia punto de enfoque en Y de la camara
function moverPuntoVista(delta){
	puntoVista.y+= delta;
	camara.lookAt(puntoVista);
}

var power = 1;
function activarParticulas(){
	if (power == 0) {
		particulas.mesh.visible = true;
		particulas1.mesh.visible = true;
		particulas2.mesh.visible = true;
		power = 1;
	}
	else{
		particulas.mesh.visible = false;
		particulas1.mesh.visible = false;
		particulas2.mesh.visible = false;
		power = 0;

	}
}