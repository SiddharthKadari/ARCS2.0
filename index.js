var captureStartTime, calculationStartTime, executionStartTime;

//Define page states

const SerialStatus = {
	PORT_OPEN: 'Serial Connected',
	PORT_CLOSED: 'Serial Disconnected'
}

const Min2PhaseStatus = {
	IDLE: 'Uninitialized',
	INITIALIZING: 'Initializing',
	INITIALIZED: 'Initialized'
}

const OperationStatus = {
	IDLE: 'IDLE',
	SOLVING: 'Solving'
}

var SystemStatus = {
	serial: SerialStatus.PORT_CLOSED,
	min2Phase: Min2PhaseStatus.IDLE,
	operation: OperationStatus.IDLE
}

function updateStatusIndicator(){
	let statusStr = '';
	if(SystemStatus.operation == OperationStatus.SOLVING){
		statusStr = SystemStatus.operation;
	}else{
		statusStr += SystemStatus.min2Phase + ', ' + SystemStatus.serial;
	}
	document.getElementById("statusIndicator").innerHTML = statusStr;
}

updateStatusIndicator();

const centers = ["U", "R", "F", "D", "L", "B"];

//######################### CAMERA + SCANNING #########################

var camDomElems = [];
var imgsDomElem;
var imgPixels = [];

/*
RED    = FRONT
ORANGE = BACK
BLUE   = RIGHT
GREEN  = LEFT
YELLOW = DOWN
WHITE  = UP
*/

const HEIGHT = 200;
const NUM_CAMS = 8;
var cams;

//camera types - no longer needed
const AVERMEDIA_CAM = {
	width: 1920,
	height: 1080
};
const FACETIME_CAM = {
	width: 1280,
	height: 720
};

function getTypeFromLabel(label) {
	if (label.includes("Live Streamer CAM 313"))
		return AVERMEDIA_CAM;
	else if (label.includes("FaceTime HD Camera (Built-in)"))
		return FACETIME_CAM;
	else
		return {
			width: 0, height: 0
		}
}

//Return RGB data of the pixel selected
function getPixel(x, y) {
	return [imgPixels[4 * (y * imgsDomElem.width + x)], imgPixels[4 * (y * imgsDomElem.width + x) + 1], imgPixels[4 * (y * imgsDomElem.width + x) + 2]];
}

//classify RGB data to a face of the Rubik's Cube based on the tile being scanned
function colorToFace(i, color){
	if(i < 8){//U Ttested
		if(color[0] < 150 && color[1] < 150 && color[2] < 150){
			return 'B';
		}else if(color[0] < 70 && color[1] < 110 && color[2] > 200){
			return 'R';
		}else if(color[2] > 210 && color[0] + color[1] + color[2] > 620){
			return 'U';
		}else if(color[1] < 105){
			return 'F';
		}else if(color[0] < 170){
			return 'L';
		}else{
			return 'D';
		}
	}else if(i < 24){//TESTED: FR
		if((color[0] > 180 && i != 19 || color[0] > 170) && color[1] > 180 && color[2] > 180){
			return 'U';
		}else if((i != 19 && color[0] < 150 || color[0] < 130) && color[1] < 150 && color[2] < 150){
			return 'B';
		}else if((i != 19 && color[0] > 150 || color[0] > 130) && color[1] < 130){
			return 'F';
		}else if(color[0] < 70 && color[1] < 150 && color[2] > 150){
			return 'R';
		}else if(color[0] < 170){
			return 'L';
		}else{
			return 'D';
		}
	}else if(i < 32){//TESTED: D
		if(color[0] > 180 && color[1] > 180 && (color[2] > 180 && i != 29 || color[2] > 200)){
			return 'U';
		}else if(color[0] < 150 && color[1] < 150 && color[2] < 150){
			return 'B';
		}else if(color[0] > 150 && color[1] < 130){
			return 'F';
		}else if(color[0] < 70 && color[1] < 150 && color[2] > 150){
			return 'R';
		}else if(color[0] < 170){
			return 'L';
		}else{
			return 'D';
		}
	}else if(i < 40){//TESTED: L
		if((color[0] > 180 && i != 35 || color[0] > 150) && color[1] > 165 && (color[2] > 180 && i > 34 && i != 37 || color[2] > 220)){
			return 'U';
		}else if(color[0] < 100 && color[1] < 150 && color[2] < 150){
			return 'B';
		}else if(color[0] > 130 && color[1] < 130){
			return 'F';
		}else if(color[0] < 70 && color[1] < 150 && color[2] > 150){
			return 'R';
		}else if(color[0] < 170){
			return 'L';
		}else{
			return 'D';
		}
	}else{//TESTING: B
		if(color[0] < 150 && color[1] < 150 && color[2] < 150){
			return 'B';
		}else if(color[0] < 70 && (color[2] > 200 || i == 40 && color[2] > 175)){
			return 'R';
		}else if(color[2] > 210 && color[0] + color[1] + color[2] > 620){
			return 'U';
		}else if(color[1] < 105){
			return 'F';
		}else if(color[0] < 170){
			return 'L';
		}else{
			return 'D';
		}
	}
}

//parameter should be the result of scanTargets()
function scanCube(colors){
	let cube = "", i = 0;

	for(let j = 0; j < 6; j++){
		for(; i < 4 + j * 8; i++)
			cube += colorToFace(i, colors[i]);
		cube += centers[j];
	}
	for(; i < 48; i++)
		cube += colorToFace(i, colors[i]);

	return cube;
}

//See comment above capture()
var targets = [
	[115, 30],   //U1 targets[0]
	[140, 100],  //U2 targets[1]
	[115, 165],  //U3 targets[2]
	[430, 185],  //U4 targets[3]
	//WHITE      //U5
	[430, 20],   //U6 targets[4]
	[483, 173],  //U7 targets[5]
	[480, 100],  //U8 targets[6]
	[480, 27],   //U9 targets[7]


	[937, 40],   //R1 targets[8]
	[990, 30],   //R2 targets[9]
	[1205, 25],  //R3 targets[10]
	[925, 100],  //R4 targets[11]
	//BLUE       //R5
	[1205, 105], //R6 targets[12]
	[920, 170],  //R7 targets[13]
	[980, 180],  //R8 targets[14]
	[1220, 168], //R9 targets[15]


	[1640, 25],  //F1 targets[16]
	[777, 45],   //F2 targets[17]
	[850, 41],   //F3 targets[18]
	[1640, 100], //F4 targets[19]
	//RED        //F5
	[850, 100],  //F6 targets[20]
	[1655, 170], //F7 targets[21]
	[790, 180],  //F8 targets[22]
	[840, 168],  //F9 targets[23]


	[2000, 25],  //D1 targets[24]
	[2213, 20],  //D2 targets[25]
	[2270, 20],  //D3 targets[26]
	[2000, 100], //D4 targets[27]
	//YELLOW     //D5
	[2270, 100], //D6 targets[28]
	[2000, 180], //D7 targets[29]
	[2210, 175], //D8 targets[30]
	[2270, 180], //D9 targets[31]


	[2700, 24],  //L1 targets[32]
	[2760, 30],  //L2 targets[33]
	[1555, 27],  //L3 targets[34]
	[2700, 100], //L4 targets[35]
	//GREEN      //L5
	[1560, 100], //L6 targets[36]
	[2700, 180], //L7 targets[37]
	[2760, 170], //L8 targets[38]
	[1545, 170], //L9 targets[39]


	[1285, 28],  //B1 targets[40]
	[2560, 33],  //B2 targets[41]
	[2610, 30],  //B3 targets[42]
	[1285, 100], //B4 targets[43]
	//ORANGE     //B5
	[2620, 100], //B6 targets[44]
	[1293, 165], //B7 targets[45]
	[2560, 160], //B8 targets[46]
	[2620, 170], //B9 targets[47]
];

//create an input array for Min2Phase based on the captured images
function scanTargets() {
	let results = [];

	for (let i in targets) {
		results.push(getPixel(targets[i][0], targets[i][1]));
	}

	return results;
}

/** prepare scrambled Cube data as
 *
 *             |************|
 *             |*U1**U2**U3*|
 *             |************|
 *             |*U4**U5**U6*|
 *             |************|
 *             |*U7**U8**U9*|
 *             |************|
 * ************|************|************|************|
 * *L1**L2**L3*|*F1**F2**F3*|*R1**R2**R3*|*B1**B2**B3*|
 * ************|************|************|************|
 * *L4**L5**L6*|*F4**F5**F6*|*R4**R5**R6*|*B4**B5**B6*|
 * ************|************|************|************|
 * *L7**L8**L9*|*F7**F8**F9*|*R7**R8**R9*|*B7**B8**B9*|
 * ************|************|************|************|
 *             |************|
 *             |*D1**D2**D3*|
 *             |************|
 *             |*D4**D5**D6*|
 *             |************|
 *             |*D7**D8**D9*|
 *             |************|
 *
 * -> U1 U2 ... U9 R1 ... R9 F1 ... F9 D1 ... D9 L1 ... L9 B1 ... B9
 */
/*Camera order (Swap cam feeds until feeds are in this order)

white  : orange
white  : red
red    : blue
blue   : orange
green  : red
green  : yellow
yellow : blue
orange : green

*/
async function capture() {
	finishedCaptures = 0;

	for (let img in camDomElems) {

		subCapture(img); //copy down all the cameras' data simultaneously in different threads
		// imgsDomElem.getContext('2d').drawImage(camDomElems[order[img] - 1], 355*img, 0, 355, 200); //not async
	}

	while (finishedCaptures < NUM_CAMS); //waiting for all cam datas to be copied down

	//the most time consuming part of this function is imgsDomElem.getContext('2d').getImageData(...), the parameters do not affect the time this takes
	imgPixels = imgsDomElem.getContext('2d').getImageData(0, 0, imgsDomElem.width, imgsDomElem.height).data;

	showTargets();
}

var finishedCaptures = 0;

async function subCapture(img) {
	imgsDomElem.getContext('2d').drawImage(camDomElems[img], 355 * img, 0, 355, 200);
	finishedCaptures++;
}

//display the selected target pixels for image parsing
function showTargets() {
	let ctx = imgsDomElem.getContext('2d');
	ctx.fillStyle = "#000000";

	for (let i in targets)
		ctx.fillRect(targets[i][0] - 5, targets[i][1] - 5, 10, 10);
}

//Get full webcam device list
function getWebcams() {
	return navigator.mediaDevices.enumerateDevices()
		.then((devices) => {
			return devices.filter((device) => {
				return device.kind === 'videoinput';
			});
		});
}

//initialize all cameras
async function initCams() {
	cams = await getWebcams();

	imgsDomElem = document.getElementById('imgsCanvas');

	for (let i = 0; i < NUM_CAMS; i++) {
		if (getTypeFromLabel(cams[i].label) == FACETIME_CAM) {
			cams.splice(i, 1);
		}

		camInit(i);
	}
	imgsDomElem.width = 640*NUM_CAMS;
	imgsDomElem.height = HEIGHT;

	imgsDomElem.getContext('2d').getImageData(0,0,1,1);
}

//display all camera data to webpage
async function camInit(i) {
	camDomElems.push(document.getElementById('vid' + i));

	await navigator.mediaDevices.getUserMedia({
		video: {
			deviceId: cams[i].deviceId
		} //AverMedia: 1920×1080, Default Computer Webcam: 1280×720
	}).then(function (stream) {
		stream.getVideoTracks()[0].applyConstraints({
			width: { exact: 640 },
			height: { exact: 480 },
			// frameRate: {ideal: 1, max: 1}
		});
		camDomElems[i].srcObject = stream;
	});

	camDomElems[i].height = HEIGHT;
	camDomElems[i].width = getTypeFromLabel(cams[i].label).width / (getTypeFromLabel(cams[i].label).height / HEIGHT);
}

//Swap the order of the selected 2 camera feeds (indexing based on 1: swap(1,2) swaps the first 2 feeds)
function swap(s1, s2) {
	let streamA = camDomElems[s1 - 1].srcObject;
	camDomElems[s1 - 1].srcObject = camDomElems[s2 - 1].srcObject;
	camDomElems[s2 - 1].srcObject = streamA;
}

//time how long any function takes (used for testing and efficiency optimization)
async function time(f, a, b) {
	let captureStartTime = performance.now();

	let r = await f(a, b);

	console.log("Time: " + (performance.now() - captureStartTime));

	return r;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

//returns a string that displays the scanned data in an easy to visualize manner
//parameter should be the result of scanCube(colors)
function scanToImg(scan){
	let str = "";

	for(let i = 0; i < 3; i++){
		str += "   " + scan.substring(i*3, i*3+3) + "\n";
	}
	for(let i = 0; i < 3; i++){
		str += scan.substring(i*3+36, i*3+39) + scan.substring(i*3+18, i*3+21) + scan.substring(i*3+9, i*3+12) + scan.substring(i*3+45, i*3+48) + "\n";
	}
	for(let i = 0; i < 3; i++){
		str += "   " + scan.substring(i*3+27, i*3+30) + "\n";
	}
	return str;
}















//######################### SERIAL COMMUNICATION #########################

var port, reader, writer;

//Begin listening for serial data from the microcontroller
async function beginListen() {
	let s = "";

	while (true) {
		if (reader != null) s += (await reader.read()).value;

		if (s[s.length - 1] == '\n' && s[s.length - 2] == '\r') { //only process the recieved message if it is a complete message and if the terminus bytes are recieved
			handleMessage(s.substring(0, s.length - 2));
			s = "";
		}
	}
}

//establish communication link between PC and microcontroller
async function connect() {
	port = await navigator.serial.requestPort();

	port.addEventListener('disconnect', event => {
		SystemStatus.serial = SerialStatus.PORT_CLOSED;
		updateStatusIndicator();
	});

	await port.open({
		baudRate: 115200,
		dataBits: 8,
		parity: 'none',
		stopBits: 1,
		flowControl: 'none'
	});

	//create piped text decoder for reading serial data
	const textDecoder = new TextDecoderStream();
	const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
	reader = textDecoder.readable.getReader();

	//create piped text encoder for writing serial data
	const textEncoder = new TextEncoderStream();
	const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
	writer = textEncoder.writable.getWriter();

	beginListen();

	//allow for some time to ensure all systems are running
	await sleep(2000);

	console.log("Serial initialized");

	SystemStatus.serial = SerialStatus.PORT_OPEN;
	updateStatusIndicator();
}


//when terminal message is received from arduino
async function handleMessage(msg) {
	let t = performance.now();
	console.log("Capture Time: " + ((calculationStartTime-captureStartTime)/1000.0));
	console.log("Calculation Time: " + ((executionStartTime-calculationStartTime)/1000.0));
	console.log("Execution Time: " + ((t-executionStartTime)/1000.0));
	console.log("Total Time: " + ((t-captureStartTime)/1000.0));
	console.log(msg);

	SystemStatus.operation = OperationStatus.IDLE;
	updateStatusIndicator();
}

//send string to arduino
async function sendMessage(msg) {
	executionStartTime = performance.now();
	await writer.write(String.fromCharCode(msg.length) + msg);
}























//######################### SOLVE #########################

/*

FULL CREDIT TO cs0x7f FOR THE ORIGINAL IMPLENTATION OF THE FOLLOWING SOLVE ALGORITHM, A JAVASCRIPT IMPLEMENTATION OF KOCIEMBA'S ALGORITHM, WRITTEN BY HERBERT KOCIEMBA

ONLY SOME MINOR CHANGES HAVE BEEN MADE TO THE FOLLOWING ALGORITHM TO OPTIMIZE THE RESULTS IT PRODUCES FOR THE PURPOSES OF ARCS 2.0

*/

var min2phase = (
	function () {

		var USE_TWIST_FLIP_PRUN = true;
		var PARTIAL_INIT_LEVEL = 2;

		var MAX_PRE_MOVES = 20;
		var TRY_INVERSE = true;
		var TRY_THREE_AXES = true;

		var USE_COMBP_PRUN = true; //USE_TWIST_FLIP_PRUN;
		var USE_CONJ_PRUN = USE_TWIST_FLIP_PRUN;
		var MIN_P1LENGTH_PRE = 7;
		var MAX_DEPTH2 = 11;//changed from 13 to 11

		var INVERSE_SOLUTION = 0x2;

		function Search() {
			this.move = [];
			this.moveSol = [];

			this.nodeUD = [];

			this.valid1 = 0;
			this.allowShorter = false;
			this.cc = new CubieCube();
			this.urfCubieCube = [];
			this.urfCoordCube = [];
			this.phase1Cubie = [];

			this.preMoveCubes = [];
			this.preMoves = [];
			this.preMoveLen = 0;
			this.maxPreMoves = 0;

			this.isRec = false;
			for (var i = 0; i < 21; i++) {
				this.nodeUD[i] = new CoordCube();
				this.phase1Cubie[i] = new CubieCube();
			}
			for (var i = 0; i < 6; i++) {
				this.urfCubieCube[i] = new CubieCube();
				this.urfCoordCube[i] = new CoordCube();
			}
			for (var i = 0; i < MAX_PRE_MOVES; i++) {
				this.preMoveCubes[i + 1] = new CubieCube();
			}
		}

		var Ux1 = 0;
		var Ux2 = 1;
		var Ux3 = 2;
		var Rx1 = 3;
		var Rx2 = 4;
		var Rx3 = 5;
		var Fx1 = 6;
		var Fx2 = 7;
		var Fx3 = 8;
		var Dx1 = 9;
		var Dx2 = 10;
		var Dx3 = 11;
		var Lx1 = 12;
		var Lx2 = 13;
		var Lx3 = 14;
		var Bx1 = 15;
		var Bx2 = 16;
		var Bx3 = 17;

		var N_MOVES = 18;
		var N_MOVES2 = 10;
		var N_FLIP = 2048;
		var N_FLIP_SYM = 336;
		var N_TWIST = 2187;
		var N_TWIST_SYM = 324;
		var N_PERM = 40320;
		var N_PERM_SYM = 2768;
		var N_MPERM = 24;
		var N_SLICE = 495;
		var N_COMB = USE_COMBP_PRUN ? 140 : 70;
		var P2_PARITY_MOVE = USE_COMBP_PRUN ? 0xA5 : 0;

		var SYM_E2C_MAGIC = 0x00DDDD00;
		var Cnk = [];
		var fact = [1];
		var move2str = [
			"F", "R", "L", "C", "O", "I", "A", "M", "G",
			"E", "Q", "K", "D", "P", "J", "B", "N", "H"
		];
		// original
		// var move2str = [
		// 	"U ", "U2", "U'", "R ", "R2", "R'", "F ", "F2", "F'",
		// 	"D ", "D2", "D'", "L ", "L2", "L'", "B ", "B2", "B'"
		// ];
		var ud2std = [Ux1, Ux2, Ux3, Rx2, Fx2, Dx1, Dx2, Dx3, Lx2, Bx2, Rx1, Rx3, Fx1, Fx3, Lx1, Lx3, Bx1, Bx3];
		var std2ud = [];
		var ckmv2bit = [];
		var urfMove = [
			[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
			[6, 7, 8, 0, 1, 2, 3, 4, 5, 15, 16, 17, 9, 10, 11, 12, 13, 14],
			[3, 4, 5, 6, 7, 8, 0, 1, 2, 12, 13, 14, 15, 16, 17, 9, 10, 11],
			[2, 1, 0, 5, 4, 3, 8, 7, 6, 11, 10, 9, 14, 13, 12, 17, 16, 15],
			[8, 7, 6, 2, 1, 0, 5, 4, 3, 17, 16, 15, 11, 10, 9, 14, 13, 12],
			[5, 4, 3, 8, 7, 6, 2, 1, 0, 14, 13, 12, 17, 16, 15, 11, 10, 9]
		];

		{ // init util
			for (var i = 0; i < 18; i++) {
				std2ud[ud2std[i]] = i;
			}
			for (var i = 0; i < 10; i++) {
				var ix = ~~(ud2std[i] / 3);
				ckmv2bit[i] = 0;
				for (var j = 0; j < 10; j++) {
					var jx = ~~(ud2std[j] / 3);
					ckmv2bit[i] |= ((ix == jx) || ((ix % 3 == jx % 3) && (ix >= jx)) ? 1 : 0) << j;
				}
			}
			ckmv2bit[10] = 0;
			for (var i = 0; i < 13; i++) {
				Cnk[i] = [];
				fact[i + 1] = fact[i] * (i + 1);
				Cnk[i][0] = Cnk[i][i] = 1;
				for (var j = 1; j < 13; j++) {
					Cnk[i][j] = j <= i ? Cnk[i - 1][j - 1] + Cnk[i - 1][j] : 0;
				}
			}
		}

		function setVal(val0, val, isEdge) {
			return isEdge ? (val << 1 | val0 & 1) : (val | val0 & 0xf8);
		}

		function getVal(val0, isEdge) {
			return isEdge ? val0 >> 1 : val0 & 7;
		}

		function setPruning(table, index, value) {
			table[index >> 3] ^= value << (index << 2); // index << 2 <=> (index & 7) << 2
		}

		function getPruning(table, index) {
			return table[index >> 3] >> (index << 2) & 0xf; // index << 2 <=> (index & 7) << 2
		}

		function getPruningMax(maxValue, table, index) {
			return Math.min(maxValue, table[index >> 3] >> (index << 2) & 0xf);
		}

		function hasZero(val) {
			return ((val - 0x11111111) & ~val & 0x88888888) != 0;
		}

		function ESym2CSym(idx) {
			return idx ^ (SYM_E2C_MAGIC >> ((idx & 0xf) << 1) & 3);
		}

		function getPermSymInv(idx, sym, isCorner) {
			var idxi = PermInvEdgeSym[idx];
			if (isCorner) {
				idxi = ESym2CSym(idxi);
			}
			return idxi & 0xfff0 | SymMult[idxi & 0xf][sym];
		}

		function CubieCube() {
			this.ca = [0, 1, 2, 3, 4, 5, 6, 7];
			this.ea = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
		}

		function setNPerm(arr, idx, n, isEdge) {
			n--;
			var val = 0x76543210;
			for (var i = 0; i < n; ++i) {
				var p = fact[n - i];
				var v = ~~(idx / p);
				idx %= p;
				v <<= 2;
				arr[i] = setVal(arr[i], val >> v & 0xf, isEdge);
				var m = (1 << v) - 1;
				val = (val & m) + (val >> 4 & ~m);
			}
			arr[n] = setVal(arr[n], val & 0xf, isEdge);
		}

		function getNPerm(arr, n, isEdge) {
			var idx = 0,
				val = 0x76543210;
			for (var i = 0; i < n - 1; ++i) {
				var v = getVal(arr[i], isEdge) << 2;
				idx = (n - i) * idx + (val >> v & 0xf);
				val -= 0x11111110 << v;
			}
			return idx;
		}

		function setNPermFull(arr, idx, n, isEdge) {
			arr[n - 1] = setVal(arr[n - 1], 0, isEdge);
			for (var i = n - 2; i >= 0; --i) {
				arr[i] = setVal(arr[i], idx % (n - i), isEdge);
				idx = ~~(idx / (n - i));
				for (var j = i + 1; j < n; ++j) {
					if (getVal(arr[j], isEdge) >= getVal(arr[i], isEdge)) {
						arr[j] = setVal(arr[j], getVal(arr[j], isEdge) + 1, isEdge);
					}
				}
			}
		}

		function getNPermFull(arr, n, isEdge) {
			var idx = 0;
			for (var i = 0; i < n; ++i) {
				idx *= n - i;
				for (var j = i + 1; j < n; ++j) {
					if (getVal(arr[j], isEdge) < getVal(arr[i], isEdge)) {
						++idx;
					}
				}
			}
			return idx;
		}

		function getComb(arr, mask, isEdge) {
			var end = arr.length - 1;
			var idxC = 0,
				r = 4;
			for (var i = end; i >= 0; i--) {
				var perm = getVal(arr[i], isEdge);
				if ((perm & 0xc) == mask) {
					idxC += Cnk[i][r--];
				}
			}
			return idxC;
		}

		function setComb(arr, idxC, mask, isEdge) {
			var end = arr.length - 1;
			var r = 4,
				fill = end;
			for (var i = end; i >= 0; i--) {
				if (idxC >= Cnk[i][r]) {
					idxC -= Cnk[i][r--];
					arr[i] = setVal(arr[i], r | mask, isEdge);
				} else {
					if ((fill & 0xc) == mask) {
						fill -= 4;
					}
					arr[i] = setVal(arr[i], fill--, isEdge);
				}
			}
		}

		function getNParity(idx, n) {
			var p = 0;
			for (var i = n - 2; i >= 0; i--) {
				p ^= idx % (n - i);
				idx = ~~(idx / (n - i));
			}
			return p & 1;
		}
		CubieCube.EdgeMult = function (a, b, prod) {
			for (var ed = 0; ed < 12; ed++) {
				prod.ea[ed] = a.ea[b.ea[ed] >> 1] ^ (b.ea[ed] & 1);
			}
		}
		CubieCube.CornMult = function (a, b, prod) {
			for (var corn = 0; corn < 8; corn++) {
				var ori = ((a.ca[b.ca[corn] & 7] >> 3) + (b.ca[corn] >> 3)) % 3;
				prod.ca[corn] = a.ca[b.ca[corn] & 7] & 7 | ori << 3;
			}
		}
		CubieCube.CornMultFull = function (a, b, prod) {
			for (var corn = 0; corn < 8; corn++) {
				var oriA = a.ca[b.ca[corn] & 7] >> 3;
				var oriB = b.ca[corn] >> 3;
				var ori = oriA + ((oriA < 3) ? oriB : 6 - oriB);
				ori = ori % 3 + ((oriA < 3) == (oriB < 3) ? 0 : 3);
				prod.ca[corn] = a.ca[b.ca[corn] & 7] & 7 | ori << 3;
			}
		}
		CubieCube.CornConjugate = function (a, idx, b) {
			var sinv = SymCube[SymMultInv[0][idx]];
			var s = SymCube[idx];
			for (var corn = 0; corn < 8; corn++) {
				var oriA = sinv.ca[a.ca[s.ca[corn] & 7] & 7] >> 3;
				var oriB = a.ca[s.ca[corn] & 7] >> 3;
				var ori = (oriA < 3) ? oriB : (3 - oriB) % 3;
				b.ca[corn] = sinv.ca[a.ca[s.ca[corn] & 7] & 7] & 7 | ori << 3;
			}
		}
		CubieCube.EdgeConjugate = function (a, idx, b) {
			var sinv = SymCube[SymMultInv[0][idx]];
			var s = SymCube[idx];
			for (var ed = 0; ed < 12; ed++) {
				b.ea[ed] = sinv.ea[a.ea[s.ea[ed] >> 1] >> 1] ^ (a.ea[s.ea[ed] >> 1] & 1) ^ (s.ea[ed] & 1);
			}
		}
		CubieCube.prototype.init = function (ca, ea) {
			this.ca = ca.slice();
			this.ea = ea.slice();
			return this;
		}
		CubieCube.prototype.initCoord = function (cperm, twist, eperm, flip) {
			setNPerm(this.ca, cperm, 8, false);
			this.setTwist(twist);
			setNPermFull(this.ea, eperm, 12, true);
			this.setFlip(flip);
			return this;
		}
		CubieCube.prototype.isEqual = function (c) {
			for (var i = 0; i < 8; i++) {
				if (this.ca[i] != c.ca[i]) {
					return false;
				}
			}
			for (var i = 0; i < 12; i++) {
				if (this.ea[i] != c.ea[i]) {
					return false;
				}
			}
			return true;
		}
		CubieCube.prototype.setFlip = function (idx) {
			var parity = 0,
				val;
			for (var i = 10; i >= 0; i--, idx >>= 1) {
				parity ^= (val = idx & 1);
				this.ea[i] = this.ea[i] & 0xfe | val;
			}
			this.ea[11] = this.ea[11] & 0xfe | parity;
		}
		CubieCube.prototype.getFlip = function () {
			var idx = 0;
			for (var i = 0; i < 11; i++) {
				idx = idx << 1 | this.ea[i] & 1;
			}
			return idx;
		}
		CubieCube.prototype.getFlipSym = function () {
			return FlipR2S[this.getFlip()];
		}
		CubieCube.prototype.setTwist = function (idx) {
			var twst = 15,
				val;
			for (var i = 6; i >= 0; i--, idx = ~~(idx / 3)) {
				twst -= (val = idx % 3);
				this.ca[i] = this.ca[i] & 0x7 | val << 3;
			}
			this.ca[7] = this.ca[7] & 0x7 | (twst % 3) << 3;
		}
		CubieCube.prototype.getTwist = function () {
			var idx = 0;
			for (var i = 0; i < 7; i++) {
				idx += (idx << 1) + (this.ca[i] >> 3);
			}
			return idx;
		}
		CubieCube.prototype.getTwistSym = function () {
			return TwistR2S[this.getTwist()];

		}
		CubieCube.prototype.setCPerm = function (idx) {
			setNPerm(this.ca, idx, 8, false);
		}
		CubieCube.prototype.getCPerm = function () {
			return getNPerm(this.ca, 8, false);
		}
		CubieCube.prototype.getCPermSym = function () {
			return ESym2CSym(EPermR2S[getNPerm(this.ca, 8, false)]);
		}
		CubieCube.prototype.setEPerm = function (idx) {
			setNPerm(this.ea, idx, 8, true);
		}
		CubieCube.prototype.getEPerm = function () {
			return getNPerm(this.ea, 8, true);
		}
		CubieCube.prototype.getEPermSym = function () {
			return EPermR2S[getNPerm(this.ea, 8, true)];
		}
		CubieCube.prototype.getUDSlice = function () {
			return 494 - getComb(this.ea, 8, true);
		}
		CubieCube.prototype.setUDSlice = function (idx) {
			setComb(this.ea, 494 - idx, 8, true);
		}
		CubieCube.prototype.getMPerm = function () {
			return getNPermFull(this.ea, 12, true) % 24;
		}
		CubieCube.prototype.setMPerm = function (idx) {
			setNPermFull(this.ea, idx, 12, true);
		}
		CubieCube.prototype.getCComb = function () {
			return getComb(this.ca, 0, false);
		}
		CubieCube.prototype.setCComb = function (idx) {
			setComb(this.ca, idx, 0, false);
		}
		CubieCube.prototype.URFConjugate = function () {
			var temps = new CubieCube();
			CubieCube.CornMult(CubieCube.urf2, this, temps);
			CubieCube.CornMult(temps, CubieCube.urf1, this);
			CubieCube.EdgeMult(CubieCube.urf2, this, temps);
			CubieCube.EdgeMult(temps, CubieCube.urf1, this);
		}
		var cornerFacelet = [
			[8, 9, 20],
			[6, 18, 38],
			[0, 36, 47],
			[2, 45, 11],
			[29, 26, 15],
			[27, 44, 24],
			[33, 53, 42],
			[35, 17, 51]
		];
		var edgeFacelet = [
			[5, 10],
			[7, 19],
			[3, 37],
			[1, 46],
			[32, 16],
			[28, 25],
			[30, 43],
			[34, 52],
			[23, 12],
			[21, 41],
			[50, 39],
			[48, 14]
		];
		CubieCube.prototype.toFaceCube = function (cFacelet, eFacelet) {
			cFacelet = cFacelet || cornerFacelet;
			eFacelet = eFacelet || edgeFacelet;
			var ts = "URFDLB";
			var f = [];
			for (var i = 0; i < 54; i++) {
				f[i] = ts[~~(i / 9)];
			}
			for (var c = 0; c < 8; c++) {
				var j = this.ca[c] & 0x7; // cornercubie with index j is at
				var ori = this.ca[c] >> 3; // Orientation of this cubie
				for (var n = 0; n < 3; n++)
					f[cFacelet[c][(n + ori) % 3]] = ts[~~(cFacelet[j][n] / 9)];
			}
			for (var e = 0; e < 12; e++) {
				var j = this.ea[e] >> 1; // edgecubie with index j is at edgeposition
				var ori = this.ea[e] & 1; // Orientation of this cubie
				for (var n = 0; n < 2; n++)
					f[eFacelet[e][(n + ori) % 2]] = ts[~~(eFacelet[j][n] / 9)];
			}
			return f.join("");
		}
		CubieCube.prototype.invFrom = function (cc) {
			for (var edge = 0; edge < 12; edge++) {
				this.ea[cc.ea[edge] >> 1] = edge << 1 | cc.ea[edge] & 1;
			}
			for (var corn = 0; corn < 8; corn++) {
				this.ca[cc.ca[corn] & 0x7] = corn | 0x20 >> (cc.ca[corn] >> 3) & 0x18;
			}
			return this;
		}
		CubieCube.prototype.fromFacelet = function (facelet, cFacelet, eFacelet) {
			cFacelet = cFacelet || cornerFacelet;
			eFacelet = eFacelet || edgeFacelet;
			var count = 0;
			var f = [];
			var centers = facelet[4] + facelet[13] + facelet[22] + facelet[31] + facelet[40] + facelet[49];
			for (var i = 0; i < 54; ++i) {
				f[i] = centers.indexOf(facelet[i]);
				if (f[i] == -1) {
					return -1;
				}
				count += 1 << (f[i] << 2);
			}
			if (count != 0x999999) {
				return -1;
			}
			var col1, col2, i, j, ori;
			for (i = 0; i < 8; ++i) {
				for (ori = 0; ori < 3; ++ori)
					if (f[cFacelet[i][ori]] == 0 || f[cFacelet[i][ori]] == 3)
						break;
				col1 = f[cFacelet[i][(ori + 1) % 3]];
				col2 = f[cFacelet[i][(ori + 2) % 3]];
				for (j = 0; j < 8; ++j) {
					if (col1 == ~~(cFacelet[j][1] / 9) && col2 == ~~(cFacelet[j][2] / 9)) {
						this.ca[i] = j | ori % 3 << 3;
						break;
					}
				}
			}
			for (i = 0; i < 12; ++i) {
				for (j = 0; j < 12; ++j) {
					if (f[eFacelet[i][0]] == ~~(eFacelet[j][0] / 9) && f[eFacelet[i][1]] == ~~(eFacelet[j][1] / 9)) {
						this.ea[i] = j << 1;
						break;
					}
					if (f[eFacelet[i][0]] == ~~(eFacelet[j][1] / 9) && f[eFacelet[i][1]] == ~~(eFacelet[j][0] / 9)) {
						this.ea[i] = j << 1 | 1;
						break;
					}
				}
			}
		}

		function CoordCube() {
			this.twist = 0;
			this.tsym = 0;
			this.flip = 0;
			this.fsym = 0;
			this.slice = 0;
			this.prun = 0;
			this.twistc = 0;
			this.flipc = 0;
		}
		CoordCube.prototype.set = function (node) {
			this.twist = node.twist;
			this.tsym = node.tsym;
			this.flip = node.flip;
			this.fsym = node.fsym;
			this.slice = node.slice;
			this.prun = node.prun;
			if (USE_CONJ_PRUN) {
				this.twistc = node.twistc;
				this.flipc = node.flipc;
			}
		}
		CoordCube.prototype.calcPruning = function (isPhase1) {
			this.prun = Math.max(
				Math.max(
					getPruningMax(UDSliceTwistPrunMax, UDSliceTwistPrun,
						this.twist * N_SLICE + UDSliceConj[this.slice][this.tsym]),
					getPruningMax(UDSliceFlipPrunMax, UDSliceFlipPrun,
						this.flip * N_SLICE + UDSliceConj[this.slice][this.fsym])),
				Math.max(
					USE_CONJ_PRUN ? getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
						(this.twistc >> 3) << 11 | FlipS2RF[this.flipc ^ (this.twistc & 7)]) : 0,
					USE_TWIST_FLIP_PRUN ? getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
						this.twist << 11 | FlipS2RF[this.flip << 3 | (this.fsym ^ this.tsym)]) : 0));
		}
		CoordCube.prototype.setWithPrun = function (cc, depth) {
			this.twist = cc.getTwistSym();
			this.flip = cc.getFlipSym();
			this.tsym = this.twist & 7;
			this.twist = this.twist >> 3;
			this.prun = USE_TWIST_FLIP_PRUN ? getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
				this.twist << 11 | FlipS2RF[this.flip ^ this.tsym]) : 0;
			if (this.prun > depth) {
				return false;
			}
			this.fsym = this.flip & 7;
			this.flip = this.flip >> 3;
			this.slice = cc.getUDSlice();
			this.prun = Math.max(this.prun, Math.max(
				getPruningMax(UDSliceTwistPrunMax, UDSliceTwistPrun,
					this.twist * N_SLICE + UDSliceConj[this.slice][this.tsym]),
				getPruningMax(UDSliceFlipPrunMax, UDSliceFlipPrun,
					this.flip * N_SLICE + UDSliceConj[this.slice][this.fsym])));
			if (this.prun > depth) {
				return false;
			}
			if (USE_CONJ_PRUN) {
				var pc = new CubieCube();
				CubieCube.CornConjugate(cc, 1, pc);
				CubieCube.EdgeConjugate(cc, 1, pc);
				this.twistc = pc.getTwistSym();
				this.flipc = pc.getFlipSym();
				this.prun = Math.max(this.prun,
					getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
						(this.twistc >> 3) << 11 | FlipS2RF[this.flipc ^ (this.twistc & 7)]));
			}
			return this.prun <= depth;
		}
		CoordCube.prototype.doMovePrun = function (cc, m, isPhase1) {
			this.slice = UDSliceMove[cc.slice][m];
			this.flip = FlipMove[cc.flip][Sym8Move[m << 3 | cc.fsym]];
			this.fsym = (this.flip & 7) ^ cc.fsym;
			this.flip >>= 3;
			this.twist = TwistMove[cc.twist][Sym8Move[m << 3 | cc.tsym]];
			this.tsym = (this.twist & 7) ^ cc.tsym;
			this.twist >>= 3;
			this.prun = Math.max(
				Math.max(
					getPruningMax(UDSliceTwistPrunMax, UDSliceTwistPrun,
						this.twist * N_SLICE + UDSliceConj[this.slice][this.tsym]),
					getPruningMax(UDSliceFlipPrunMax, UDSliceFlipPrun,
						this.flip * N_SLICE + UDSliceConj[this.slice][this.fsym])),
				USE_TWIST_FLIP_PRUN ? getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
					this.twist << 11 | FlipS2RF[this.flip << 3 | (this.fsym ^ this.tsym)]) : 0);
			return this.prun;
		}
		CoordCube.prototype.doMovePrunConj = function (cc, m) {
			m = SymMove[3][m];
			this.flipc = FlipMove[cc.flipc >> 3][Sym8Move[m << 3 | cc.flipc & 7]] ^ (cc.flipc & 7);
			this.twistc = TwistMove[cc.twistc >> 3][Sym8Move[m << 3 | cc.twistc & 7]] ^ (cc.twistc & 7);
			return getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
				(this.twistc >> 3) << 11 | FlipS2RF[this.flipc ^ (this.twistc & 7)]);
		}
		Search.prototype.solution = function (facelets, maxDepth, probeMax, probeMin, verbose) {
			initPrunTables();
			var check = this.verify(facelets);
			if (check != 0) {
				return "Error " + Math.abs(check);
			}
			if (maxDepth === undefined) {
				maxDepth = 21;
			}
			if (probeMax === undefined) {
				probeMax = 1e9;
			}
			if (probeMin === undefined) {
				probeMin = 0;
			}
			if (verbose === undefined) {
				verbose = 0;
			}
			this.sol = maxDepth + 1;
			this.probe = 0;
			this.probeMax = probeMax;
			this.probeMin = Math.min(probeMin, probeMax);
			this.verbose = verbose;
			this.moveSol = null;
			this.isRec = false;
			this.initSearch();
			return this.search();
		}

		Search.prototype.initSearch = function () {
			this.conjMask = (TRY_INVERSE ? 0 : 0x38) | (TRY_THREE_AXES ? 0 : 0x36);
			this.maxPreMoves = this.conjMask > 7 ? 0 : MAX_PRE_MOVES;

			for (var i = 0; i < 6; i++) {
				this.urfCubieCube[i].init(this.cc.ca, this.cc.ea);
				this.urfCoordCube[i].setWithPrun(this.urfCubieCube[i], 20);
				this.cc.URFConjugate();
				if (i % 3 == 2) {
					var tmp = new CubieCube().invFrom(this.cc);
					this.cc.init(tmp.ca, tmp.ea);
				}
			}
		}

		Search.prototype.next = function (probeMax, probeMin, verbose) {
			if (probeMax === undefined) {
				probeMax = 1e9;
			}
			if (probeMin === undefined) {
				probeMin = 0;
			}
			if (verbose === undefined) {
				verbose = 0;
			}
			this.probe = 0;
			this.probeMax = probeMax;
			this.probeMin = Math.min(probeMin, probeMax);
			this.moveSol = null;
			this.isRec = true;
			this.verbose = verbose;
			return this.search();
		}

		Search.prototype.verify = function (facelets) {
			if (this.cc.fromFacelet(facelets) == -1) {
				return -1;
			}
			var sum = 0;
			var edgeMask = 0;
			for (var e = 0; e < 12; e++) {
				edgeMask |= 1 << (this.cc.ea[e] >> 1);
				sum ^= this.cc.ea[e] & 1;
			}
			if (edgeMask != 0xfff) {
				return -2; // missing edges
			}
			if (sum != 0) {
				return -3;
			}
			var cornMask = 0;
			sum = 0;
			for (var c = 0; c < 8; c++) {
				cornMask |= 1 << (this.cc.ca[c] & 7);
				sum += this.cc.ca[c] >> 3;
			}
			if (cornMask != 0xff) {
				return -4; // missing corners
			}
			if (sum % 3 != 0) {
				return -5; // twisted corner
			}
			if ((getNParity(getNPermFull(this.cc.ea, 12, true), 12) ^ getNParity(this.cc.getCPerm(), 8)) != 0) {
				return -6; // parity error
			}
			return 0; // cube ok
		}

		Search.prototype.phase1PreMoves = function (maxl, lm, cc) {
			this.preMoveLen = this.maxPreMoves - maxl;
			if (this.isRec ? (this.depth1 == this.length1 - this.preMoveLen) :
				(this.preMoveLen == 0 || (0x36FB7 >> lm & 1) == 0)) {
				this.depth1 = this.length1 - this.preMoveLen;
				this.phase1Cubie[0].init(cc.ca, cc.ea) /* = cc*/;
				this.allowShorter = this.depth1 == MIN_P1LENGTH_PRE && this.preMoveLen != 0;

				if (this.nodeUD[this.depth1 + 1].setWithPrun(cc, this.depth1) &&
					this.phase1(this.nodeUD[this.depth1 + 1], this.depth1, -1) == 0) {
					return 0;
				}
			}

			if (maxl == 0 || this.preMoveLen + MIN_P1LENGTH_PRE >= this.length1) {
				return 1;
			}

			var skipMoves = 0;
			if (maxl == 1 || this.preMoveLen + 1 + MIN_P1LENGTH_PRE >= this.length1) { //last pre move
				skipMoves |= 0x36FB7; // 11 0110 1111 1011 0111
			}

			lm = ~~(lm / 3) * 3;
			for (var m = 0; m < 18; m++) {
				if (m == lm || m == lm - 9 || m == lm + 9) {
					m += 2;
					continue;
				}
				if (this.isRec && m != this.preMoves[this.maxPreMoves - maxl] || (skipMoves & 1 << m) != 0) {
					continue;
				}
				CubieCube.CornMult(moveCube[m], cc, this.preMoveCubes[maxl]);
				CubieCube.EdgeMult(moveCube[m], cc, this.preMoveCubes[maxl]);
				this.preMoves[this.maxPreMoves - maxl] = m;
				var ret = this.phase1PreMoves(maxl - 1, m, this.preMoveCubes[maxl]);
				if (ret == 0) {
					return 0;
				}
			}
			return 1;
		}

		Search.prototype.search = function () {
			for (this.length1 = this.isRec ? this.length1 : 0; this.length1 < this.sol; this.length1++) {
				for (this.urfIdx = this.isRec ? this.urfIdx : 0; this.urfIdx < 6; this.urfIdx++) {
					if ((this.conjMask & 1 << this.urfIdx) != 0) {
						continue;
					}
					if (this.phase1PreMoves(this.maxPreMoves, -30, this.urfCubieCube[this.urfIdx], 0) == 0) {
						return this.moveSol == null ? "Error 8" : this.moveSol;
					}
				}
			}
			return this.moveSol == null ? "Error 7" : this.moveSol;
		}

		Search.prototype.initPhase2Pre = function () {
			this.isRec = false;
			if (this.probe >= (this.moveSol == null ? this.probeMax : this.probeMin)) {
				return 0;
			}
			++this.probe;

			for (var i = this.valid1; i < this.depth1; i++) {
				CubieCube.CornMult(this.phase1Cubie[i], moveCube[this.move[i]], this.phase1Cubie[i + 1]);
				CubieCube.EdgeMult(this.phase1Cubie[i], moveCube[this.move[i]], this.phase1Cubie[i + 1]);
			}
			this.valid1 = this.depth1;

			var ret = this.initPhase2(this.phase1Cubie[this.depth1]);
			if (ret == 0 || this.preMoveLen == 0 || ret == 2) {
				return ret;
			}

			var m = ~~(this.preMoves[this.preMoveLen - 1] / 3) * 3 + 1;
			CubieCube.CornMult(moveCube[m], this.phase1Cubie[this.depth1], this.phase1Cubie[this.depth1 + 1]);
			CubieCube.EdgeMult(moveCube[m], this.phase1Cubie[this.depth1], this.phase1Cubie[this.depth1 + 1]);

			this.preMoves[this.preMoveLen - 1] += 2 - this.preMoves[this.preMoveLen - 1] % 3 * 2;
			ret = this.initPhase2(this.phase1Cubie[this.depth1 + 1]);
			this.preMoves[this.preMoveLen - 1] += 2 - this.preMoves[this.preMoveLen - 1] % 3 * 2;
			return ret;
		}
		Search.prototype.initPhase2 = function (phase2Cubie) {
			var p2corn = phase2Cubie.getCPermSym();
			var p2csym = p2corn & 0xf;
			p2corn >>= 4;
			var p2edge = phase2Cubie.getEPermSym();
			var p2esym = p2edge & 0xf;
			p2edge >>= 4;
			var p2mid = phase2Cubie.getMPerm();
			var p2edgei = getPermSymInv(p2edge, p2esym, false);
			var p2corni = getPermSymInv(p2corn, p2csym, true);
			var prun = Math.max(
				getPruningMax(MCPermPrunMax, MCPermPrun,
					p2corn * N_MPERM + MPermConj[p2mid][p2csym]),
				getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun,
					p2edge * N_COMB + CCombPConj[Perm2CombP[p2corn] & 0xff][SymMultInv[p2esym][p2csym]]),
				getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun,
					(p2edgei >> 4) * N_COMB + CCombPConj[Perm2CombP[p2corni >> 4] & 0xff][SymMultInv[p2edgei & 0xf][p2corni & 0xf]])
			);
			var maxDep2 = Math.min(MAX_DEPTH2, this.sol - this.length1);
			if (prun >= maxDep2) {
				return prun > maxDep2 ? 2 : 1;
			}
			var depth2;
			for (depth2 = maxDep2 - 1; depth2 >= prun; depth2--) {
				var ret = this.phase2(p2edge, p2esym, p2corn, p2csym, p2mid, depth2, this.depth1, 10);
				if (ret < 0) {
					break;
				}
				depth2 -= ret;
				this.moveSol = [];
				for (var i = 0; i < this.depth1 + depth2; i++) {
					this.appendSolMove(this.move[i]);
				}
				for (var i = this.preMoveLen - 1; i >= 0; i--) {
					this.appendSolMove(this.preMoves[i]);
				}
				this.sol = this.moveSol.length;
				this.moveSol = this.solutionToString();
			}
			if (depth2 != maxDep2 - 1) { //At least one solution has been found.
				return this.probe >= this.probeMin ? 0 : 1;
			} else {
				return 1;
			}
		}
		Search.prototype.phase1 = function (node, maxl, lm) {
			if (node.prun == 0 && maxl < 5) {
				if (this.allowShorter || maxl == 0) {
					this.depth1 -= maxl;
					var ret = this.initPhase2Pre();
					this.depth1 += maxl;
					return ret;
				} else {
					return 1;
				}
			}
			for (var axis = 0; axis < 18; axis += 3) {
				if (axis == lm || axis == lm - 9) {
					continue;
				}
				for (var power = 0; power < 3; power++) {
					var m = axis + power;

					if (this.isRec && m != this.move[this.depth1 - maxl]) {
						continue;
					}

					var prun = this.nodeUD[maxl].doMovePrun(node, m, true);
					if (prun > maxl) {
						break;
					} else if (prun == maxl) {
						continue;
					}

					if (USE_CONJ_PRUN) {
						prun = this.nodeUD[maxl].doMovePrunConj(node, m);
						if (prun > maxl) {
							break;
						} else if (prun == maxl) {
							continue;
						}
					}
					this.move[this.depth1 - maxl] = m;
					this.valid1 = Math.min(this.valid1, this.depth1 - maxl);
					var ret = this.phase1(this.nodeUD[maxl], maxl - 1, axis);
					if (ret == 0) {
						return 0;
					} else if (ret == 2) {
						break;
					}
				}
			}
			return 1;
		}
		Search.prototype.appendSolMove = function (curMove) {
			if (this.moveSol.length == 0) {
				this.moveSol.push(curMove);
				return;
			}
			var axisCur = ~~(curMove / 3);
			var axisLast = ~~(this.moveSol[this.moveSol.length - 1] / 3);
			if (axisCur == axisLast) {
				var pow = (curMove % 3 + this.moveSol[this.moveSol.length - 1] % 3 + 1) % 4;
				if (pow == 3) {
					this.moveSol.pop();
				} else {
					this.moveSol[this.moveSol.length - 1] = axisCur * 3 + pow;
				}
				return;
			}
			if (this.moveSol.length > 1 &&
				axisCur % 3 == axisLast % 3 &&
				axisCur == ~~(this.moveSol[this.moveSol.length - 2] / 3)) {
				var pow = (curMove % 3 + this.moveSol[this.moveSol.length - 2] % 3 + 1) % 4;
				if (pow == 3) {
					this.moveSol[this.moveSol.length - 2] = this.moveSol[this.moveSol.length - 1];
					this.moveSol.pop();
				} else {
					this.moveSol[this.moveSol.length - 2] = axisCur * 3 + pow;
				}
				return;
			}
			this.moveSol.push(curMove);
		}
		Search.prototype.phase2 = function (edge, esym, corn, csym, mid, maxl, depth, lm) {
			if (edge == 0 && corn == 0 && mid == 0) {
				return maxl;
			}
			var moveMask = ckmv2bit[lm];
			for (var m = 0; m < 10; m++) {
				if ((moveMask >> m & 1) != 0) {
					m += 0x42 >> m & 3;
					continue;
				}
				var midx = MPermMove[mid][m];
				var cornx = CPermMove[corn][SymMoveUD[csym][m]];
				var csymx = SymMult[cornx & 0xf][csym];
				cornx >>= 4;
				var edgex = EPermMove[edge][SymMoveUD[esym][m]];
				var esymx = SymMult[edgex & 0xf][esym];
				edgex >>= 4;
				var edgei = getPermSymInv(edgex, esymx, false);
				var corni = getPermSymInv(cornx, csymx, true);
				var prun = getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun,
					(edgei >> 4) * N_COMB + CCombPConj[Perm2CombP[corni >> 4] & 0xff][SymMultInv[edgei & 0xf][corni & 0xf]]);
				if (prun > maxl + 1) {
					break;
				} else if (prun >= maxl) {
					m += 0x42 >> m & 3 & (maxl - prun);
					continue;
				}
				prun = Math.max(
					getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun,
						edgex * N_COMB + CCombPConj[Perm2CombP[cornx] & 0xff][SymMultInv[esymx][csymx]]),
					getPruningMax(MCPermPrunMax, MCPermPrun,
						cornx * N_MPERM + MPermConj[midx][csymx])
				);
				if (prun >= maxl) {
					m += 0x42 >> m & 3 & (maxl - prun);
					continue;
				}
				var ret = this.phase2(edgex, esymx, cornx, csymx, midx, maxl - 1, depth + 1, m);
				if (ret >= 0) {
					this.move[depth] = ud2std[m];
					return ret;
				}
			}
			return -1;
		}
		Search.prototype.solutionToString = function () {
			var sb = '';
			var urf = (this.verbose & INVERSE_SOLUTION) != 0 ? (this.urfIdx + 3) % 6 : this.urfIdx;
			if (urf < 3) {
				for (var s = 0; s < this.moveSol.length; ++s) {
					sb += move2str[urfMove[urf][this.moveSol[s]]];
				}
			} else {
				for (var s = this.moveSol.length - 1; s >= 0; --s) {
					sb += move2str[urfMove[urf][this.moveSol[s]]];
				}
			}
			return sb;
		}

		var moveCube = [];
		var SymCube = [];
		var SymMult = [];
		var SymMultInv = [];
		var SymMove = [];
		var SymMoveUD = [];
		var Sym8Move = [];
		var FlipS2R = [];
		var FlipR2S = [];
		var TwistS2R = [];
		var TwistR2S = [];
		var EPermS2R = [];
		var EPermR2S = [];
		var SymStateFlip = [];
		var SymStateTwist = [];
		var SymStatePerm = [];
		var FlipS2RF = [];
		var Perm2CombP = [];
		var PermInvEdgeSym = [];
		var UDSliceMove = [];
		var TwistMove = [];
		var FlipMove = [];
		var UDSliceConj = [];
		var UDSliceTwistPrun = [];
		var UDSliceFlipPrun = [];
		var TwistFlipPrun = [];

		//phase2
		var CPermMove = [];
		var EPermMove = [];
		var MPermMove = [];
		var MPermConj = [];
		var CCombPMove = []; // = new char[N_COMB][N_MOVES2];
		var CCombPConj = [];
		var MCPermPrun = [];
		var EPermCCombPPrun = [];

		var TwistFlipPrunMax = 15;
		var UDSliceTwistPrunMax = 15;
		var UDSliceFlipPrunMax = 15;
		var MCPermPrunMax = 15;
		var EPermCCombPPrunMax = 15;

		{ //init move cubes
			for (var i = 0; i < 18; i++) {
				moveCube[i] = new CubieCube()
			}
			moveCube[0].initCoord(15120, 0, 119750400, 0);
			moveCube[3].initCoord(21021, 1494, 323403417, 0);
			moveCube[6].initCoord(8064, 1236, 29441808, 550);
			moveCube[9].initCoord(9, 0, 5880, 0);
			moveCube[12].initCoord(1230, 412, 2949660, 0);
			moveCube[15].initCoord(224, 137, 328552, 137);
			for (var a = 0; a < 18; a += 3) {
				for (var p = 0; p < 2; p++) {
					CubieCube.EdgeMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
					CubieCube.CornMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
				}
			}
			CubieCube.urf1 = new CubieCube().initCoord(2531, 1373, 67026819, 1367);
			CubieCube.urf2 = new CubieCube().initCoord(2089, 1906, 322752913, 2040);
		}

		function initBasic() {
			{ //init sym cubes
				var c = new CubieCube();
				var d = new CubieCube();
				var t;

				var f2 = new CubieCube().initCoord(28783, 0, 259268407, 0);
				var u4 = new CubieCube().initCoord(15138, 0, 119765538, 7);
				var lr2 = new CubieCube().initCoord(5167, 0, 83473207, 0);
				for (var i = 0; i < 8; i++) {
					lr2.ca[i] |= 3 << 3;
				}
				for (var i = 0; i < 16; i++) {
					SymCube[i] = new CubieCube().init(c.ca, c.ea);
					CubieCube.CornMultFull(c, u4, d);
					CubieCube.EdgeMult(c, u4, d);
					c.init(d.ca, d.ea);
					if (i % 4 == 3) {
						CubieCube.CornMultFull(c, lr2, d);
						CubieCube.EdgeMult(c, lr2, d);
						c.init(d.ca, d.ea);
					}
					if (i % 8 == 7) {
						CubieCube.CornMultFull(c, f2, d);
						CubieCube.EdgeMult(c, f2, d);
						c.init(d.ca, d.ea);
					}
				}
			} { // gen sym tables


				for (var i = 0; i < 16; i++) {
					SymMult[i] = [];
					SymMultInv[i] = [];
					SymMove[i] = [];
					Sym8Move[i] = [];
					SymMoveUD[i] = [];
				}
				for (var i = 0; i < 16; i++) {
					for (var j = 0; j < 16; j++) {
						SymMult[i][j] = i ^ j ^ (0x14ab4 >> j & i << 1 & 2); // SymMult[i][j] = (i ^ j ^ (0x14ab4 >> j & i << 1 & 2)));
						SymMultInv[SymMult[i][j]][j] = i;
					}
				}

				var c = new CubieCube();
				for (var s = 0; s < 16; s++) {
					for (var j = 0; j < 18; j++) {
						CubieCube.CornConjugate(moveCube[j], SymMultInv[0][s], c);
						outloop: for (var m = 0; m < 18; m++) {
							for (var t = 0; t < 8; t++) {
								if (moveCube[m].ca[t] != c.ca[t]) {
									continue outloop;
								}
							}
							SymMove[s][j] = m;
							SymMoveUD[s][std2ud[j]] = std2ud[m];
							break;
						}
						if (s % 2 == 0) {
							Sym8Move[j << 3 | s >> 1] = SymMove[s][j];
						}
					}
				}
			} { // init sym 2 raw tables
				function initSym2Raw(N_RAW, Sym2Raw, Raw2Sym, SymState, coord, setFunc, getFunc) {
					var N_RAW_HALF = (N_RAW + 1) >> 1;
					var c = new CubieCube();
					var d = new CubieCube();
					var count = 0;
					var sym_inc = coord >= 2 ? 1 : 2;
					var conjFunc = coord != 1 ? CubieCube.EdgeConjugate : CubieCube.CornConjugate;

					for (var i = 0; i < N_RAW; i++) {
						if (Raw2Sym[i] !== undefined) {
							continue;
						}
						setFunc.call(c, i);
						for (var s = 0; s < 16; s += sym_inc) {
							conjFunc(c, s, d);
							var idx = getFunc.call(d);
							if (USE_TWIST_FLIP_PRUN && coord == 0) {
								FlipS2RF[count << 3 | s >> 1] = idx;
							}
							if (idx == i) {
								SymState[count] |= 1 << (s / sym_inc);
							}
							Raw2Sym[idx] = (count << 4 | s) / sym_inc;
						}
						Sym2Raw[count++] = i;
					}
					return count;
				}

				initSym2Raw(N_FLIP, FlipS2R, FlipR2S, SymStateFlip, 0, CubieCube.prototype.setFlip, CubieCube.prototype.getFlip);
				initSym2Raw(N_TWIST, TwistS2R, TwistR2S, SymStateTwist, 1, CubieCube.prototype.setTwist, CubieCube.prototype.getTwist);
				initSym2Raw(N_PERM, EPermS2R, EPermR2S, SymStatePerm, 2, CubieCube.prototype.setEPerm, CubieCube.prototype.getEPerm);
				var cc = new CubieCube();
				for (var i = 0; i < N_PERM_SYM; i++) {
					setNPerm(cc.ea, EPermS2R[i], 8, true);
					Perm2CombP[i] = getComb(cc.ea, 0, true) + (USE_COMBP_PRUN ? getNParity(EPermS2R[i], 8) * 70 : 0);
					c.invFrom(cc);
					PermInvEdgeSym[i] = EPermR2S[c.getEPerm()];
				}
			} { // init coord tables

				var c = new CubieCube();
				var d = new CubieCube();

				function initSymMoveTable(moveTable, SymS2R, N_SIZE, N_MOVES, setFunc, getFunc, multFunc, ud2std) {
					for (var i = 0; i < N_SIZE; i++) {
						moveTable[i] = [];
						setFunc.call(c, SymS2R[i]);
						for (var j = 0; j < N_MOVES; j++) {
							multFunc(c, moveCube[ud2std ? ud2std[j] : j], d);
							moveTable[i][j] = getFunc.call(d);
						}
					}
				}

				initSymMoveTable(FlipMove, FlipS2R, N_FLIP_SYM, N_MOVES,
					CubieCube.prototype.setFlip, CubieCube.prototype.getFlipSym, CubieCube.EdgeMult);
				initSymMoveTable(TwistMove, TwistS2R, N_TWIST_SYM, N_MOVES,
					CubieCube.prototype.setTwist, CubieCube.prototype.getTwistSym, CubieCube.CornMult);
				initSymMoveTable(EPermMove, EPermS2R, N_PERM_SYM, N_MOVES2,
					CubieCube.prototype.setEPerm, CubieCube.prototype.getEPermSym, CubieCube.EdgeMult, ud2std);
				initSymMoveTable(CPermMove, EPermS2R, N_PERM_SYM, N_MOVES2,
					CubieCube.prototype.setCPerm, CubieCube.prototype.getCPermSym, CubieCube.CornMult, ud2std);

				for (var i = 0; i < N_SLICE; i++) {
					UDSliceMove[i] = [];
					UDSliceConj[i] = [];
					c.setUDSlice(i);
					for (var j = 0; j < N_MOVES; j++) {
						CubieCube.EdgeMult(c, moveCube[j], d);
						UDSliceMove[i][j] = d.getUDSlice();
					}
					for (var j = 0; j < 16; j += 2) {
						CubieCube.EdgeConjugate(c, SymMultInv[0][j], d);
						UDSliceConj[i][j >> 1] = d.getUDSlice();
					}
				}

				for (var i = 0; i < N_MPERM; i++) {
					MPermMove[i] = [];
					MPermConj[i] = [];
					c.setMPerm(i);
					for (var j = 0; j < N_MOVES2; j++) {
						CubieCube.EdgeMult(c, moveCube[ud2std[j]], d);
						MPermMove[i][j] = d.getMPerm();
					}
					for (var j = 0; j < 16; j++) {
						CubieCube.EdgeConjugate(c, SymMultInv[0][j], d);
						MPermConj[i][j] = d.getMPerm();
					}
				}

				for (var i = 0; i < N_COMB; i++) {
					CCombPMove[i] = [];
					CCombPConj[i] = [];
					c.setCComb(i % 70);
					for (var j = 0; j < N_MOVES2; j++) {
						CubieCube.CornMult(c, moveCube[ud2std[j]], d);
						CCombPMove[i][j] = d.getCComb() + 70 * ((P2_PARITY_MOVE >> j & 1) ^ ~~(i / 70));
					}
					for (var j = 0; j < 16; j++) {
						CubieCube.CornConjugate(c, SymMultInv[0][j], d);
						CCombPConj[i][j] = d.getCComb() + 70 * ~~(i / 70);
					}
				}
			}
		}

		//init pruning tables
		var InitPrunProgress = -1;

		function initRawSymPrun(PrunTable, N_RAW, N_SYM, RawMove, RawConj, SymMove, SymState, PrunFlag) {
			var SYM_SHIFT = PrunFlag & 0xf;
			var SYM_E2C_MAGIC = ((PrunFlag >> 4) & 1) == 1 ? 0x00DDDD00 : 0x00000000;
			var IS_PHASE2 = ((PrunFlag >> 5) & 1) == 1;
			var INV_DEPTH = PrunFlag >> 8 & 0xf;
			var MAX_DEPTH = PrunFlag >> 12 & 0xf;
			var MIN_DEPTH = PrunFlag >> 16 & 0xf;

			var SYM_MASK = (1 << SYM_SHIFT) - 1;
			var ISTFP = RawMove == null;
			var N_SIZE = N_RAW * N_SYM;
			var N_MOVES = IS_PHASE2 ? 10 : 18;
			var NEXT_AXIS_MAGIC = N_MOVES == 10 ? 0x42 : 0x92492;

			var depth = getPruning(PrunTable, N_SIZE) - 1;

			if (depth == -1) {
				for (var i = 0; i < (N_SIZE >> 3) + 1; i++) {
					PrunTable[i] = 0xffffffff;
				}
				setPruning(PrunTable, 0, 0 ^ 0xf);
				depth = 0;
			} else {
				setPruning(PrunTable, N_SIZE, 0xf ^ (depth + 1));
			}

			var SEARCH_DEPTH = PARTIAL_INIT_LEVEL > 0 ?
				Math.min(Math.max(depth + 1, MIN_DEPTH), MAX_DEPTH) : MAX_DEPTH;

			while (depth < SEARCH_DEPTH) {
				var inv = depth > INV_DEPTH;
				var select = inv ? 0xf : depth;
				var selArrMask = select * 0x11111111;
				var check = inv ? depth : 0xf;
				depth++;
				InitPrunProgress++;
				var xorVal = depth ^ 0xf;
				var done = 0;
				var val = 0;
				for (var i = 0; i < N_SIZE; i++, val >>= 4) {
					if ((i & 7) == 0) {
						val = PrunTable[i >> 3];
						if (!hasZero(val ^ selArrMask)) {
							i += 7;
							continue;
						}
					}
					if ((val & 0xf) != select) {
						continue;
					}
					var raw = i % N_RAW;
					var sym = ~~(i / N_RAW);
					var flip = 0,
						fsym = 0;
					if (ISTFP) {
						flip = FlipR2S[raw];
						fsym = flip & 7;
						flip >>= 3;
					}

					for (var m = 0; m < N_MOVES; m++) {
						var symx = SymMove[sym][m];
						var rawx;
						if (ISTFP) {
							rawx = FlipS2RF[
								FlipMove[flip][Sym8Move[m << 3 | fsym]] ^
								fsym ^ (symx & SYM_MASK)];
						} else {
							rawx = RawConj[RawMove[raw][m]][symx & SYM_MASK];
						}
						symx >>= SYM_SHIFT;
						var idx = symx * N_RAW + rawx;
						var prun = getPruning(PrunTable, idx);
						if (prun != check) {
							if (prun < depth - 1) {
								m += NEXT_AXIS_MAGIC >> m & 3;
							}
							continue;
						}
						done++;
						if (inv) {
							setPruning(PrunTable, i, xorVal);
							break;
						}
						setPruning(PrunTable, idx, xorVal);
						for (var j = 1, symState = SymState[symx];
							(symState >>= 1) != 0; j++) {
							if ((symState & 1) != 1) {
								continue;
							}
							var idxx = symx * N_RAW;
							if (ISTFP) {
								idxx += FlipS2RF[FlipR2S[rawx] ^ j];
							} else {
								idxx += RawConj[rawx][j ^ (SYM_E2C_MAGIC >> (j << 1) & 3)];
							}
							if (getPruning(PrunTable, idxx) == check) {
								setPruning(PrunTable, idxx, xorVal);
								done++;
							}
						}
					}
				}
				// console.log(depth, done, InitPrunProgress);
			}
			setPruning(PrunTable, N_SIZE, (depth + 1) ^ 0xf);
			return depth + 1;
		}

		function doInitPrunTables(targetProgress) {
			if (USE_TWIST_FLIP_PRUN) {
				TwistFlipPrunMax = initRawSymPrun(
					TwistFlipPrun, 2048, 324,
					null, null,
					TwistMove, SymStateTwist, 0x19603
				);
			}
			if (InitPrunProgress > targetProgress) {
				return;
			}
			UDSliceTwistPrunMax = initRawSymPrun(
				UDSliceTwistPrun, 495, 324,
				UDSliceMove, UDSliceConj,
				TwistMove, SymStateTwist, 0x69603
			);
			if (InitPrunProgress > targetProgress) {
				return;
			}
			UDSliceFlipPrunMax = initRawSymPrun(
				UDSliceFlipPrun, 495, 336,
				UDSliceMove, UDSliceConj,
				FlipMove, SymStateFlip, 0x69603
			);
			if (InitPrunProgress > targetProgress) {
				return;
			}
			MCPermPrunMax = initRawSymPrun(
				MCPermPrun, 24, 2768,
				MPermMove, MPermConj,
				CPermMove, SymStatePerm, 0x8ea34
			);
			if (InitPrunProgress > targetProgress) {
				return;
			}
			EPermCCombPPrunMax = initRawSymPrun(
				EPermCCombPPrun, N_COMB, 2768,
				CCombPMove, CCombPConj,
				EPermMove, SymStatePerm, 0x7d824
			);
		}

		function initPrunTables() {
			if (InitPrunProgress < 0) {
				initBasic();
				InitPrunProgress = 0;
			}
			if (InitPrunProgress == 0) {
				doInitPrunTables(99);
			} else if (InitPrunProgress < 54) {
				doInitPrunTables(InitPrunProgress);
			} else {
				return true;
			}
			return false;
		}

		function randomCube() {
			var ep, cp;
			var eo = ~~(Math.random() * 2048);
			var co = ~~(Math.random() * 2187);
			do {
				ep = ~~(Math.random() * fact[12]);
				cp = ~~(Math.random() * fact[8]);
			} while (getNParity(cp, 8) != getNParity(ep, 12));
			var cc = new CubieCube().initCoord(cp, co, ep, eo);
			return cc.toFaceCube();
		}

		function fromScramble(s) {
			var j = 0;
			var axis = -1;
			var c1 = new CubieCube();
			var c2 = new CubieCube();
			for (var i = 0; i < s.length; i++) {
				switch (s[i]) {
					case 'U':
					case 'R':
					case 'F':
					case 'D':
					case 'L':
					case 'B':
						axis = "URFDLB".indexOf(s[i]) * 3;
						break;
					case ' ':
						if (axis != -1) {
							CubieCube.CornMult(c1, moveCube[axis], c2);
							CubieCube.EdgeMult(c1, moveCube[axis], c2);
							c1.init(c2.ca, c2.ea);
						}
						axis = -1;
						break;
					case '2':
						axis++;
						break;
					case '\'':
						axis += 2;
						break;
					default:
						continue;
				}
			}
			if (axis != -1) {
				CubieCube.CornMult(c1, moveCube[axis], c2);
				CubieCube.EdgeMult(c1, moveCube[axis], c2);
				c1.init(c2.ca, c2.ea);
			}
			return c2.toFaceCube();
		}

		return {
			Search: Search,
			solve: function (facelet) {
				return new Search().solution(facelet);
			},
			randomCube: randomCube,
			fromScramble: fromScramble,
			initFull: function () {
				PARTIAL_INIT_LEVEL = 0;
				initPrunTables();
			}
		}
	})();

const INIT_EPOCHS = 10000; //3000 is reasonable, 10,000 is overkill but ensures a highly optimized result
const INIT_PARTITIONS = 100;

//initialize min2phase tables
async function initSolve() {
	if(SystemStatus.min2Phase != Min2PhaseStatus.IDLE){
		return;
	}

	min2phase.initFull();

	SystemStatus.min2Phase = Min2PhaseStatus.INITIALIZING;
	updateStatusIndicator();

	initSolveCallback(0, INIT_PARTITIONS);

}

function initSolveCallback(i, total){
	for(let j = 0; j < INIT_EPOCHS / total; j++){
		min2phase.solve(min2phase.randomCube());
	}
	
	incrementProgressBar(0, 100, 1);

	if(++i < total){
		setTimeout(() => {
			initSolveCallback(i, total);
		}, 100);
	}else{
		SystemStatus.min2Phase = Min2PhaseStatus.INITIALIZED;
		updateStatusIndicator();
	}
}

//progress bar increment implementation: allows html webpage to be accurately updated with initialization data while init procedures are taking place
function incrementProgressBar(i, time, quantity){
	setTimeout(() => {
		let w = document.getElementById('initProgressBar').style.width;
		document.getElementById('initProgressBar').style.width = (parseFloat(w.substring(0, w.indexOf('%'))) + (quantity / time)) + '%';
		if(++i < time){
			incrementProgressBar(i, time, quantity);
		}
	}, 1);
}

//a simplification algorithm which efficiently compresses a solve algorithm of Single moves into an algorithm which includes dual moves
function simplifyAlg(alg) {
	let simplifiedAlg = '';

	let i;

	for (i = 0; i < alg.length - 1; i++) {
		let diff = (alg.charCodeAt(i) - alg.charCodeAt(i + 1)) % 6;
		if ((diff == 1 || diff == -5) && alg.charCodeAt(i) % 2 == 0 || (diff == -1 || diff == 5) && alg.charCodeAt(i) % 2 == 1) {
			let discreteIndex = alg.charCodeAt(i) + alg.charCodeAt(i + 1);

			if (discreteIndex % 6 == 5) { //FB Dual Move
				if (discreteIndex % 100 - discreteIndex % 10 == 40) { //140 <= discrete index < 150
					if (discreteIndex == 143) { //discrete index = 143
						if (alg[i] == 'A' || alg[i + 1] == 'A') {
							simplifiedAlg += 'U';
						} else if (alg[i] == 'G' || alg[i + 1] == 'G') {
							simplifiedAlg += 'W'
						} else {
							simplifiedAlg += 'Y'
						}
					} else { //discrete index = 149
						if (alg[i] == 'G' || alg[i + 1] == 'G') {
							simplifiedAlg += 'X';
						} else {
							simplifiedAlg += 'Z'
						}
					}
				} else if (discreteIndex % 100 - discreteIndex % 10 == 30) { //130 <= discrete index < 140
					if (discreteIndex % 10 == 7) { //discrete index = 137
						if (alg[i] == 'A' || alg[i + 1] == 'A') {
							simplifiedAlg += 'T';
						} else {
							simplifiedAlg += 'V';
						}
					} else { //discrete index = 131
						simplifiedAlg += 'S';
					}
				} else { // discrete index = 155
					simplifiedAlg += '[';
				}
			} else if (discreteIndex % 6 == 3) { //RL Dual Move
				if (discreteIndex % 100 - discreteIndex % 10 == 40) { //140 <= discrete index < 150
					if (discreteIndex == 147) { // discrete index = 147
						if (alg[i] == 'C' || alg[i + 1] == 'C') {
							simplifiedAlg += '^';
						} else if (alg[i] == 'I' || alg[i + 1] == 'I') {
							simplifiedAlg += '`'
						} else {
							simplifiedAlg += 'b'
						}
					} else if (discreteIndex == 141) { //discrete index = 141
						if (alg[i] == 'C' || alg[i + 1] == 'C') {
							simplifiedAlg += ']';
						} else {
							simplifiedAlg += '_';
						}
					}
				} else if (discreteIndex % 100 - discreteIndex % 10 == 50) { //150 <= discrete index < 160
					if (discreteIndex == 153) { //discrete index = 153
						if (alg[i] == 'I' || alg[i + 1] == 'I') {
							simplifiedAlg += 'a';
						} else {
							simplifiedAlg += 'c';
						}
					} else { //discrete index = 159
						simplifiedAlg += 'd';
					}
				} else { //discrete index = 135
					simplifiedAlg += '\\';
				}
			} else { //DU Dual Move
				if (discreteIndex % 100 - discreteIndex % 10 == 50) { //150 <= discrete index < 160
					if (discreteIndex == 151) { //discrete index = 151
						if (alg[i] == 'E' || alg[i + 1] == 'E') {
							simplifiedAlg += 'g';
						} else if (alg[i] == 'K' || alg[i + 1] == 'K') {
							simplifiedAlg += 'i';
						} else {
							simplifiedAlg += 'k';
						}
					} else if (discreteIndex == 157) { //discrete index = 157
						if (alg[i] == 'K' || alg[i + 1] == 'K') {
							simplifiedAlg += 'j';
						} else {
							simplifiedAlg += 'l';
						}
					}
				} else if (discreteIndex == 139) { //discrete index = 139
					simplifiedAlg += 'e';
				} else if (discreteIndex == 145) { //discrete index = 145
					if (alg[i] == 'E' || alg[i + 1] == 'E') {
						simplifiedAlg += 'f';
					} else {
						simplifiedAlg += 'h';
					}
				} else if (discreteIndex == 163) { //discrete index = 163
					simplifiedAlg += 'm';
				}
			}

			i++;
		} else {
			simplifiedAlg += alg[i];
		}
	}

	return simplifiedAlg + (i != alg.length - 1 ? "" : alg[alg.length - 1]);
}

function algToString(alg) {
	let dictionary = {
		"F" : "U  ",
		"R" : "U2 ",
		"L" : "U' ",
		"C" : "R  ",
		"O" : "R2 ",
		"I" : "R' ",
		"A" : "F  ",
		"M" : "F2 ",
		"G" : "F' ",
		"E" : "D  ",
		"Q" : "D2 ",
		"K" : "D' ",
		"D" : "L  ",
		"P" : "L2 ",
		"J" : "L' ",
		"B" : "B  ",
		"N" : "B2 ",
		"H" : "B' ",
		"S" : "F  B  ",
		"T" : "F  B' ",
		"U" : "F  B2 ",
		"V" : "F' B  ",
		"W" : "F' B' ",
		"X" : "F' B2 ",
		"Y" : "F2 B  ",
		"Z" : "F2 B' ",
		"[" : "F2 B2 ",
		"\\": "R  L  ",
		"]" : "R  L' ",
		"^" : "R  L2 ",
		"_" : "R' L  ",
		"`" : "R' L' ",
		"a" : "R' L2 ",
		"b" : "R2 L  ",
		"c" : "R2 L' ",
		"d" : "R2 L2 ",
		"e" : "D  U  ",
		"f" : "D  U' ",
		"g" : "D  U2 ",
		"h" : "D' U  ",
		"i" : "D' U' ",
		"j" : "D' U2 ",
		"k" : "D2 U  ",
		"l" : "D2 U' ",
		"m" : "D2 U2 "
	}


	let translation = '';

	for (let ind in alg) {
		translation += dictionary[alg[ind]];
	}

	return translation;
}

//Used for testing purposes to report details about the results of a solve algorithm
//returns: [# of total quarter turns (q + 2h), # of just quarter turns, # of half turns]
function countQuarters(alg) {
	let halfTurnC = 0;
	let quarterTurnC = 0;

	for(let i = 0; i < alg.length; i++){
		let c = alg.charCodeAt(i);
		if(c > 76 && c < 83 || c > 88 && (c - 89) % 9 < 3 || c > 84 && (c - 85) % 3 == 0){
			halfTurnC++;
		}else{
			quarterTurnC++;
		}
	}

	return [quarterTurnC + 2 * halfTurnC, quarterTurnC, halfTurnC];
}




















function execute(){
	if(SystemStatus.min2Phase != Min2PhaseStatus.INITIALIZED || SystemStatus.serial != SerialStatus.PORT_OPEN){
		return;
	}

	SystemStatus.operation = OperationStatus.SOLVING;
	updateStatusIndicator();
	captureStartTime = performance.now();
	capture();
	calculationStartTime = performance.now();
	let solution = simplifyAlg(min2phase.solve(scanCube(scanTargets())));
	if(solution.substring(0,5) != 'Error'){
		sendMessage(solution);
	}else{
		SystemStatus.operation = OperationStatus.IDLE;
		updateStatusIndicator();

		let tileCounts = [];

		for(let i = 0; i < centers.length; i++) {
			if(scanCube(scanTargets()).match(new RegExp(centers[i], "g")).length != 9) {
				console.log(centers[i] + ': ' + scanCube(scanTargets()).match(new RegExp(centers[i], "g")).length);
			}
		}
	}
	
	console.log(solution);
	console.log(scanToImg(scanCube(scanTargets())));
	console.log(scanTargets());
}