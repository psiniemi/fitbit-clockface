import { peerSocket } from "messaging";
import { outbox } from "file-transfer";
import * as cbor from "cbor";
import weather, { WeatherCondition } from "weather";

import { WEATHER_MESSAGE_KEY, WEATHER_DATA_FILE, WEATHER_ERROR_FILE } from './common.js';

// The runtime returns weatherCondition as a numeric enum value
// (SunnyDay=1, MostlySunnyDay=2, …). Build the inverse lookup once so the
// payload sent to the device carries the string name that matches our
// resource filenames (e.g. "MostlySunnyDay.png").
const CONDITION_NAMES = {};
for (const name in WeatherCondition) {
  CONDITION_NAMES[WeatherCondition[name]] = name;
}

export default class Weather {

  constructor() {
    this._maximumAge = 300000;
    this._temperatureUnit = "celsius";
    this._weather = undefined;

    this.onsuccess = undefined;
    this.onerror = undefined;

    peerSocket.addEventListener("message", (evt) => {
      if (evt.data !== undefined && evt.data[WEATHER_MESSAGE_KEY] !== undefined) {
        this._fetchAndSend();
      }
    });
  }

  setMaximumAge(maximumAge) {
    this._maximumAge = maximumAge;
  }

  setTemperatureUnit(unit) {
    this._temperatureUnit = unit;
  }

  fetch() {
    let now = Date.now();
    if (this._weather && this._weather.timestamp && (now - this._weather.timestamp < this._maximumAge)) {
      if (this.onsuccess) this.onsuccess(this._weather);
      return;
    }
    this._fetch()
      .then((data) => {
        this._weather = data;
        if (this.onsuccess) this.onsuccess(data);
      })
      .catch((err) => {
        if (this.onerror) this.onerror(err);
      });
  }

  _fetch() {
    const unit = this._temperatureUnit;
    console.log("weather: fetching, unit=" + unit);
    return weather.getWeatherData({ temperatureUnit: unit })
      .then((data) => {
        if (!data.locations || data.locations.length === 0) {
          throw new Error("No location data");
        }
        const loc = data.locations[0];
        const conditionName = CONDITION_NAMES[loc.currentWeather.weatherCondition] || "SunnyDay";
        console.log("weather: got " + loc.name + " " + loc.currentWeather.temperature + " " + conditionName);
        return {
          temperature:     loc.currentWeather.temperature,
          temperatureUnit: unit,
          condition:       conditionName,
          location:        loc.name,
          timestamp:       Date.now()
        };
      });
  }

  _fetchAndSend() {
    this._fetch()
      .then((payload) => outbox.enqueue(WEATHER_DATA_FILE, cbor.encode(payload)))
      .catch((err) => {
        const message = (err && err.message) || String(err);
        console.log("weather: fetch failed: " + message);
        outbox
          .enqueue(WEATHER_ERROR_FILE, cbor.encode({ error: message }))
          .catch((e) => console.log("Failed to send weather error: " + e));
      });
  }
};
