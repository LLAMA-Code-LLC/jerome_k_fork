<template>
    <canvas id="webgl-canvas"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; display: block; pointer-events: all;"></canvas>
</template>
  
<script>
import * as THREE from 'three'

import Mouse from '../utils/threejs/Mouse.js'
import UpdateLoop from '../utils/threejs/UpdateLoop.js'


import * as CustomShaderPass from '../utils/threejs/ShaderPass.js'

import RenderContext from '../utils/threejs/RenderContext.js'




// import dat.gui
import * as dat from 'dat.gui'

import ParticleEngine from 'src/utils/threejs/ParticleEngine'

import SimShader from '../utils/threejs/SimShader.js'
import SimShader2 from '../utils/threejs/SimShader copy.js'
import SimShader3 from '../utils/threejs/SimShader copy 2.js'
import ParticleShader from '../utils/threejs/ParticleShader.js'
import UVMapAnimator from '../utils/threejs/UVMapAnimator.js'
import LeapManager from '../utils/threejs/LeapManager.js'


import Utils from 'src/utils/threejs/Utils'
import Stats from 'stats-js'

import 'src/utils/threejs/mousetrap'


var _params = {
    size: 170,
    simMat: CustomShaderPass.default.createShaderMaterial(SimShader),
    drawMat: CustomShaderPass.default.createShaderMaterial(ParticleShader.ParticleShader),
    color1: new THREE.Color('rgb(0,112,160)'),
    color2: new THREE.Color('rgb(1,116,160)'),
    renderer: null,
    camera: null,
    scene: null,
    index: 0,
};

var _params2 = {
    size: 170,
    simMat: CustomShaderPass.default.createShaderMaterial(SimShader2),
    drawMat: CustomShaderPass.default.createShaderMaterial(ParticleShader.ParticleShader),
    color1: new THREE.Color('rgb(0, 161, 237)'),
    color2: new THREE.Color('rgb(0, 161, 237)'),
    renderer: null,
    camera: null,
    scene: null,
    index: 1,
};

var _params3 = {
    size: 170,
    simMat: CustomShaderPass.default.createShaderMaterial(SimShader3),
    drawMat: CustomShaderPass.default.createShaderMaterial(ParticleShader.ParticleShader),
    color1: new THREE.Color('rgb(84,160,190)'),
    color2: new THREE.Color('rgb(88,160,190)'),
    renderer: null,
    camera: null,
    scene: null,
    index: 2,
};

var paramsList = [_params, _params2, _params3];
var engineList = []
var uvAnimList = []

var _engine;
var _currPreset = Utils.getParameterByName("shape") || "plane"; // initial preset
var _currSimMode;
var _tourMode = false;
var _musicElem = document.getElementById("music");

var _simModes = [
    "SIM_PLANE",
    "SIM_CUBE",
    "SIM_DISC",
    "SIM_SPHERE",
    "SIM_BALL",
    "SIM_ROSE_GALAXY",
    "SIM_GALAXY",
    "SIM_NOISE",
    "SIM_TEXTURE"
];

// must have same name as preset, for async loading to work properly
var _meshes = {
    bear: { scale: 0.023, yOffset: -2.30, speed: 0.05, url: "models/bear.json" },
    // bison: { scale: 0.020, yOffset: -2.00, speed: 0.10, url: "models/bison.json" },
    // // deer:      { scale:0.040, yOffset:-2.00, speed:0.10, url:"models/deer.json" },
    // // dog:       { scale:0.040, yOffset:-1.65, speed:0.10, url:"models/retriever.json" },
    // // fox:       { scale:0.070, yOffset:-1.50, speed:0.10, url:"models/fox.json" },
    // horse: { scale: 0.022, yOffset: -2.30, speed: 0.08, url: "models/horse.json" },
    // panther: { scale: 0.030, yOffset: -1.70, speed: 0.10, url: "models/panther.json" },
    // // rabbit:    { scale:0.040, yOffset:-1.00, speed:0.05, url:"models/rabbit.json" },
    // wolf: { scale: 0.040, yOffset: -1.70, speed: 0.10, url: "models/wolf.json" },
};

var _presets = {
    "none": { "user gravity": 3, "shape gravity": 1, _shape: "" },
    // "noise":   { "user gravity":3, "shape gravity":1, _shape:"SIM_NOISE" },
    "plane": { "user gravity": 2, "shape gravity": 3, _shape: "SIM_PLANE" },
    "sphere": { "user gravity": 4, "shape gravity": 3, _shape: "SIM_SPHERE" },
    "galaxy": { "user gravity": 3, "shape gravity": 1, _shape: "SIM_GALAXY" },
    "petals": { "user gravity": 3, "shape gravity": 0.5, _shape: "SIM_ROSE_GALAXY" },
    "bear": { "user gravity": 3, "shape gravity": 5, _shape: _meshes.bear },
    "bison": { "user gravity": 3, "shape gravity": 5, _shape: _meshes.bison },
    // "deer":    { "user gravity":3, "shape gravity":5, _shape:_meshes.deer },
    // "dog":     { "user gravity":3, "shape gravity":5, _shape:_meshes.dog },
    // "fox":     { "user gravity":3, "shape gravity":5, _shape:_meshes.fox },
    "horse": { "user gravity": 3, "shape gravity": 5, _shape: _meshes.horse },
    "panther": { "user gravity": 3, "shape gravity": 5, _shape: _meshes.panther },
    // "rabbit":  { "user gravity":3, "shape gravity":5, _shape:_meshes.rabbit },
    "wolf": { "user gravity": 3, "shape gravity": 5, _shape: _meshes.wolf },
};

var
    _pauseSim = false;


export default {
    name: 'ThreeJS',

    data() {
        return {
            scene: null,
            renderer: null,
            camera: null,
            _engine: null,
            _engine2: null,
            _uvAnim2: null,
            _gui: null,
            _uvAnim: null,
            _leapMan: null,
            _controls: null,
            mouse: null,
            raycaster: null,
            _stats: null,
            _guiFields: {}
        }
    },

    methods: {
        _leapUpdate() {
            var K_PULL = 1.0;   // in grabStrength
            var K_PUSH = 100.0; // in sphereRadius

            this._leapMan.update();
            for (var j = 0; i < paramsList.length; j++) {
                var _simMat = paramsList[j].simMat;
                for (var i = 0; i < this._leapMan.activeHandCount; i++) {
                    var inputIdx = 3 - i; // iterate backwards on input, so mouse can interact at same time
                    if (this._leapMan.frame.hands[i].grabStrength === K_PULL) {
                        _simMat.uniforms.uInputPos.value[inputIdx].copy(this._leapMan.palmPositions[i]);
                        _simMat.uniforms.uInputPosAccel.value.setComponent(inputIdx, 1.0);
                    }
                    else if (this._leapMan.frame.hands[i].sphereRadius >= K_PUSH) {
                        _simMat.uniforms.uInputPos.value[inputIdx].copy(this._leapMan.palmPositions[i]);
                        _simMat.uniforms.uInputPosAccel.value.setComponent(inputIdx, -1.0);
                    }
                }
            }



            // _debugBox.innerHTML =
            //     "hand1: " + (_leapMan.frame.hands[0] ? _leapMan.frame.hands[0].sphereRadius : "") + " " +
            //     "hand2: " + (_leapMan.frame.hands[1] ? _leapMan.frame.hands[1].sphereRadius : "") +
            //     "";
        },
        _mouseUpdate() {
            var mIdMax = Utils.isMobile ? 4 : 1;
            // for all paramslist
            for (var j = 0; j < paramsList.length; j++) {
                var _simMat = paramsList[j].simMat;
                for (var mId = 0; mId < mIdMax; mId++) {


                    var ms = this.mouse.getMouse(mId);

                    if (ms.buttons[0] || (mId === 0 && ms.buttons[2])) {
                        this.raycaster.setFromCamera(ms.coords, this.camera);

                        // from target point to camera
                        var pos = new THREE.Vector3().copy(this._controls.target)
                        pos.y += j / 2 + 0.5 - 2 / 2

                        // update depending on location y
                        var nor = pos.clone().sub(this.camera.position).normalize();
                        var plane = new THREE.Plane(
                            nor, -nor.x * pos.x - nor.y * pos.y - nor.z * pos.z
                        );

                        // intersect plane
                        var point = new THREE.Vector3(0, 0, 0)
                        this.raycaster.ray.intersectPlane(plane, point);
                        // update point depending on location y
                        point.y -= j / 2 + 0.5 - 2 / 2
                        _simMat.uniforms.uInputPos.value[mId].copy(point);
                        _simMat.uniforms.uInputPosAccel.value.setComponent(mId, ms.buttons[0] ? 1.0 : -2.0);

                    }
                    else {
                        _simMat.uniforms.uInputPosAccel.value.setComponent(mId, 0);
                    }
                }
            }


            // _debugBox.innerHTML +=
            //     "<br>"+_simMat.uniforms.uInputPosAccel.value.x.toFixed(2)
            //     +" "+_simMat.uniforms.uInputPosAccel.value.y.toFixed(2)
            //     +" "+_simMat.uniforms.uInputPosAccel.value.z.toFixed(2)
            //     +" "+_simMat.uniforms.uInputPosAccel.value.w.toFixed(2);
        },

        _inputUpdate() {
            // reset input accels
            for (var j = 0; j < paramsList.length; j++) {
                var _simMat = paramsList[j].simMat;
                _simMat.uniforms.uInputPosAccel.value.set(0, 0, 0, 0);
            }
            if (!this._controls.enabled) this._mouseUpdate();
            this._leapUpdate();
        },
        _onFrameUpdate(dt, t) {
            this._stats.begin();

            this._leapUpdate();

            this._inputUpdate();

            if (!this._controls.enabled) this._controls.update();

            if (paramsList[0].update) paramsList[0].update(dt, t);
            this.renderer.update(dt);
            this._leapMan.render();

            this._stats.end();
        },

        _onFixedUpdate(dt, t) {
            if (!_pauseSim) {
                for (var i = 0; i < engineList.length; i++) {
                    engineList[i].update(dt, t);
                }
            }
        },
        init() {
            var _canvas = document.getElementById('webgl-canvas')

            this.renderer = new RenderContext(_canvas)
            this.renderer.init();

            this.camera = this.renderer.getCamera();
            this.scene = this.renderer.getScene();
            this.raycaster = new THREE.Raycaster();


            var _canvas = document.querySelector("#webgl-canvas");

            this.mouse = new Mouse(_canvas);

            var _updateLoop = new UpdateLoop();

            _updateLoop.frameCallback = this._onFrameUpdate;
            _updateLoop.fixedCallback = this._onFixedUpdate;

            var tmat = (new THREE.Matrix4()).compose(
                new THREE.Vector3(0.0, -3.0, -this.camera.position.z),
                new THREE.Quaternion(),
                new THREE.Vector3(0.015, 0.015, 0.015));

            this._leapMan = new LeapManager(this.renderer.getRenderer(), this.camera, tmat);

            this._controls = new THREE.OrbitControls(this.camera, _canvas);
            this._controls.autoRotate = false;
            this._controls.autoRotateSpeed = 1.0;
            this._controls.noPan = true;
            this._controls.enabled = false;  // disable user input
            this._stats = new Stats();
            // document.body.appendChild(this._stats.domElement);

            // for all params
            for (var i = 0; i < paramsList.length; i++) {
                var params = paramsList[i];
                params.renderer = this.renderer;
                params.camera = this.camera;
                params.scene = this.scene;
                params.mouse = this.mouse
                params.updateLoop = _updateLoop
                params.controls = this._controls
                params.stats = this._stats
                var engine = new ParticleEngine(params);
                engineList.push(engine);
                var uvAnim = new UVMapAnimator(engine.renderer.getRenderer(), params.size)
                uvAnimList.push(uvAnim);
                params.simMat.uniforms.tTarget = { type: "t", value: uvAnim.target };

            }



            // this._engine = new ParticleEngine(_params);
            // this._uvAnim = new UVMapAnimator(this._engine.renderer.getRenderer(), _params.size);
            // _params.simMat.uniforms.tTarget = { type: "t", value: this._uvAnim.target };

            // this._engine2 = new ParticleEngine(_params2);
            // this._uvAnim2 = new UVMapAnimator(this._engine2.renderer.getRenderer(), _params2.size);
            // _params2.simMat.uniforms.tTarget = { type: "t", value: this._uvAnim2.target };


        },
        _initUI() {
            this._gui = new dat.GUI();
            this._guiFields = {
                "colors": [
                    {
                        "color1": [_params.drawMat.uniforms.uColor1.value.x * 255, _params.drawMat.uniforms.uColor1.value.y * 255, _params.drawMat.uniforms.uColor1.value.z * 255],
                        "color2": [_params.drawMat.uniforms.uColor2.value.x * 255, _params.drawMat.uniforms.uColor2.value.y * 255, _params.drawMat.uniforms.uColor2.value.z * 255],
                    }, {
                        "color1": [_params2.drawMat.uniforms.uColor1.value.x * 255, _params2.drawMat.uniforms.uColor1.value.y * 255, _params2.drawMat.uniforms.uColor1.value.z * 255],
                        "color2": [_params2.drawMat.uniforms.uColor2.value.x * 255, _params2.drawMat.uniforms.uColor2.value.y * 255, _params2.drawMat.uniforms.uColor2.value.z * 255],
                    }, {
                        "color1": [_params3.drawMat.uniforms.uColor1.value.x * 255, _params3.drawMat.uniforms.uColor1.value.y * 255, _params3.drawMat.uniforms.uColor1.value.z * 255],
                        "color2": [_params3.drawMat.uniforms.uColor2.value.x * 255, _params3.drawMat.uniforms.uColor2.value.y * 255, _params3.drawMat.uniforms.uColor2.value.z * 255],
                    },
                ],
                "alpha": _params.drawMat.uniforms.uAlpha.value,
                "color speed": _params.drawMat.uniforms.uColorSpeed.value,
                "color freq": _params.drawMat.uniforms.uColorFreq.value,
                "point size": _params.drawMat.uniforms.uPointSize.value,
                "user gravity": _params.simMat.uniforms.uInputAccel.value,
                "shape gravity": _params.simMat.uniforms.uShapeAccel.value,
                "shape": _currPreset,
                "paused": false,
                "camera rotate": false,
                "camera control": false,
                "fullscreen": Utils.toggleFullscreen,
                "take tour!": _tourMode,
                "music": true,
            };


            this._gui.add(this._guiFields, "take tour!").onChange(function (value) {
                _tourMode = value;
            });
            this._gui.add(this._guiFields, "music").onChange(function (value) {
                _toggleMusic();
            });

            var blendingObj = {
                blending: _params.drawMat.blending
            }


            var _blendingModes = {
                "No Blending": THREE.NoBlending,
                "Normal Blending": THREE.NormalBlending,
                "Additive (for dark BG)": THREE.AdditiveBlending,
                "Subtractive Blending": THREE.SubtractiveBlending,
                "Multiply Blending": THREE.MultiplyBlending,
                "Custom Blending": THREE.CustomBlending
            };


            this._gui.add(blendingObj, 'blending', _blendingModes).onChange(function (value) {
                console.log(value);
                for (var i = 0; i < paramsList.length; i++) {
                    paramsList[i].drawMat.blending = parseInt(value);
                }

            });

            var fAppearance = this._gui.addFolder("Appearance");
            // loop through paramsList

            for (var i = 0; i < paramsList.length; i++) {
                const currentEngineFolder = fAppearance.addFolder(i)
                currentEngineFolder.addColor(this._guiFields['colors'][i], "color1").onChange(function (value) {
                    console.log(parseInt(currentEngineFolder.name));
                    paramsList[parseInt(currentEngineFolder.name)].drawMat.uniforms.uColor1.value = new THREE.Vector3(value[0] / 255, value[1] / 255, value[2] / 255);
                });
                currentEngineFolder.addColor(this._guiFields['colors'][i], "color2").onChange(function (value) {
                    paramsList[parseInt(currentEngineFolder.name)].drawMat.uniforms.uColor2.value = new THREE.Vector3(value[0] / 255, value[1] / 255, value[2] / 255);
                });
                currentEngineFolder.add(this._guiFields, "alpha", 0, 1).onChange(function (value) {
                    paramsList[parseInt(currentEngineFolder.name)].drawMat.uniforms.uAlpha.value = value;
                });
                currentEngineFolder.add(this._guiFields, "color speed", -10, 10).onChange(function (value) {
                    paramsList[parseInt(currentEngineFolder.name)].drawMat.uniforms.uColorSpeed.value = value;
                });
                currentEngineFolder.add(this._guiFields, "color freq", 0, 5).onChange(function (value) {
                    paramsList[parseInt(currentEngineFolder.name)].drawMat.uniforms.uColorFreq.value = value;
                });
                currentEngineFolder.add(this._guiFields, "point size", 1, 10).onChange(function (value) {
                    paramsList[parseInt(currentEngineFolder.name)].drawMat.uniforms.uPointSize.value = value;
                });

                currentEngineFolder.add(this._guiFields, "user gravity", 0, 10)
                    .onChange(function (value) {
                        paramsList[parseInt(currentEngineFolder.name)].simMat.uniforms.uInputAccel.value = value;
                    });
                currentEngineFolder.add(this._guiFields, "shape gravity", 0, 10)
                    .onChange(function (value) {
                        paramsList[parseInt(currentEngineFolder.name)].simMat.uniforms.uShapeAccel.value = value;
                    });
            }


            // fAppearance.addColor(this._guiFields, "color1").onChange(function (value) {
            //     if (value[0] === "#") value = Utils.hexToRgb(value);
            //     _params.drawMat.uniforms.uColor1.value.x = value[0] / 255.0;
            //     _params.drawMat.uniforms.uColor1.value.y = value[1] / 255.0;
            //     _params.drawMat.uniforms.uColor1.value.z = value[2] / 255.0;
            // });
            // fAppearance.addColor(this._guiFields, "color2").onChange(function (value) {
            //     if (value[0] === "#") value = Utils.hexToRgb(value);
            //     _params.drawMat.uniforms.uColor2.value.x = value[0] / 255.0;
            //     _params.drawMat.uniforms.uColor2.value.y = value[1] / 255.0;
            //     _params.drawMat.uniforms.uColor2.value.z = value[2] / 255.0;
            // });



            var fControls = this._gui.addFolder("Controls");
            var _ = this
            fControls.add(this._guiFields, "paused").onChange(function (value) {
                // for all engines
                engineList.forEach(function (engine) {
                    engine.pauseSimulation(value);
                });
            }).listen();
            fControls.add(this._guiFields, "camera rotate").onChange(function (value) {
                engineList.forEach(function (engine) {

                    engine.enableCameraAutoRotate(value);
                }
                );
            });
            fControls.add(this._guiFields, "camera control").onChange(function (value) {
                engineList.forEach(function (engine) {

                    engine.enableCameraControl(value);
                }
                );
            }).listen();

            this._gui.add(this._guiFields, "fullscreen");

        },
        _initKeyboard() {

            // pause simulation
            Mousetrap.bind("space", function () {
                _guiFields.paused = !_guiFields.paused;
                _engine.pauseSimulation(_guiFields.paused);
                return false;
            });

            // mouse camera control
            Mousetrap.bind(["alt", "option"], function () {
                _guiFields["camera control"] = true;
                _engine.enableCameraControl(true);
                return false;
            }, "keydown");
            Mousetrap.bind(["alt", "option"], function () {
                _guiFields["camera control"] = false;
                _engine.enableCameraControl(false);
                return false;
            }, "keyup");

        },
        _setPreset(name) {
            var preset = _presets[name] || _presets.none;
            _currPreset = name;

            // set shape
            if (preset._shape.length >= 0) {
                this._setSimMode(preset._shape);
                for (var i = 0; i < uvAnimList.length; i++) {
                    uvAnimList[i].setMesh()
                }

            }
            else {
                this._setSimMode("SIM_TEXTURE");
                for (var i = 0; i < uvAnimList.length; i++) {
                    uvAnimList[i].setMesh(preset._shape.mesh)
                }
            }

            for (var i = 0; i < paramsList.length; i++) {
                var parameters = paramsList[i]

                this._guiFields["user gravity"] = parameters.simMat.uniforms.uInputAccel.value = preset["user gravity"];
                this._guiFields["shape gravity"] = parameters.simMat.uniforms.uShapeAccel.value = preset["shape gravity"];
            }


            // _params2.simMat.uniforms.uInputAccel.value = 0
            // _params2.simMat.uniforms.uShapeAccel.value = 0
            // _params.simMat.uniforms.uInputAccel.value = 1
            // _params.simMat.uniforms.uShapeAccel.value = 1
            console.log(_params.simMat.uniforms.uInputAccel.value);
        },
        _setSimMode(name) {
            if (name === _currSimMode)
                return;
            _currSimMode = name;  // cache mode, prevent shader recompile

            _simModes.forEach(function (s) {
                for (var i = 0; i < paramsList.length; i++) {
                    delete paramsList[i].simMat.defines[s];
                }
            });
            if (name) {
                for (var i = 0; i < paramsList.length; i++) {

                    paramsList[i].simMat.defines[name] = "";
                }
            }
            for (var i = 0; i < paramsList.length; i++) {

                paramsList[i].simMat.needsUpdate = true
            }
        },

        loadMeshes() {
            var loader = new THREE.JSONLoader();
            var _this = this;
            Object.keys(_meshes).forEach(function (k) {
                loader.load(_meshes[k].url, function (geometry) {
                    // console.log(geometry);
                    var mesh = new THREE.MorphAnimMesh(geometry);
                    // no material
                    mesh.scale.set(_meshes[k].scale, _meshes[k].scale, _meshes[k].scale);
                    mesh.position.y = _meshes[k].yOffset;
                    mesh.duration = 1000 / _meshes[k].speed;
                    mesh.name = k; // for debugging
                    _meshes[k].mesh = mesh;

                    // refresh mesh if same name as preset
                    if (_currPreset === k) {
                        for (var i = 0; i < uvAnimList.length; i++) {
                            uvAnimList[i].setMesh(mesh);
                        }
                    }

                });
            });
        },

        initThree() {
            // this.loadMeshes();



            for (var i = 0; i < paramsList.length; i++) {
                paramsList[i].drawMat.uniforms.uColor1.value.x = paramsList[i].color1.r
                paramsList[i].drawMat.uniforms.uColor1.value.y = paramsList[i].color1.g
                paramsList[i].drawMat.uniforms.uColor1.value.z = paramsList[i].color1.b

                paramsList[i].drawMat.uniforms.uColor2.value.x = paramsList[i].color2.r
                paramsList[i].drawMat.uniforms.uColor2.value.y = paramsList[i].color2.g
                paramsList[i].drawMat.uniforms.uColor2.value.z = paramsList[i].color2.b
            }
            this.init();
            if (this._gui == null) {
                this._initUI();
            }

            this._initKeyboard();
            this._setPreset(_currPreset);


            // loop through engines
            for (var i = 0; i < engineList.length; i++) {
                engineList[i].start();
            }


            // add resize listener
            window.addEventListener('resize', this.onResize);
        },
        onResize() {
            var width = window.innerWidth;
            var height = window.innerHeight;
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    },
    mounted() {
        this.initThree()
    }

}
</script>
  