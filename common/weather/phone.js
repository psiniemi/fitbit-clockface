import { peerSocket } from "messaging";
import { outbox } from "file-transfer";
import * as cbor from "cbor";
import weather from "weather";

import { WEATHER_MESSAGE_KEY, WEATHER_DATA_FILE, WEATHER_ERROR_FILE } from './common.js';

export default class Weather {

  constructor() {
    this._maximumAge = 300000;
    this._weather = undefined;

    this.onsuccess = undefined;
    this.onerror = undefined;

    peerSocket.addEventListener("message", (evt) => {
      if (evt.data !== undefined && evt.data[WEATHER_MESSAGE_KEY] !== undefined) {
        prv_fetchAndSend();
      }
    });
  }

  setMaximumAge(maximumAge) {
    this._maximumAge = maximumAge;
  }

  fetch() {
    let now = Date.now();
    if (this._weather && this._weather.timestamp && (now - this._weather.timestamp < this._maximumAge)) {
      if (this.onsuccess) this.onsuccess(this._weather);
      return;
    }
    prv_fetch()
      .then((data) => {
        this._weather = data;
        if (this.onsuccess) this.onsuccess(data);
      })
      .catch((err) => {
        if (this.onerror) this.onerror(err);
      });
  }
};

function prv_fetch() {
  return weather.getWeatherData({ temperatureUnit: "celsius" })
    .then((data) => {
      if (!data.locations || data.locations.length === 0) {
        throw new Error("No location data");
      }
      const loc = data.locations[0];
      return {
        temperatureC: loc.currentWeather.temperature,
        condition:    loc.currentWeather.weatherCondition,
        location:     loc.name,
        timestamp:    Date.now()
      };
    });
}

function prv_fetchAndSend() {
  prv_fetch()
    .then((payload) => outbox.enqueue(WEATHER_DATA_FILE, cbor.encode(payload)))
    .catch((err) => {
      const message = (err && err.message) || String(err);
      outbox
        .enqueue(WEATHER_ERROR_FILE, cbor.encode({ error: message }))
        .catch((e) => console.log("Failed to send weather error: " + e));
    });
}
