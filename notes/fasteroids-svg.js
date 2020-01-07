////////////////////////////////////////////////////////////////////////
//
// Fasteroids for SVG
// Copyright (C) 2003 by Don Hopkins.
// All rights reserved. 
// Designed and implemented by Don Hopkins. 
//
// mailto:dhopkins@DonHopkins.com
// http://www.DonHopkins.com
// http://www.catalog.com/hopkins
//
// 2D Rigid Body Dynamics adapted from Chris Hecker's articles:
// http://www.d6.com/users/checker/dynamics.htm
//
// This program is provided for unrestricted use, 
// provided that this copyright message is preserved. 
// There is no warranty, and no author or distributer 
// accepts responsibility for any damage caused by 
// this program. 
//
////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////
// Globals


var SVGNameSpace = "http://www.w3.org/2000/svg";
var XLinkNameSpace = "http://www.w3.org/1999/xlink";

var gSpaceGroup = null

var gSprites = [];
var gTargets = [];
var gShips = [];
var gRocks = [];
var gBlasts = [];
var gSpaceX = 0;
var gSpaceY = 0;
var gSpaceWidth = window.innerWidth;
var gSpaceHeight = window.innerHeight;
//var gTimeInterval = 1;
var gTimeInterval = 1;
var gTimeStep = 0.25;
var gTime = 0;
var gLastTime = 0;
var gMinCollisionTime = 5;
var gTwoPi = 2.0 * Math.PI;
var gInitialShipCount = 1;
var gMaxShips = 4;
var gShipWidth = 20;
var gShipHeight = 20;
var gShipDensity = .25;
var gShipRestitution = 1.0;
var gShipTurn = 0.1; //gTwoPi / 16.0;
var gShipAccel = 2.0;
var gShipTractor = 2.0;
var gShipBrake = 0.75;
var gRockDensity = 1;
var gRockRestitution = 1.0;
var gRockBlastHeat = 0.6;
var gRockShipHeat = 0.8;
var gRockBounceHeat = 0.4;
var gRockCool = 0.99;
var gRockInhibitTime = 5;
var gRockMinSplitHeat = 1.0;
var gRockMinMergeHeat = 0.9;
var gMinRockSplitSize = 30;
var gMaxRockMergeSize = 200;
var gRockBlastCount = 2;
var gRockBlastVel = 16;
var gRockBlastSpread = 10;
var gInitialRockCount = 1;
var gMaxRocks = 4;
var gInitialRockSize = 50;
var gInitialRockSpeed = 5.0;
var gInitialRockDDir = 0.75;
var gSpriteSmoosh = 1.0;
//var gAccelProb = 0.4;
var gAccelProb = 0.0;
//var gAccelRate = 5.0;
var gAccelRate = 15.0;
var gShipBlastAccel = -1.0;
var gTurnSign = 1;
var gTurnSignProb = 0.02;
//var gTurnProb = 0.7;
var gTurnProb = 0.0;
//var gTurnRate = gTwoPi / 32;
var gTurnRate = gTwoPi / 100;
var gBlastWidth = 1;
var gBlastHeight = 1;
var gBlastDensity = 100.0;
var gBlastRestitution = 1.0;
//var gBlastProb = 0.1;
var gBlastProb = 0.0;
var gBlastSpeed = 20.0;
//var gBlastTime = 25;
var gBlastTime = 50;
var gHighRockMark = 10;
var gHighBlastMark = 8;
var gWrap = 1;
var gInitRound = 1;
var gInRound = 1;
var gRound = 0;

var gHexDigits =
  new Array("0", "1", "2", "3", "4", "5", "6", "7", 
            "8", "9", "A", "B", "C", "D", "E", "F");

var gGenUniqueID = 0;

function GenUniqueID()
{
  return "FASTEROIDS_ID_" + (gGenUniqueID++);
}


function RandInt(n)
{
  return Math.floor(Math.random() * n);
}


function ClampFloatToByte(f)
{
  var b =
    Math.floor(f * 256);
  if (b < 0) {
    b = 0;
  } else if (b > 255) {
    b = 255;
  } // if
  return b;
}


function ByteToHex(b)
{
  var str =
    gHexDigits[(b >> 4) & 15] +
    gHexDigits[b & 15];

  return str;
}


function CalcDistance(dx, dy)
{
  return Math.sqrt((dx * dx) + (dy * dy));
}


function CalcAngle(dx, dy)
{
  if ((dx == 0) && (dy == 0)) {
    return 0;
  } else {
    return Math.atan(dy, dx);
  } // if
}


function InitDynamics(obj)
{
  var width = obj.width;
  var height = obj.height;

  obj.size = Math.max(width, height);
  obj.mass = obj.density * width * height;
  obj.massInverse = 1.0 / obj.mass;
  obj.moment = (obj.mass / 12.0) * ((width * width) + (height * height));
  obj.momentInverse = 1.0 / obj.moment;
}


function MakeSprite(
  type, element,
  positionX, positionY,
  width, height,
  orientation,
  velocityX, velocityY,
  angularVelocity,
  density, restitution)
{
  var obj = new Object();

  obj.type = type;
  obj.owner = null;
  obj.el = null;
  obj.positionX = positionX;
  obj.positionY = positionY;
  obj.width = width;
  obj.height = height;
  obj.orientation = orientation;
  obj.velocityX = velocityX;
  obj.velocityY = velocityY;
  obj.angularVelocity = angularVelocity;
  obj.forceX = 0.0;
  obj.forceY = 0.0;
  obj.torque = 0.0;
  obj.density = density;
  obj.restitution = restitution;

  InitDynamics(obj);

  obj.temperature = 0.0;
  obj.temperatureShown = -1;

  SetGroup(obj, element);

  SetOrientation(obj, orientation);

  gSprites.push(obj);

  return obj;
}


function SetOrientation(obj, orientation)
{
  while (orientation < 0) {
    orientation += gTwoPi;
  } // while
  while (orientation >= gTwoPi) {
    orientation -= gTwoPi;
  } // while

  obj.orientation = orientation;

  obj.orientationDX = Math.cos(orientation);
  obj.orientationDY = Math.sin(orientation);

  MoveGroup(obj, obj.positionX, obj.positionY);

  if (obj.type == "rock") {
    var temp = obj.temperature;
    var delta = Math.abs(temp - obj.temperatureShown);
    var epsilon = 0.05;
    if (delta > epsilon) {
      obj.temperatureShow = temp;
      var r = ClampFloatToByte(0.25 + (temp * 0.75));
      var g = ClampFloatToByte(0.25 - (temp * 0.25));
      var b = ClampFloatToByte(0.25 - (temp * 0.25));
      var rgb = 
	"#" +
        ByteToHex(r) +
        ByteToHex(g) +
        ByteToHex(b);
      SetRockFillColor(obj, rgb);
    } // if
  } // if
}


function SetRockFillColor(obj, color)
{
  obj.el.setAttribute("fill", color);
}

function MakeRandomShip()
{
  return MakeShip(
      Math.random() * gSpaceWidth,
      Math.random() * gSpaceHeight,
      Math.random() * gTwoPi);
}


function MakeShip(x, y, dir)
{
  var ship =
    MakeSprite(
      "ship",
      MakeUseElement("Ship"),
      x, y,
      gShipWidth, gShipHeight,
      dir,
      0.0, 0.0,
      0.0,
      gShipDensity,
      gShipRestitution);

  gTargets.push(ship);

  ship.startTime = gTime;
  ship.endTime = -1;

  gShips.push(ship);

  AccelerateSprite(ship, gShipAccel);

  return ship;
}


function RandomizeRock(obj)
{
  obj.velocityX = obj.orientationDX * Math.random() * gInitialRockSpeed;
  obj.velocityY = obj.orientationDY * Math.random() * gInitialRockSpeed;
  obj.angularVelocity = (Math.random() - 0.5) * gInitialRockDDir;
}


function MakeShipBlast(ship)
{
  var r = gShipWidth / 2.0;
  var offsetX =
    (ship.orientationDX * r);
  var offsetY =
    (ship.orientationDY * r);
  var blastVelocityX =
    (ship.orientationDX * gBlastSpeed) +
    ship.velocityX;
  var blastVelocityY =
    (ship.orientationDY * gBlastSpeed) +
    ship.velocityY;

  var x =
    Math.round(ship.positionX + offsetX);
  var y =
    Math.round(ship.positionY + offsetY);

  var blast =
    MakeBlastAt(
      x, y,
      blastVelocityX,
      blastVelocityY);

  blast.owner = ship;

  AccelerateSprite(ship, gShipBlastAccel);

  return blast;
}


function MakeBlastAt(x, y, velx, vely)
{
  var blast =
    MakeSprite(
      "blast",
      MakeUseElement("Blast"),
      x, y, 
      gBlastWidth, gBlastHeight,
      0,
      velx,
      vely,
      0,
      gBlastDensity,
      gBlastRestitution);

  blast.startTime = gTime;
  blast.endTime = gTime + gBlastTime;

  gBlasts.push(blast);

  return blast;
}


function HandleOnKeyPress(evt)
{
  var key = evt.charCode;
  var ship = gShips[0];

  if (key == 104) { // h
    TractorSprite(ship, -gShipTractor, 0);
  } else if (key == 106) { // j
    TractorSprite(ship, 0, gShipTractor);
  } else if (key == 107) { // k
    TractorSprite(ship, 0, -gShipTractor);
  } else if (key == 108) { // l
    TractorSprite(ship, gShipTractor, 0);
  } else if (key == 98) { // b
    BrakeSprite(ship, gShipBrake);
  } else if (key == 122) { // z
    BrakeSprite(ship, gShipBrake);
  } else if (key == 97) { // a
    TurnSprite(ship, -gShipTurn);
  } else if (key == 115) { // s
    AccelerateSprite(ship, gShipAccel);
  } else if (key == 100) { // d
    TurnSprite(ship, gShipTurn);
  } else if (key == 113) { // q
    TurnSprite(ship, gTwoPi * -0.25);
  } else if (key == 119) { // w
    TurnSprite(ship, gTwoPi * .5);
  } else if (key == 101) { // e
    TurnSprite(ship, gTwoPi * 0.25);
  } else if (key == 114) { // r
    MakeRandomRock(gInitialRockSize);
  } else if (key == 32) { // space
    FireBlast(ship);
  }
}


function TurnSprite(sprite, twist)
{
  SetOrientation(sprite, twist + sprite.orientation);
}


function AccelerateSprite(sprite, accel)
{
  TractorSprite(
    sprite,
    sprite.orientationDX * accel,
    sprite.orientationDY * accel);
}


function TractorSprite(sprite, dx, dy)
{
  sprite.velocityX += dx;
  sprite.velocityY += dy;
}


function BrakeSprite(sprite, friction)
{
  sprite.velocityX *= friction;
  sprite.velocityY *= friction;
}


function FireBlast(ship)
{
  MakeShipBlast(ship);
}


function UpdateSpaceSize()
{
  gSpaceX = 0;
  gSpaceY = 0;
  gSpaceWidth = window.innerWidth;
  gSpaceHeight = window.innerHeight;
}


function HandleTimer()
{
  UpdateSpaceSize();
  DoPhysics();
  window.setTimeout("HandleTimer()", gTimeInterval);
}


function DoPhysics()
{
  gLastTime = gTime;
  gTime += gTimeStep;

  ComputeForces();

  Integrate(gTimeStep);

  CheckCollisions();

  CheckShips();
  CheckBlasts();
  CheckRocks();

  CheckRound();
}


function CheckRound()
{
  if (!gInitRound &&
      gInRound &&
      (gRocks.length == 0) &&
      (gBlasts.length == 0)) {

    gRound++;

    gInitRound = 1;
  } // if

  if (gInitRound) {
    gInitRound = 0;
    InitRound();
  } // if
}


function InitRound()
{
  gInRound = 1;

  extraRocks = Math.floor(gRound / 2.0);

  for (i = 0; i < gInitialRockCount + extraRocks; i++) {
    MakeRandomRock(gInitialRockSize);
  } // for i

  while (gShips.length < gInitialShipCount) {
    MakeRandomShip();
  } // for i
}


function ComputeForces()
{
}


function Integrate(deltaTime)
{
  var n = gSprites.length;
  var i;
  for (i = 0; i < n; i++) {
    var sprite = gSprites[i];

    var width = sprite.width;
    var height = sprite.height;
    var halfWidth = sprite.width / 2.0;
    var halfHeight = sprite.height / 2.0;
    var positionX = sprite.positionX;
    var positionY = sprite.positionY;
    var orientation = sprite.orientation;
    var velocityX = sprite.velocityX;
    var velocityY = sprite.velocityY;
    var angularVelocity = sprite.angularVelocity;
    var forceX = sprite.forceX;
    var forceY = sprite.forceY;
    var torque = sprite.torque;

    if ((velocityX != 0) || (velocityY != 0)) {
      positionX += deltaTime * velocityX;
      positionY += deltaTime * velocityY;

      if (gWrap) {
	if (positionX < halfWidth) {
	  positionX += gSpaceWidth - width;
	} // if
	if (positionY < halfHeight) {
	  positionY += gSpaceHeight - height;
	} // if
	if (positionX >= (gSpaceWidth - halfWidth)) {
	  positionX -= gSpaceWidth - width;
	} // if
	if (positionY >= (gSpaceHeight - halfHeight)) {
	  positionY -= gSpaceHeight - height;
	} // if
      } else {
	if (positionX < halfWidth) {
	  positionX = halfWidth;
	  velocityX = -velocityX;
	  sprite.velocityX = velocityX;
	} else if (positionX >= (gSpaceWidth - halfWidth)) {
          positionX = (gSpaceWidth - halfWidth - 1);
	  velocityX = -velocityX;
	  sprite.velocityX = velocityX;
	} // if
	if (positionY < halfHeight) {
	  positionY = halfHeight;
	  velocityY = -velocityY;
	  sprite.velocityY = velocityY;
	} else if (positionY >= (gSpaceHeight - halfHeight)) {
          positionY = (gSpaceHeight - halfHeight - 1);
	  velocityY = -velocityY;
	  sprite.velocityY = velocityY;
	} // if
      } // if

      MoveGroup(sprite, positionX, positionY);
    } // if

    if (angularVelocity != 0.0) {
      orientation += deltaTime * angularVelocity;
      SetOrientation(sprite, orientation);
    } // if

    if ((forceX != 0.0) && (forceY != 0.0)) {
      var massInverse = obj.massInverse;
      obj.velocityX = velocityX + (deltaTime * massInverse * forceX);
      obj.velocityY = velocityY + (deltaTime * massInverse * forceY);
    } // if

    if (torque != 0.0) {
      var momentInverse = obj.momentInverse;
      obj.angularVelocity = angularVelocity + (deltaTime * momentInverse * torque);
    } // if

  } // for i
}


function CheckBlasts()
{
  var i, j;

  for (i = gBlasts.length - 1; i >= 0; i--) {
    var blast = gBlasts[i];
    var x = blast.positionX;
    var y = blast.positionY;
    for (j = gTargets.length - 1; j >= 0; j--) {
      var obj = gTargets[j];
      if (blast.owner != obj) {
	var dx = x - obj.positionX;
	var dy = y - obj.positionY;
	var dist = CalcDistance(dx, dy);
	if ((dist <= (obj.size / 2)) &&
	    (blast.owner != obj)) {
	  if (obj.type == "ship") {

	    // Blast hits Ship: blast disappears.

	    blast.endTime = gTime - 1;
	  } else if ((obj.type == "rock") &&
		     ((obj.endTime == -1) ||
		      (obj.endTime > gTime))) {
	    // Blast hits Rock: blast disappears, rock splits or explodes.

	    var temp = obj.temperature;
	    temp += gRockBlastHeat;
	    if (temp > 1.0) temp = 1.0;
	    obj.temperature = temp;
	    if ((obj.temperature >= gRockMinSplitHeat) &&
		((obj.startTime + gRockInhibitTime) < gTime)) {
	      if (obj.size < gMinRockSplitSize) {
		// Explode small rocks
		obj.endTime = gTime - 1;
		var k;
		for (k = 0; k < gRockBlastCount; k++) {
		  var x = obj.positionX + ((Math.random() - 0.5) * gRockBlastSpread);
		  var y = obj.positionY + ((Math.random() - 0.5) * gRockBlastSpread);
		  var velx = ((Math.random() - 0.5) * 2 * gRockBlastVel);
		  var vely = ((Math.random() - 0.5) * 2 * gRockBlastVel);

		  MakeBlastAt(
		    x,
		    y,
		    velx,
		    vely);
		} // for k
	      } else {
		// Split big rocks
		var area = obj.size * obj.size;
		var split = (Math.random() * 0.8) + 0.1;
		var newsize1 = Math.sqrt(area * split);
		var newsize2 = Math.sqrt(area * (1.0 - split));
		var newdir1 = Math.random() * gTwoPi;
		var newdir2 = newdir1 + Math.PI;
		var newvelx = (Math.random() - 0.5) * 2 * gInitialRockSpeed;
		var newvely = (Math.random() - 0.5) * 2 * gInitialRockSpeed;
		var newtemp = 0;
		var r1 =
		  MakeRock(
		    obj.positionX + Math.random() - 0.5,
		    obj.positionY + Math.random() - 0.5,
		    newvelx,
		    newvely,
		    newdir1,
		    newsize1);
		r1.temperature = newtemp;
		var r2 =
		  MakeRock(
		    obj.positionX + Math.random() - 0.5,
		    obj.positionY + Math.random() - 0.5,
		    -newvelx,
		    -newvely,
		    newdir2,
		    newsize2);
		r2.temperature = newtemp;
		obj.endTime = gTime - 1;
	      } // if
	    } // if
	    blast.endTime = gTime - 1;
	  } // if
	} // if
      } // if
    } // for j
  } // for i

  for (i = gBlasts.length - 1; i >= 0; i--) {
    var blast = gBlasts[i];
    if ((blast.endTime != -1) &&
        (blast.endTime <= gTime)) {
      RemoveSprite(blast);
    } // if
  } // for i
}


function RemoveSprite(obj)
{
  var i;

  gSpaceGroup.removeChild(obj.el);
  obj.el.obj = null;

  if (obj.type == "blast") {
    RemoveFromGroup(gBlasts, obj);
  } else if (obj.type == "ship") {
    RemoveFromGroup(gShips, obj);
    RemoveFromGroup(gTargets, obj);
  } else if (obj.type == "rock") {
    RemoveFromGroup(gRocks, obj);
    RemoveFromGroup(gTargets, obj);
  } // if

  RemoveFromGroup(gSprites, obj);
}


function RemoveFromGroup(group, obj)
{
  var i;
  for (i = group.length - 1; i >= 0; i--) {
    if (group[i] == obj) {
      group.splice(i, 1);
      return;
    } // if
  } // for j
}

function CheckShips()
{
  var i, j;

  for (i = gShips.length - 1; i >= 0; i--) {
    var ship = gShips[i];
    if ((ship.endTime != -1) &&
        (ship.endTime <= gTime)) {
      RemoveSprite(ship);
    } // if
  } // for i
  
  var n = gShips.length;
  for (i = 0; i < n; i++) {
    var ship = gShips[i];

    if (Math.random() < gAccelProb) {
      AccelerateSprite(ship, (Math.random() - 0.5) * gAccelRate);
    } // if

    if (Math.random() < gTurnSignProb) {
      gTurnSign = -gTurnSign;
    } // if

    if (Math.random() < gTurnProb) {
      TurnSprite(ship, Math.random() * gTurnRate * gTurnSign);
    } // if

    if ((gRocks.length > 0) &&
        (gBlasts.length < gHighBlastMark) &&
        (Math.random() < gBlastProb)) {
      FireBlast(ship);
    } // if

  } // for i
}


function CheckRocks()
{
  var i, j;

  for (i = gRocks.length - 1; i >= 0; i--) {
    var rock = gRocks[i];
    rock.temperature *= gRockCool;
    if ((rock.endTime != -1) &&
        (rock.endTime <= gTime)) {
      RemoveSprite(rock);
    } // if
  } // for i
}

function CheckCollisions()
{
  var n = gTargets.length;
  var i, j;

  for (i = 0; i < n - 1; i++) {
    var r1 = gTargets[i];
    var r1r = r1.size / 2;
    var r1x = r1.positionX;
    var r1y = r1.positionY;
    for (j = i + 1; j < n; j++) {
      var r2 = gTargets[j];
      var r2r = r2.size / 2;
      var r2x = r2.positionX;
      var r2y = r2.positionY;
      var dx = r1x - r2x;
      var dy = r1y - r2y;
      var dist = CalcDistance(dx, dy);
      var mindist = (r1r + r2r) * gSpriteSmoosh;
      if (dist < mindist) {
        ResolveCollision(r1, r1x, r1y, r1r, r2, r2x, r2y, r2r, dx, dy, dist);
      } // if
    } // for j
  } // for i
}


function ResolveCollision(r1, r1x, r1y, r1r, r2, r2x, r2y, r2r, dx, dy, dist)
{
  if (((r1.endTime != -1) &&
       (r1.endTime <= gTime)) ||
      ((r2.endTime != -1) &&
       (r2.endTime <= gTime))) {
    return;
  } // if

  var ship = null;
  var other = null;
  
  if (r1.type == "ship") {
    ship = r1;
    other = r2;
  } else {
    if (r2.type == "ship") {
      ship = r2;
      other = r1;
    } // if
  } // if

  if (ship != null) {
    if (other.type == "rock") {
      other.velocityX += ((Math.random() - 0.5) * gAccelRate * 2);
      other.velocityY += ((Math.random() - 0.5) * gAccelRate * 2);
      ship.velocityX = -other.velocityX;
      ship.velocityY = -other.velocityY;
      other.temperature = 1;
      var blast = MakeBlastAt(
	other.positionX,
	other.positionY,
	other.velocityX,
	other.velocityY);
      blast.endTime = gTime + 1;
      return;
    } // if
  } // if

  if ((r1.type == "rock") &&
      (r2.type == "rock")) {
    var temp1 = r1.temperature;
    var temp2 = r2.temperature;
    var avg = (temp1 + temp2 + gRockBounceHeat) / 2.0;
    if (avg < 0) avg = 0;
    if (avg > 1) avg = 1;
    r1.temperature = avg;
    r2.temperature = avg;
    if ((avg >= gRockMinMergeHeat) ||
        (gRocks.length >= gHighRockMark)) {
      var area = (r1.size * r1.size) + (r2.size * r2.size);
      var newsize = Math.sqrt(area);
      if ((newsize < gMaxRockMergeSize) &&
          (r1.startTime + gRockInhibitTime < gTime) &&
          (r2.startTime + gRockInhibitTime < gTime)) {
	// Merge rocks
	var newtemp = 0;
	var newvelx = (r1.velocityx + r2.velocityx) / 2;
	var newvely = (r1.velocityy + r2.velocityy) / 2;
	var newrock =
	  MakeRock(
	    ((r1.positionX + r2.positionX) / 2.0) + (Math.random() - 0.5),
	    ((r1.positionY + r2.positionY) / 2.0) + (Math.random() - 0.5),
	    newvelx,
	    newvely,
	    Math.random() * gTwoPi,
	    newsize);
	r1.temperature = newtemp;
	r1.endTime = gTime - 1;
	r2.endTime = gTime - 1;
	return;
      } // if
    } // if
  } // if

  var velocityX1 = r1.velocityX;
  var velocityY1 = r1.velocityY;
  var velocityX2 = r2.velocityX;
  var velocityY2 = r2.velocityY;

  var relativeVelocity =
    (velocityX1 * velocityX2) +
    (velocityY1 * velocityY2);

  var d1 = 
    CalcDistance(
      (r1.positionX - r2.positionY),
      (r1.positionY - r2.positionY));
  var d2 =
    CalcDistance(
      ((r1.positionX + r1.velocityX) -
       (r2.positionY + r2.velocityY)),
      ((r1.positionY + r1.velocityY) -
       (r2.positionY + r2.velocityY)));

  relativeVelocity = d2 - d1;

  if (relativeVelocity > 0) {
    if (dist == 0) { dist = 1; }
    var goaldist = (r1.size / 2) + (r2.size / 2);
    var penetration = goaldist - dist;
    var normpenetration = penetration / goaldist;
    if (normpenetration > 0) {
      var normx = dx / dist;
      var normy = dy / dist;
      var repel = penetration * 0.5;
      var slow = 0.9;
      var noise = 1;
      r1.velocityX = (slow * r1.velocityX) + (normx * repel) + ((Math.random() - 0.5) * noise);
      r1.velocityY = (slow * r1.velocityY) + (normy * repel) + ((Math.random() - 0.5) * noise);
      r2.velocityX = (slow * r2.velocityX) + (-normx * repel) + ((Math.random() - 0.5) * noise);
      r2.velocityY = (slow * r2.velocityY) + (-normy * repel) + ((Math.random() - 0.5) * noise);
      return;
    } // if
  } // if

  var rTotal = r1r + r2r;
  var r1Weight = r1r / rTotal;
  var r2Weight = 1.0 - r1Weight;
  var collisionX = (r1Weight * r1x) + (r2Weight * r2x);
  var collisionY = (r1Weight * r1y) + (r2Weight * r2y);

  var cmToCornerX1 = collisionX - r1x;
  var cmToCornerY1 = collisionY - r1y;
  var cmToCornerX2 = collisionX - r2x;
  var cmToCornerY2 = collisionY - r2y;

  var cmToCornerPerpX1 = -cmToCornerY1;
  var cmToCornerPerpY1 = cmToCornerX1;
  var cmToCornerPerpX2 = -cmToCornerY2;
  var cmToCornerPerpY2 = cmToCornerX2;

  var angularVelocity1 = r1.angularVelocity;
  var angularVelocity2 = r2.angularVelocity;

  velocityX1 += (angularVelocity1 * cmToCornerPerpX1);
  velocityY1 += (angularVelocity1 * cmToCornerPerpY1);
  velocityX2 += (angularVelocity2 * cmToCornerPerpX2);
  velocityY2 += (angularVelocity2 * cmToCornerPerpY2);

  var collisionDist1 =
    Math.sqrt((cmToCornerX1 * cmToCornerX1) +
	      (cmToCornerY1 * cmToCornerY1));
  var collisionDist2 =
    Math.sqrt((cmToCornerX2 * cmToCornerX2) +
	      (cmToCornerY2 * cmToCornerY2));

  var collisionNormalX1 = cmToCornerX1 / collisionDist1;
  var collisionNormalY1 = cmToCornerY1 / collisionDist1;
  var collisionNormalX2 = cmToCornerX2 / collisionDist2;
  var collisionNormalY2 = cmToCornerY2 / collisionDist2;

  var impulseNumerator1 =
    -(1 + r1.restitution) *
    ((velocityX1 * collisionNormalX1) +
     (velocityY1 * collisionNormalY1));
  var impulseNumerator2 =
    -(1 + r2.restitution) *
    ((velocityX2 * collisionNormalX2) +
     (velocityY2 * collisionNormalY2));

  var perpDot1 =
    ((cmToCornerPerpX1 * collisionNormalX1) +
     (cmToCornerPerpY1 * collisionNormalY1));
  var perpDot2 =
    ((cmToCornerPerpX2 * collisionNormalX2) +
     (cmToCornerPerpY2 * collisionNormalY2));

  var impulseDenominator1 =
    r1.massInverse +
    (r1.momentInverse * perpDot1 * perpDot1);
  var impulseDenominator2 =
    r2.massInverse +
    (r2.momentInverse * perpDot2 * perpDot2);

  var impulse1 =
    impulseNumerator1 / impulseDenominator1;
  var impulse2 =
    impulseNumerator2 / impulseDenominator2;

  r1.velocityX += impulse1 * r1.massInverse * collisionNormalX1;
  r1.velocityY += impulse1 * r1.massInverse * collisionNormalY1;
  r1.angularVelocity += impulse1 * r1.momentInverse * perpDot1;
  r2.velocityX += impulse2 * r2.massInverse * collisionNormalX2;
  r2.velocityY += impulse2 * r2.massInverse * collisionNormalY2;
  r2.angularVelocity += impulse2 * r2.momentInverse * perpDot2;
}


function ResetWorld()
{
  var i;
  while (gBlasts.length > 0) {
    RemoveSprite(gBlasts[0]);
  } // while
  while (gShips.length > 0) {
    RemoveSprite(gShips[0]);
  } // while
  while (gRocks.length > 0) {
    RemoveSprite(gRocks[0]);
  } // while
  gInRound = 0;
}


function ResetToRound(round)
{
  ResetWorld();
  gRound = round;
  gInRound = 1;
  gInitRound = 1;
}


////////////////////////////////////////////////////////////////////////
// TODO


function SetGroup(obj, el)
{
  obj.el = el;
  el.obj = obj;
  ShowElement(obj);
  MoveGroup(obj, obj.positionX, obj.positionY);
  gSpaceGroup.appendChild(el);
}


function MoveGroup(obj, posx, posy)
{
  obj.positionX = posx;
  obj.positionY = posy;
  
  var el = obj.el
  var dir = (obj.orientation * 360.0) / gTwoPi;
  var x = posx + gSpaceX;
  var y = posy + gSpaceY;
  var transform = "translate(" + x + "," + y + ") rotate(" + dir + ")";
  el.setAttribute("transform", transform);
}


function ShowElement(obj)
{
  obj.el.style.visibility = "visible";
}


function HideElement(obj)
{
  obj.el.style.visibility = "hidden";
}


function MakeUseElement(url)
{
  var use = svgDocument.createElement("use");
  use.setAttributeNS(XLinkNameSpace, "href", "#" + url);
  return use;
}


function MakeRandomRock(size)
{
  return MakeRock(
      Math.random() * gSpaceWidth,
      Math.random() * gSpaceHeight,
      (Math.random() - 0.5) * 2 * gInitialRockSpeed,
      (Math.random() - 0.5) * 2 * gInitialRockSpeed,
      Math.random() * gTwoPi,
      size);
}


function MakeRock(x, y, velx, vely, dir, size)
{
  var r =
    size / 2;
  var rock =
    MakeSprite(
      "rock",
      MakeRockElement(size),
      x, y,
      size, size,
      dir,
      velx, vely,
      0.0,
      gRockDensity,
      gRockRestitution);

  gTargets.push(rock);

  RandomizeRock(rock);

  rock.startTime = gTime;
  rock.endTime = -1;

  gRocks.push(rock);

  return rock;
}


function MakeRockElement(size)
{
  var el =
    svgDocument.createElement("path");

  el.setAttribute("d", MakeRockPath(size));
  el.setAttribute("fill", "white");
  el.setAttribute("stroke", "gray");
  el.setAttribute("stroke-width", 1);

  return el;
}


function MakeRockPath(size)
{
  var path = "M ";
  var slop = 1.0;
  var jitter = 0.5;
  var center = Math.floor(size / 2);
  var r = center * slop;
  var points = 16;
  var turn = gTwoPi / points;
  var ang = 0;
  var i;
  for (i = 0; i < points; i++) {
    var x =
      Math.floor(
	(r * Math.cos(ang)) +
        ((Math.random() - 0.5) * r * jitter));
    var y =
      Math.floor(
	(r * Math.sin(ang)) +
        ((Math.random() - 0.5) * r * jitter));
    if (x < -center) x = -center;
    if (x > center) x = center;
    if (y < -center) y = -center;
    if (y > center) y = center;
    path += x + " " + y + " ";
    ang += turn;
  } // for i
  path += "z";

  return path;
}


function InitFasteroids()
{
  gSpaceGroup = svgDocument.getElementById("Space");

  UpdateSpaceSize();

  gSprites = [];
  gTargets = [];

  var i;
  
  for (i = 0; i < gInitialShipCount; i++) {
    MakeRandomShip();
  } // for i

  gRound = 1;
  gInitRound = 1;

  HandleTimer();
}


////////////////////////////////////////////////////////////////////////
