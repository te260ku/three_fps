var scene;
var camera;
var renderer;
var controls;
var emitter;

// フィールド関連
var cubes = [];
var cubeNum = 3;
var cubePositionX = [10, 8, 12];
var cubePositionY = [1, 5, 2];
var cubePositionZ = [0, 10, 10];
var cubePositions = {};

// ゲームシステム関連
var time = 0;
var limitTime = 100;
var score = 0;
var keyboard = {};
var endFlag = false;

// UI関連
var blocker = document.getElementById('blocker');
var scoreLabel = document.getElementById('score');
scoreLabel.innerHTML = 0;
var timeBar = document.getElementById('timeBar');
// timeBar.min = "0";
// timeBar.max = "100";
// timeBar.value = timeBar.max;
var msg = document.getElementById("msg");
msg.innerHTML = "Press Q to Start";



// オーディオ関連
// var shotAudio = new Audio("../audio/ShotAudio.mp3");
// var StruckAudio = new Audio("../audio/StruckAudio.mp3");


window.onload = init;

function init() {

   scene = new THREE.Scene();

   // カメラの生成
   camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10000);
   camera.position.set(0, 1, 0);
   camera.lookAt(0, 0, 0);
   scene.add(camera);
   
   // レンダラーの生成
   renderer = new THREE.WebGLRenderer({
      antialias: true
   });
   renderer.setSize(window.innerWidth, window.innerHeight);
   renderer.setPixelRatio(window.devicePixelRatio);
   renderer.setClearColor(new THREE.Color(0xEEEEEE));
   var stage = document.getElementById("stage");
   stage.appendChild(renderer.domElement);

   // コントローラーの生成
   controls = new THREE.FirstPersonControls(camera, renderer.domElement);
   controls.lookSpeed = 0.1;
   controls.movementSpeed = 1;
   controls.noFly = true;
   controls.lookVertical = true;
   controls.constrainVertical = false;

   // 光源の生成
   ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
   scene.add(ambientLight);


   // フィールドの生成
   const geometry_f = new THREE.SphereGeometry(100, 100, 100);
   geometry_f.scale(-1, 1, 1);

   //テクスチャ画像を読み込み
   const loader_f = new THREE.TextureLoader();
   const texture_f = loader_f.load('test.jpg');

   //球体のマテリアルを生成
   const material_f = new THREE.MeshBasicMaterial({
     map: texture_f
   });

   //球体を生成
   const sphere_f = new THREE.Mesh(geometry_f, material_f);

   scene.add(sphere_f);


   
   // var backgroundGeo = new THREE.SphereGeometry(1000, 90, 45);
   // // var textureLoader = new THREE.TextureLoader();
   // // backgroundTex = textureLoader.load("background.jpeg");
   
   // var backgroundMat = new THREE.MeshBasicMaterial({
   //    color: "gray",
   //    // color:0xffffff, 
   //    wireframe: true, 
   //    // map: backgroundTex
   // })

   // const background = new THREE.Mesh(backgroundGeo, backgroundMat);
   // scene.add(background);

   // デバッグ用
   const axes = new THREE.AxisHelper(400);
   axes.position.set(0, 0, 0);
   scene.add(axes);


   var weapon = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 5), new THREE.MeshBasicMaterial({
      color: 0x5555ff
   }));
   weapon.position.set(2, -1, -2.5);
   camera.add(weapon);


   // var mtlLoader = new THREE.MTLLoader();
   // mtlLoader.load("../demo/models/uziGold.mtl", function(materials){

   //      materials.preload();
   //      var objLoader = new THREE.OBJLoader();
   //      objLoader.setMaterials(materials);

   //      objLoader.load("../demo/models/uziGold.obj", function(gun){

   //          gun.traverse(function(node){
   //              if( node instanceof THREE.Mesh ){
   //                  node.castShadow = false;
   //                  node.receiveShadow = false;
   //              }
   //          });
   //          gun.rotation.y += degreesToRadians(180);
   //          gun.scale.set(10,10,10);
   //          gun.position.set(0.6, -0.5, -1.2);

   //          camera.add(gun);
   //      });

   // });



   emitter = new THREE.Object3D();
   emitter.position.set(2, -1, -5);
   camera.add(emitter);


   // ----敵の生成------------------------------------

   // var cubeGeo = new THREE.BoxGeometry(1, 1, 1);
   var cubeGeo = new THREE.SphereGeometry();
   // var cubeMat = new THREE.MeshPhongMaterial({color:0x5555ff, wireframe:false});
   var cubeMat = new THREE.MeshNormalMaterial({ wireframe: false });

   // var shader = FresnelShader;

   
   for (i = 0; i < cubeNum; i++) {
      cube = new THREE.Mesh(cubeGeo, cubeMat);

      // 位置はvector3で指定する
      cube.position.x = cubePositionX[i];
      cube.position.y = cubePositionY[i];
      cube.position.z = cubePositionZ[i];
      

      if (cube.geometry.boundingSphere == null) {
         cube.geometry.computeBoundingSphere();
      }
      //少しだけ小さめにする
      cube.geometry.boundingSphere.radius *= 0.8;
      cube.name = "cube-" + [i];
      cubes.push(cube);
      scene.add(cube);
   }

   // -------------------------------------------------

   render();
}



var bullets = [];
// window.addEventListener("keydown", onMouseDown);
var canShoot = true;

function onMouseDown() {
   // shotAudio.play();
   let bullet = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 4), new THREE.MeshBasicMaterial({
      color: "aqua"
   }));
   if (bullet.geometry.BoundingSphere == null) {
      bullet.geometry.computeBoundingSphere();
   }
   bullet.geometry.boundingSphere.radius *= 0.8;
   // 始点 - 銃の先
   bullet.position.copy(emitter.getWorldPosition()); 
   bullet.quaternion.copy(camera.quaternion); 

   bullet.alive = true;
   setTimeout(function () {
      bullet.alive = false;
      scene.remove(bullet);
      bullets.shift();
   }, 5000);

   scene.add(bullet);
   bullets.push(bullet);

   canShoot = false;
   setTimeout(function () {
      canShoot = true;
   }, 1000);
}

// 弾丸のスピード
var speed = 50;
// 時間管理
var clock = new THREE.Clock();
var delta = 0;

var controlsFlag = false;
var step = 0;

function render() {
   // 弾丸の発射
   if (keyboard[32] && canShoot) {
      onMouseDown();
   }

   // sphereを動かしているところ
   step += 0.01;
   cubes[0].position.z = 10 + (10*(Math.cos(step)));
   cubes[0].position.y = 1.5 + (10*Math.abs(Math.sin(step)));

   // controlsのオンオフ
   if (keyboard[81]) {
      // まだゲームが終了していなかったら
      if (!endFlag) {
         if (!controlsFlag) {
            blocker.style.display = "none";
            controls.enabled = true;
            controlsFlag = true;
            keyboard[81] = false;
         } else {
            blocker.style.display = "";
            controls.enabled = false;
            controlsFlag = false;
            keyboard[81] = false;
         }
      }
   }



   requestAnimationFrame(render);
   delta = clock.getDelta();



   //   // timer
   //   time += delta;
   // //   setTimeout
   //   timeBar.value-=delta;

   //   // timeの単位はs
   //   if (time > limitTime) {
   //    blocker.style.display = "";
   //    msg.innerHTML = "GAMEOVER"
   //    msg.style.color = "red";
   //    controls.enabled = false;
   //    controlsFlag = false;
   //    endFlag = true;
   //   }


   bullets.forEach(b => {
      // ローカルのz軸向きに飛ばす
      b.translateZ(-speed * delta);

      var targetBullet = b.geometry.boundingSphere.clone();
      targetBullet.applyMatrix4(b.matrixWorld);



      for (i = 0; i < cubes.length; i++) {

         var targetCube = cubes[i].geometry.boundingSphere.clone();
         targetCube.applyMatrix4(cubes[i].matrixWorld);

         if (targetCube.intersectsSphere(targetBullet)) {
            // StruckAudio.play();
            score++;
            scoreLabel.innerHTML = score;
            console.log("hit");

            t = scene.getObjectByName(cubes[i].name);

            scene.remove(t);

            scene.remove(targetCube);
            cubes.splice(i, 1);

            scene.remove(targetBullet);
            scene.remove(b);
         }

      }

   });

   controls.update(delta);
   renderer.render(scene, camera);
}



// キー入力に応じてflagを立てる
function keyDown(event) {
   keyboard[event.keyCode] = true;
}

function keyUp(event) {
   keyboard[event.keyCode] = false;
}

function degreesToRadians(degrees) {
   return degrees * Math.PI / 180;
}

function radiansToDegrees(radians) {
   return radians * 180 / Math.PI;
}


function windowResize() {
   camera.aspect = window.innerWidth / window.innerHeight;
   camera.updateProjectionMatrix();

   renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);
window.addEventListener('resize', windowResize, false);