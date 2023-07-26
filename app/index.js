import clock from "clock";
import document from "document";

import * as util from "../common/utils";
import Weather from '../common/weather/device';

import { today } from "user-activity";
import { HeartRateSensor } from "heart-rate";
import { vibration } from "haptics";
import { battery, charger } from "power";
import { colorGradient } from "../common/gradient";

// Update the clock every minute
clock.granularity = "seconds";

const weather_api_key = "0e4c66ae67d6526d3a47354255999771";
let weather = new Weather();

let showWeather = function(data) {
  if (data) {
    document.getElementById("weather").href = data.icon + ".png";
    document.getElementById("temperature").text = "" + Math.round(data.temperatureC) + "°C";
  }
}

// Display the weather data received from the companion
weather.onsuccess = showWeather

weather.onerror = (error) => {
  console.log("Weather error " + JSON.stringify(error))
}

weather.setProvider("owm"); 
weather.setApiKey(weather_api_key);
weather.setMaximumAge(300000); 
weather.setFeelsLike(true);

// Get a handle on the <text> element
let image = document.getElementById("background");
let view =  document.getElementById("view");
let clockLabel = document.getElementById("clock");
let dateLabel = document.getElementById("date");
let stepData = document.getElementById("step-data");
let heartData = document.getElementById("heart-data");
let btry = document.getElementById("battery");
let hrm = new HeartRateSensor();

hrm.onreading = function() {
  heartData.text = "" + hrm.heartRate;
}
hrm.start();
// Update the <text> element with the current time
function updateClock() {
  let today = new Date();
  let hours = util.monoDigits(today.getHours());
  let mins = util.monoDigits(today.getMinutes());
  let secs = util.monoDigits(today.getSeconds())
  let days = today.getDate();
  let months = today.getMonth() + 1;
  
  clockLabel.text = `${hours}:${mins}:${secs}`;
  dateLabel.text = `${days}|${months}`;
}

function refreshSteps() {
  stepData.text = today.local.steps || "0";
}
function refreshCharge() {
  var color = "#00ff00";
  if (battery.chargeLevel != 100) {
    if (charger.connected) {
      color = colorGradient((battery.chargeLevel) / 100, "#9000cc", "#00f6cc" , "#005dcc");
    } else {
      color = colorGradient((battery.chargeLevel) / 100, "#cc0000", "#cccc00" , "#00cc00");
    }
  }
  console.log("Color is: " + color);
  btry.width = Math.floor((battery.chargeLevel * 348) / 100);
  btry.style.fill = color;
}
let fetchWeather = function() {
  weather.fetch();
}

// Update the clock every tick event
clock.ontick = () => updateClock();
charger.onchange = () => refreshCharge();
//setTimeOut(refreshData, 500);
refreshSteps();
refreshCharge();
weather.fetch();
setInterval(refreshSteps, 5000);
setInterval(refreshCharge, 60000);
setInterval(fetchWeather, 25000);
