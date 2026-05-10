import { me } from "companion";
import { settingsStorage } from "settings";
import { device } from "peer";
import { Image } from "image";
import { outbox } from "file-transfer";

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
  }
});

function currentTemperatureUnit() {
  const raw = settingsStorage.getItem("temperatureUnit");
  if (!raw) return "celsius";
  try {
    return JSON.parse(raw).values[0].value;
  } catch (e) {
    return "celsius";
  }
}

function sendBackgroundImage(settingsValue) {
  const imageData = JSON.parse(settingsValue);
  Image.from(imageData.imageUri)
    .then((image) => image.export("image/jpeg", { background: "#000000", quality: 60 }))
    .then((buffer) => outbox.enqueue(`bg-${Date.now()}.jpg`, buffer))
    .catch((err) => console.log("Failed to send background: " + err));
}
