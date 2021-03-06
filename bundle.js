(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
*/

(function () { 'use strict';

// shortcuts for easier to read formulas

var PI   = Math.PI,
    sin  = Math.sin,
    cos  = Math.cos,
    tan  = Math.tan,
    asin = Math.asin,
    atan = Math.atan2,
    acos = Math.acos,
    rad  = PI / 180;

// sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas


// date/time constants and conversions

var dayMs = 1000 * 60 * 60 * 24,
    J1970 = 2440588,
    J2000 = 2451545;

function toJulian(date) { return date.valueOf() / dayMs - 0.5 + J1970; }
function fromJulian(j)  { return new Date((j + 0.5 - J1970) * dayMs); }
function toDays(date)   { return toJulian(date) - J2000; }


// general calculations for position

var e = rad * 23.4397; // obliquity of the Earth

function rightAscension(l, b) { return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l)); }
function declination(l, b)    { return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l)); }

function azimuth(H, phi, dec)  { return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)); }
function altitude(H, phi, dec) { return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H)); }

function siderealTime(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }

function astroRefraction(h) {
    if (h < 0) // the following formula works for positive altitudes only.
        h = 0; // if h = -0.08901179 a div/0 would occur.

    // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
    // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

// general sun calculations

function solarMeanAnomaly(d) { return rad * (357.5291 + 0.98560028 * d); }

function eclipticLongitude(M) {

    var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
        P = rad * 102.9372; // perihelion of the Earth

    return M + C + P + PI;
}

function sunCoords(d) {

    var M = solarMeanAnomaly(d),
        L = eclipticLongitude(M);

    return {
        dec: declination(L, 0),
        ra: rightAscension(L, 0)
    };
}


var SunCalc = {};


// calculates sun position for a given date and latitude/longitude

SunCalc.getPosition = function (date, lat, lng) {

    var lw  = rad * -lng,
        phi = rad * lat,
        d   = toDays(date),

        c  = sunCoords(d),
        H  = siderealTime(d, lw) - c.ra;

    return {
        azimuth: azimuth(H, phi, c.dec),
        altitude: altitude(H, phi, c.dec)
    };
};


// sun times configuration (angle, morning name, evening name)

var times = SunCalc.times = [
    [-0.833, 'sunrise',       'sunset'      ],
    [  -0.3, 'sunriseEnd',    'sunsetStart' ],
    [    -6, 'dawn',          'dusk'        ],
    [   -12, 'nauticalDawn',  'nauticalDusk'],
    [   -18, 'nightEnd',      'night'       ],
    [     6, 'goldenHourEnd', 'goldenHour'  ]
];

// adds a custom time to the times config

SunCalc.addTime = function (angle, riseName, setName) {
    times.push([angle, riseName, setName]);
};


// calculations for sun times

var J0 = 0.0009;

function julianCycle(d, lw) { return Math.round(d - J0 - lw / (2 * PI)); }

function approxTransit(Ht, lw, n) { return J0 + (Ht + lw) / (2 * PI) + n; }
function solarTransitJ(ds, M, L)  { return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L); }

function hourAngle(h, phi, d) { return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d))); }

// returns set time for the given sun altitude
function getSetJ(h, lw, phi, dec, n, M, L) {

    var w = hourAngle(h, phi, dec),
        a = approxTransit(w, lw, n);
    return solarTransitJ(a, M, L);
}


// calculates sun times for a given date and latitude/longitude

SunCalc.getTimes = function (date, lat, lng) {

    var lw = rad * -lng,
        phi = rad * lat,

        d = toDays(date),
        n = julianCycle(d, lw),
        ds = approxTransit(0, lw, n),

        M = solarMeanAnomaly(ds),
        L = eclipticLongitude(M),
        dec = declination(L, 0),

        Jnoon = solarTransitJ(ds, M, L),

        i, len, time, Jset, Jrise;


    var result = {
        solarNoon: fromJulian(Jnoon),
        nadir: fromJulian(Jnoon - 0.5)
    };

    for (i = 0, len = times.length; i < len; i += 1) {
        time = times[i];

        Jset = getSetJ(time[0] * rad, lw, phi, dec, n, M, L);
        Jrise = Jnoon - (Jset - Jnoon);

        result[time[1]] = fromJulian(Jrise);
        result[time[2]] = fromJulian(Jset);
    }

    return result;
};


// moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

function moonCoords(d) { // geocentric ecliptic coordinates of the moon

    var L = rad * (218.316 + 13.176396 * d), // ecliptic longitude
        M = rad * (134.963 + 13.064993 * d), // mean anomaly
        F = rad * (93.272 + 13.229350 * d),  // mean distance

        l  = L + rad * 6.289 * sin(M), // longitude
        b  = rad * 5.128 * sin(F),     // latitude
        dt = 385001 - 20905 * cos(M);  // distance to the moon in km

    return {
        ra: rightAscension(l, b),
        dec: declination(l, b),
        dist: dt
    };
}

SunCalc.getMoonPosition = function (date, lat, lng) {

    var lw  = rad * -lng,
        phi = rad * lat,
        d   = toDays(date),

        c = moonCoords(d),
        H = siderealTime(d, lw) - c.ra,
        h = altitude(H, phi, c.dec),
        // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));

    h = h + astroRefraction(h); // altitude correction for refraction

    return {
        azimuth: azimuth(H, phi, c.dec),
        altitude: h,
        distance: c.dist,
        parallacticAngle: pa
    };
};


// calculations for illumination parameters of the moon,
// based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
// Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.

SunCalc.getMoonIllumination = function (date) {

    var d = toDays(date || new Date()),
        s = sunCoords(d),
        m = moonCoords(d),

        sdist = 149598000, // distance from Earth to Sun in km

        phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
        inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)),
        angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) -
                cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

    return {
        fraction: (1 + cos(inc)) / 2,
        phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
        angle: angle
    };
};


function hoursLater(date, h) {
    return new Date(date.valueOf() + h * dayMs / 24);
}

// calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article

SunCalc.getMoonTimes = function (date, lat, lng, inUTC) {
    var t = new Date(date);
    if (inUTC) t.setUTCHours(0, 0, 0, 0);
    else t.setHours(0, 0, 0, 0);

    var hc = 0.133 * rad,
        h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc,
        h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;

    // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
    for (var i = 1; i <= 24; i += 2) {
        h1 = SunCalc.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
        h2 = SunCalc.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;

        a = (h0 + h2) / 2 - h1;
        b = (h2 - h0) / 2;
        xe = -b / (2 * a);
        ye = (a * xe + b) * xe + h1;
        d = b * b - 4 * a * h1;
        roots = 0;

        if (d >= 0) {
            dx = Math.sqrt(d) / (Math.abs(a) * 2);
            x1 = xe - dx;
            x2 = xe + dx;
            if (Math.abs(x1) <= 1) roots++;
            if (Math.abs(x2) <= 1) roots++;
            if (x1 < -1) x1 = x2;
        }

        if (roots === 1) {
            if (h0 < 0) rise = i + x1;
            else set = i + x1;

        } else if (roots === 2) {
            rise = i + (ye < 0 ? x2 : x1);
            set = i + (ye < 0 ? x1 : x2);
        }

        if (rise && set) break;

        h0 = h2;
    }

    var result = {};

    if (rise) result.rise = hoursLater(t, rise);
    if (set) result.set = hoursLater(t, set);

    if (!rise && !set) result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;

    return result;
};


// export as Node module / AMD module / browser variable
if (typeof exports === 'object' && typeof module !== 'undefined') module.exports = SunCalc;
else if (typeof define === 'function' && define.amd) define(SunCalc);
else window.SunCalc = SunCalc;

}());

},{}],2:[function(require,module,exports){
const SunCalc = require('suncalc');

const astro = "#022660"
const nautical = "#6D54A9"
const civil = "#CE75C2"
const sun = "#FAFA00"
const golden = "#ff69b4"
const noon = "#84cdee"
const afternoon = "#84cdee"

now = new Date();
//now = new Date(Sat Aug 31 2019 13:36:46 GMT-0500 (hora de verano central));

dateFormat = (date) => {date.getHours() + ":" + date.getMinutes()}
navigator.geolocation.getCurrentPosition((position) => {

	console.log(position)
    
	sunTimes = SunCalc.getTimes( now, position.coords.latitude, position.coords.longitude);
	sunPosition = SunCalc.getPosition( now, position.coords.latitude, position.coords.longitude);
    moonPosition = SunCalc.getMoonPosition( now, position.coords.latitude, position.coords.longitude)
    moonTimes = SunCalc.getMoonTimes( now, position.coords.latitude, position.coords.longitude)
    moonIllumination = SunCalc.getMoonIllumination( now, position.coords.latitude, position.coords.longitude)

	console.log(sunTimes);
	console.log(sunPosition);

	console.log('moon ', moonPosition)
    console.log('moonTimes ', moonTimes)

    const formatDate = (date) => `${date.getHours()<10 ? '0' :''}${date.getHours()}:${date.getMinutes()<10 ? '0' :''}${date.getMinutes()}`;
    document.getElementById('nightEnd').innerText = `night end: ${formatDate(sunTimes.nightEnd)}`;
    document.getElementById('nauticalDawn').innerText = `nautical dawn: ${formatDate(sunTimes.nauticalDawn)}`;
	document.getElementById('dawn').innerText = `dawn: ${formatDate(sunTimes.dawn)}`;
    document.getElementById('sunrise').innerText = `sunrise:  ${formatDate(sunTimes.sunrise)}`;
	document.getElementById('gham').innerText = `golden hour a.m.  ${formatDate(sunTimes.sunriseEnd)} -  ${formatDate(sunTimes.goldenHourEnd)}`;
	document.getElementById('ghpm').innerText = `golden hour p.m.  ${formatDate(sunTimes.goldenHour)} -  ${formatDate(sunTimes.sunsetStart)}`;
    document.getElementById('solarNoon').innerText = `solar noon: ${formatDate(sunTimes.solarNoon)}`;
	document.getElementById('sunset').innerText = `sunset: ${formatDate(sunTimes.sunset)}`;
    document.getElementById('dusk').innerText = `dusk: ${formatDate(sunTimes.dusk)}`;
    document.getElementById('nauticalDusk').innerText = `nautical dusk: ${formatDate(sunTimes.nauticalDusk)}`;
    document.getElementById('night').innerText = `night: ${formatDate(sunTimes.night)}`;

    document.getElementById('moonrise').innerText = `moonrise: ${formatDate(moonTimes.rise)}`;
    document.getElementById('moonset').innerText = `moonset: ${formatDate(moonTimes.set)}`;
    document.getElementById('altitude').innerText = `altitude: ${(moonPosition.altitude).toFixed(2)}`;
    document.getElementById('phase').innerText = `phase : ${(moonIllumination.phase).toFixed(2)}`;
    const isNight = now > sunTimes.night.getTime()
    var target = document.getElementById('foo');
    if (!isNight) {
        var opts = {
            angle: 0, // The span of the gauge arc
            lineWidth: 0.44, // The line thickness
            radiusScale: 1, // Relative radius
            pointer: {
              length: 0.6, // // Relative to gauge radius
              strokeWidth: 0.035, // The thickness
              color: '#000000' // Fill color
            },
            limitMax: false,     // If false, max value increases automatically if value > maxValue
            limitMin: false,     // If true, the min value of the gauge will be fixed
            colorStart: '#6FADCF',   // Colors
            colorStop: '#8FC0DA',    // just experiment with them
            strokeColor: '#E0E0E0',  // to see which ones work best for you
            generateGradient: true,
            highDpiSupport: true,     // High resolution support
      
              staticZones: [
                 {strokeStyle: astro, min: sunTimes.nightEnd.getTime(), max: sunTimes.nauticalDawn.getTime()}, // Yellow
                 {strokeStyle: nautical, min: sunTimes.nauticalDawn.getTime(), max: sunTimes.dawn.getTime()}, // Yellow
                 {strokeStyle: civil, min: sunTimes.dawn.getTime(), max: sunTimes.sunrise.getTime()},
                 {strokeStyle: sun, min: sunTimes.sunrise.getTime(), max: sunTimes.sunriseEnd.getTime()}, // Green
                 {strokeStyle: golden, min: sunTimes.sunriseEnd.getTime(), max: sunTimes.goldenHourEnd.getTime()}, // Yellow
                 {strokeStyle: noon, min: sunTimes.goldenHourEnd.getTime(), max: sunTimes.solarNoon.getTime()},  // Red
                 {strokeStyle: afternoon, min: sunTimes.solarNoon.getTime(), max: sunTimes.goldenHour.getTime()},
                 {strokeStyle: golden, min: sunTimes.goldenHour.getTime(), max: sunTimes.sunsetStart.getTime()},
                 {strokeStyle: sun, min: sunTimes.sunsetStart.getTime(), max: sunTimes.sunset.getTime()},
                 {strokeStyle: civil, min: sunTimes.sunset.getTime(), max: sunTimes.dusk.getTime()},
                 {strokeStyle: nautical, min: sunTimes.dusk.getTime(), max: sunTimes.nauticalDusk.getTime()},
                 {strokeStyle: astro, min: sunTimes.nauticalDusk.getTime(), max: sunTimes.night.getTime()},
              ],
            
          };
           // your canvas element
          var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
          gauge.maxValue = sunTimes.night.getTime(); // set max gauge value
          gauge.setMinValue(sunTimes.nightEnd.getTime());  // Prefer setter over gauge.minValue = 0
          gauge.animationSpeed = 32; // set animation speed (32 is default value)
          gauge.set(now.getTime()); // set actual value
    }
    else {
        var opts = {
            angle: 0, // The span of the gauge arc
            lineWidth: 0.44, // The line thickness
            radiusScale: 1, // Relative radius
            pointer: {
              length: 0.6, // // Relative to gauge radius
              strokeWidth: 0.035, // The thickness
              color: '#000000' // Fill color
            },
            limitMax: false,     // If false, max value increases automatically if value > maxValue
            limitMin: false,     // If true, the min value of the gauge will be fixed
            colorStart: '#6FADCF',   // Colors
            colorStop: '#8FC0DA',    // just experiment with them
            strokeColor: '#E0E0E0',  // to see which ones work best for you
            generateGradient: true,
            highDpiSupport: true,     // High resolution support
      
              staticZones: [
                 {strokeStyle: astro, min: sunTimes.nightEnd.getTime(), max:  sunTimes.night.getTime()}, // Yellow

              ],
            
          };
           // your canvas element
          var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
          gauge.maxValue = sunTimes.nightEnd.getTime(); // set max gauge value
          gauge.setMinValue(sunTimes.night.getTime());  // Prefer setter over gauge.minValue = 0
          gauge.animationSpeed = 32; // set animation speed (32 is default value)
          gauge.set(now.getTime()); // set actual value
          target.setAttribute("style", 'transform:scaleX(-1)')
          target.setAttribute("style", 'transform:scaleY(-1)')
    }

    if (true) {
        var moon = document.getElementById('moonCanvas');
        var moonOpts = {
            angle: 0, // The span of the gauge arc
            lineWidth: 0.44, // The line thickness
            radiusScale: 1, // Relative radius
            pointer: {
              length: 0.6, // // Relative to gauge radius
              strokeWidth: 0.035, // The thickness
              color: '#000000' // Fill color
            },
            limitMax: false,     // If false, max value increases automatically if value > maxValue
            limitMin: false,     // If true, the min value of the gauge will be fixed
            colorStart: '#6FADCF',   // Colors
            colorStop: '#8FC0DA',    // just experiment with them
            strokeColor: '#E0E0E0',  // to see which ones work best for you
            generateGradient: true,
            highDpiSupport: true,     // High resolution support
      
              staticZones: [
                 {strokeStyle: nautical, min: moonTimes.set.getTime(), max: moonTimes.rise.getTime()}, // Yellow
              ],
            
          };
           // your canvas element
          var moongauge = new Gauge(moon).setOptions(moonOpts); 

          moongauge.maxValue = moonTimes.set.getTime(); 
          moongauge.setMinValue(moonTimes.rise.getTime());
          moongauge.animationSpeed = 32; 
          moongauge.set(now.getTime());
    }

	// const illoRotation = now > sunTimes.solarNoon ? { z: sunPosition.altitude, y: Zdog.TAU/2 } : { z: sunPosition.altitude } 
	// 	let illo = new Zdog.Illustration({
	// 		  // set canvas with selector
	// 		  element: '.zdog-canvas',
	// 		  rotate: illoRotation,
	// 		  dragRotate: true,
	// 		});

 // 		let partyHat = new Zdog.Cone({
	// 	  addTo: illo,
	// 	  rotate: {  y: Zdog.TAU/4 },
	// 	  diameter: 70,
	// 	  length: 90,
	// 	  stroke: false,
	// 	  color: '#636',
	// 	  backface: '#C25',
	// 	});

	// 	illo.updateRenderGraph();

	// 	function animate() {
	// 	  //illo.rotate.z -= 0.01
	// 	  illo.updateRenderGraph();
	// 	  // animate next frame
	// 	  requestAnimationFrame( animate );
	// 	}
	// 	animate();
});

},{"suncalc":1}]},{},[2]);
