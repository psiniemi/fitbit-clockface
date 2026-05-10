import clock from "clock";
import document from "document";
import * as fs from "fs";
import { me } from "appbit";
import { inbox } from "file-transfer";
import { peerSocket } from "messaging";

import * as util from "../common/utils";
import Weather from '../common/weather/device';

import { today } from "user-activity";
import { HeartRateSensor } from "heart-rate";
import { battery, charger } from "power";
import { colorGradient } from "../common/gradient";

clock.granularity = "seconds";

const SETTINGS_FILE = "settings.cbor";
const DEFAULT_CORNERS = { TL: "steps", TR: "weather", BL: "heartRate", BR: "activeMinutes" };

let mySettings = {};
try {
  mySettings = fs.readFileSync(SETTINGS_FILE, "cbor");
} catch (e) {
  mySettings = {};
}
if (!mySettings.corners) mySettings.corners = DEFAULT_CORNERS;

const SLOTS = ["TL", "TR", "BL", "BR"];

// y for top row text aligns with top icons (mid-icon when icon shown).
// Bottom row keeps the original heart-data baseline so the layout is
// stable when toggling weather on/off.
const CORNER_LAYOUT = {
  TL: {
    textOnly: { x: 27,  y: 57  },
    withIcon: { x: 70,  y: 60  },
    icon:     { x: 14,  y: 17  }
  },
  TR: {
    textOnly: { x: 309, y: 57  },
    withIcon: { x: 265, y: 60  },
    icon:     { x: 270, y: 17  }
  },
  BL: {
    textOnly: { x: 27,  y: 312 },
    withIcon: { x: 70,  y: 312 },
    icon:     { x: 14,  y: 265 }
  },
  BR: {
    textOnly: { x: 309, y: 312 },
    withIcon: { x: 265, y: 312 },
    icon:     { x: 270, y: 265 }
  }
};

const backgroundImage = document.getElementById("background");
const clockLabel      = document.getElementById("clock");
const dateLabel       = document.getElementById("date");
const btry            = document.getElementById("battery");

const cornerEls = {};
const iconEls   = {};
for (const slot of SLOTS) {
  cornerEls[slot] = document.getElementById(`corner-${slot.toLowerCase()}`);
  iconEls[slot]   = document.getElementById(`icon-${slot.toLowerCase()}`);
}

let cachedWeather = null;
const hrm = new HeartRateSensor();
hrm.onreading = () => renderCorners();

if (mySettings.bg) {
  try {
    fs.statSync(mySettings.bg);
    backgroundImage.image = mySettings.bg;
  } catch (e) {
    delete mySettings.bg;
  }
}

let weather = new Weather();
weather.onsuccess = (data) => {
  cachedWeather = data;
  renderCorners();
};
weather.onerror = (error) => {
  console.log("Weather error " + JSON.stringify(error));
};
weather.setMaximumAge(300000);

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

peerSocket.addEventListener("message", (evt) => {
  if (evt.data && evt.data.corners_msg) {
    mySettings.corners = evt.data.corners_msg;
    syncHeartRateSensor();
    renderCorners();
  }
});

me.onunload = () => {
  fs.writeFileSync(SETTINGS_FILE, mySettings, "cbor");
};

function renderCorners() {
  for (const slot of SLOTS) {
    renderCorner(slot);
  }
}

function renderCorner(slot) {
  const option = mySettings.corners[slot] || "none";
  const text   = cornerEls[slot];
  const icon   = iconEls[slot];
  const layout = CORNER_LAYOUT[slot];

  icon.style.display = "none";
  text.x = layout.textOnly.x;
  text.y = layout.textOnly.y;
  text.text = "";

  switch (option) {
    case "none":
      break;
    case "steps":
      text.text = "" + (today.local.steps || 0);
      break;
    case "heartRate":
      text.text = hrm.heartRate ? "" + hrm.heartRate : "--";
      break;
    case "calories":
      text.text = "" + (today.local.calories || 0);
      break;
    case "activeMinutes": {
      const azm = today.local.activeZoneMinutes;
      text.text = "" + ((azm && azm.total) || 0);
      break;
    }
    case "location":
      text.text = (cachedWeather && cachedWeather.location) || "--";
      break;
    case "weather":
      if (cachedWeather) {
        icon.href = cachedWeather.condition + ".png";
        icon.x = layout.icon.x;
        icon.y = layout.icon.y;
        icon.style.display = "inline";
        text.x = layout.withIcon.x;
        text.y = layout.withIcon.y;
        const unitSuffix = cachedWeather.temperatureUnit === "fahrenheit" ? "°F" : "°C";
        text.text = "" + Math.round(cachedWeather.temperature) + unitSuffix;
      } else {
        text.text = "--";
      }
      break;
  }
}

function syncHeartRateSensor() {
  const wantsHr = SLOTS.some((s) => mySettings.corners[s] === "heartRate");
  if (wantsHr && !hrm.activated) hrm.start();
  else if (!wantsHr && hrm.activated) hrm.stop();
}

function updateClock() {
  const now = new Date();
  const hours  = util.monoDigits(now.getHours());
  const mins   = util.monoDigits(now.getMinutes());
  const secs   = util.monoDigits(now.getSeconds());
  const days   = now.getDate();
  const months = now.getMonth() + 1;

  clockLabel.text = `${hours}:${mins}:${secs}`;
  dateLabel.text  = `${days}|${months}`;
}

function refreshActivityCorners() {
  for (const slot of SLOTS) {
    const opt = mySettings.corners[slot];
    if (opt === "steps" || opt === "calories" || opt === "activeMinutes") {
      renderCorner(slot);
    }
  }
}

function refreshCharge() {
  let color = "#00ff00";
  if (battery.chargeLevel != 100) {
    if (charger.connected) {
      color = colorGradient((battery.chargeLevel) / 100, "#9000cc", "#00f6cc", "#005dcc");
    } else {
      color = colorGradient((battery.chargeLevel) / 100, "#cc0000", "#cccc00", "#00cc00");
    }
  }
  btry.width = Math.floor((battery.chargeLevel * 348) / 100);
  btry.style.fill = color;
}

clock.ontick      = () => updateClock();
charger.onchange  = () => refreshCharge();

syncHeartRateSensor();
renderCorners();
refreshCharge();
weather.fetch();

setInterval(refreshActivityCorners, 5000);
setInterval(refreshCharge, 60000);
setInterval(() => weather.fetch(), 25000);
