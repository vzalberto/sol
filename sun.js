const SunCalc = require('suncalc');
const astro = "#022660"
const nautical = "#6D54A9"
const civil = "#CE75C2"
const sun = "#FAFA00"
const golden = "#ff69b4"
const noon = "#84cdee"
const afternoon = "#84cdee"

var latitude = 20.1225;
var longitude = -98.736111;

now = new Date();
//now = new Date(Sat Aug 31 2019 13:36:46 GMT-0500 (hora de verano central));

dateFormat = (date) => date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() 

deltaDayDuration = () => {

	const today = Date.now()

	let yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)

	let tomorrow = new Date(today)
	tomorrow.setDate(tomorrow.getDate() + 1)

	sunToday = SunCalc.getTimes(today, latitude, longitude)
	sunYesterday = SunCalc.getTimes(yesterday, latitude, longitude)
	sunTomorrow = SunCalc.getTimes(tomorrow, latitude, longitude)

	durationToday = sunToday.sunset - sunToday.sunrise
	durationYesterday = sunYesterday.sunset - sunYesterday.sunrise
	durationTomorrow = sunTomorrow.sunset - sunTomorrow.sunrise

	return [durationToday, durationYesterday, durationTomorrow]
}

deltaSolarNoon = (date) => {
	let yesterday = new Date(date)
	yesterday.setDate(date.getDate() - 1)

	yesterdaySunTimes = SunCalc.getTimes(yesterday, latitude, longitude)

	return dateFormat(yesterdaySunTimes.solarNoon)
}

deltaDawn = (date) => {
	let yesterday = new Date(date)
	yesterday.setDate(date.getDate() - 1)

	yesterdaySunTimes = SunCalc.getTimes(yesterday, latitude, longitude)

	return dateFormat(yesterdaySunTimes.dawn)
}

deltaDusk = (date) => {
	let yesterday = new Date(date)
	yesterday.setDate(date.getDate() - 1)

	yesterdaySunTimes = SunCalc.getTimes(yesterday, latitude, longitude)

	return dateFormat(yesterdaySunTimes.dusk)
}
navigator.geolocation.getCurrentPosition((position) => {
	latitude = position.coords.latitude
	longitude = position.coords.longitude
	console.log(position)
	document.getElementById('latlng').innerText = `${position.coords.latitude}, ${position.coords.longitude}`;
	//now = new Date('Sat Aug 31 2019 19:23:45 GMT-0500 (hora de verano central)');
	sunTimes = SunCalc.getTimes(now, latitude, longitude);
	sunPosition = SunCalc.getPosition(now, position.coords.latitude, position.coords.longitude);

	console.log(sunTimes);
	console.log(sunPosition)

	document.getElementById('gham').innerText = `golden hour a.m. ${sunTimes.sunriseEnd.getHours()}:${sunTimes.sunriseEnd.getMinutes()} - ${sunTimes.goldenHourEnd.getHours()}:${sunTimes.goldenHourEnd.getMinutes()}`;
	document.getElementById('ghpm').innerText = `golden hour p.m. ${sunTimes.goldenHour.getHours()}:${sunTimes.goldenHour.getMinutes()} - ${sunTimes.sunsetStart.getHours()}:${sunTimes.sunsetStart.getMinutes()}`;
	document.getElementById('solarNoon').innerText = `solar noon: ${dateFormat(sunTimes.solarNoon)} delta: ${deltaSolarNoon(sunTimes.solarNoon)}`;
	document.getElementById('dawn').innerText = `dawn: ${dateFormat(sunTimes.dawn)} delta: ${deltaDawn(sunTimes.dawn)}`;
	document.getElementById('dusk').innerText = `dusk: ${dateFormat(sunTimes.dusk)} delta: ${deltaDusk(sunTimes.dusk)}`;
	
	document.getElementById('luzManana').innerText = `luz de mañana: ${deltaDayDuration()[2] / 1000 / 60 / 60 } horas`
	document.getElementById('luzHoy').innerText = `luz de hoy: ${deltaDayDuration()[0] / 1000 / 60 / 60 } horas`
	document.getElementById('luzAyer').innerText = `luz de ayer: ${deltaDayDuration()[1] / 1000 / 60 / 60 } horas`

	// document.getElementById('goldenHourEnd').innerText = `goldenHourEnd: ${sunTimes.goldenHourEnd}`;
	// document.getElementById('solarNoon').innerText = `solarNoon: ${sunTimes.solarNoon}`;
	// document.getElementById('goldenHour').innerText = `goldenHour: ${sunTimes.goldenHour}`;
	// document.getElementById('sunset').innerText = `Set: ${sunTimes.sunset}`;
	// document.getElementById('night').innerText = `night: ${sunTimes.night}`;

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
	var target = document.getElementById('foo'); // your canvas element
	var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
	gauge.maxValue = sunTimes.night.getTime(); // set max gauge value
	gauge.setMinValue(sunTimes.nightEnd.getTime());  // Prefer setter over gauge.minValue = 0
	gauge.animationSpeed = 32; // set animation speed (32 is default value)
	gauge.set(now.getTime()); // set actual value

	//const illoRotation = now > sunTimes.solarNoon ? { z: sunPosition.altitude, y: Zdog.TAU/2 } : { z: sunPosition.altitude } 
	deltaAyer = 100 - deltaDayDuration()[1] * 100 / deltaDayDuration()[0]
	deltaMañana = 100 - deltaDayDuration()[2] * 100 / deltaDayDuration()[0]
	document.getElementById('deltaAyer').innerText = `variación: ${deltaAyer} %`
	document.getElementById('deltaManana').innerText = `variación: ${deltaMañana} %`

	let illo = new Zdog.Illustration({
		  // set canvas with selector
		  element: '.zdog-canvas',
		  dragRotate: true,
		  rotate: { x : -Zdog.TAU / 12, y : - Zdog.TAU / 12, z : Zdog.TAU / 12 }
		  //rotate: { y : Zdog.TAU / 4}
		});

	let today = new Zdog.Cylinder({
		  addTo: illo,
		  diameter: 30,
		  length: deltaDayDuration()[0] / 1000000,
		  stroke: false,
		  color: '#C25',
		  backface: '#E62',
		});

	let yesterday = new Zdog.Cylinder({
		  addTo: illo,
		  diameter: 30,
		  length: deltaDayDuration()[1] / 1000000,
		  translate: { y : 45 },
		  stroke: false,
		  color: '#f9b',
		  backface: '#E62',
		});

	let tomorrow = new Zdog.Cylinder({
		  addTo: illo,
		  diameter: 30,
		  length: deltaDayDuration()[2] / 1000000,
		  translate: { y : -45 },
		  stroke: false,
		  color: '#f9b',
		  backface: '#E62',
		});

	function animate () {
		  illo.updateRenderGraph();
		  
		  // animate next frame
		  requestAnimationFrame( animate );
		}	
	
	illo.updateRenderGraph();
	animate();


	// let box = new Zdog.Box({
	//   addTo: illo,
	//   width: 120,
	//   height: 100,
	//   depth: 80,
	//   stroke: false,
	//   color: '#C25', // default face color
	//   leftFace: '#EA0',
	//   rightFace: '#E62',
	//   topFace: '#ED0',
	//   bottomFace: '#636',
	// });

 	// 	let partyHat = new Zdog.Cone({
		//   addTo: illo,
		//   rotate: {  y: Zdog.TAU/4 },
		//   diameter: 70,
		//   length: 90,
		//   stroke: false,
		//   color: '#636',
		//   backface: '#C25',
		// });
});
