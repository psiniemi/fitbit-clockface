import { me } from "companion";
import { settingsStorage } from "settings";
import { device } from "peer";
import { Image } from "image";
import { outbox } from "file-transfer";
import { peerSocket } from "messaging";

import Weather from '../common/weather/phone';

me.monitorSignificantLocationChanges = true;

settingsStorage.setItem("screenWidth", device.screen.width);
settingsStorage.setItem("screenHeight", device.screen.height);

const weather = new Weather();
weather.setTemperatureUnit(currentTemperatureUnit());

settingsStorage.addEventListener("change", (evt) => {
  console.log("settings change: " + evt.key);
  if (evt.key === "temperatureUnit") {
    const unit = currentTemperatureUnit();
    console.log("settings: temperatureUnit -> " + unit);
    weather.setTemperatureUnit(unit);
  } else if (evt.key === "background-image" && evt.newValue) {
    sendBackgroundImage(evt.newValue);
  } else if (evt.key && evt.key.indexOf("corner-") === 0) {
    sendCorners();
  }
});

peerSocket.addEventListener("open", () => {
  sendCorners();
});

function currentTemperatureUnit() {
  return readSelect("temperatureUnit", "celsius");
}

function readSelect(key, defaultValue) {
  const raw = settingsStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.values && parsed.values[0] && parsed.values[0].value) {
      return parsed.values[0].value;
    }
  } catch (e) {}
  return defaultValue;
}

function sendCorners() {
  if (peerSocket.readyState !== peerSocket.OPEN) return;
  const corners = {
    TL: readSelect("corner-tl", "steps"),
    TR: readSelect("corner-tr", "weather"),
    BL: readSelect("corner-bl", "heartRate"),
    BR: readSelect("corner-br", "activeMinutes")
  };
  console.log("sending corners: " + JSON.stringify(corners));
  peerSocket.send({ corners_msg: corners });
}

function sendBackgroundImage(settingsValue) {
  const imageData = JSON.parse(settingsValue);
  Image.from(imageData.imageUri)
    .then((image) => image.export("image/jpeg", { background: "#000000", quality: 60 }))
    .then((buffer) => outbox.enqueue(`bg-${Date.now()}.jpg`, buffer))
    .catch((err) => console.log("Failed to send background: " + err));
}
