import clock from "clock";
import document from "document";
import * as fs from "fs";
import { me } from "appbit";
import { inbox } from "file-transfer";

import * as util from "../common/utils";
import Weather from '../common/weather/device';
import { iconForCondition } from '../common/weather/common';

import { today } from "user-activity";
import { HeartRateSensor } from "heart-rate";
import { battery, charger } from "power";
import { colorGradient } from "../common/gradient";

clock.granularity = "seconds";

const SETTINGS_FILE = "settings.cbor";
let mySettings = {};
try {
  mySettings = fs.readFileSync(SETTINGS_FILE, "cbor");
} catch (e) {
  mySettings = {};
}

let weather = new Weather();

let showWeather = function(data) {
  if (data) {
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 19;
    document.getElementById("weather").href = iconForCondition(data.condition, isDay) + ".png";
    const unitSuffix = (data.temperatureUnit === "fahrenheit") ? "°F" : "°C";
    document.getElementById("temperature").text = "" + Math.round(data.temperature) + unitSuffix;
  }
}

weather.onsuccess = showWeather;

weather.onerror = (error) => {
  console.log("Weather error " + JSON.stringify(error));
}

weather.setMaximumAge(300000);

let backgroundImage = document.getElementById("background");
let clockLabel = document.getElementById("clock");
let dateLabel = document.getElementById("date");
let stepData = document.getElementById("step-data");
let heartData = document.getElementById("heart-data");
let btry = document.getElementById("battery");
let hrm = new HeartRateSensor();

if (mySettings.bg) {
  try {
    fs.statSync(mySettings.bg);
    backgroundImage.image = mySettings.bg;
  } catch (e) {
    delete mySettings.bg;
  }
}

inbox.addEventListener("newfile", () => {
  let fileName;
  while ((fileName = inbox.nextFile())) {
    if (mySettings.bg) {
      try { fs.unlinkSync(mySettings.bg); } catch (e) {}
    }
    mySettings.bg = `/private/data/${fileName}`;
    backgroundImage.image = mySettings.bg;
  }
});

me.onunload = () => {
  fs.writeFileSync(SETTINGS_FILE, mySettings, "cbor");
};

hrm.onreading = function() {
  heartData.text = "" + hrm.heartRate;
}
hrm.start();

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
  btry.width = Math.floor((battery.chargeLevel * 348) / 100);
  btry.style.fill = color;
}
let fetchWeather = function() {
  weather.fetch();
}

clock.ontick = () => updateClock();
charger.onchange = () => refreshCharge();
refreshSteps();
refreshCharge();
weather.fetch();
setInterval(refreshSteps, 5000);
setInterval(refreshCharge, 60000);
setInterval(fetchWeather, 25000);
