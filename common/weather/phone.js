import { peerSocket } from "messaging";
import { geolocation } from "geolocation";
import { outbox } from "file-transfer";
import * as cbor from "cbor";

import { WEATHER_MESSAGE_KEY, WEATHER_DATA_FILE, WEATHER_ERROR_FILE, Conditions } from './common.js';

export default class Weather {
  
  constructor() {
    this._apiKey = '';
    this._provider = 'owm';
    this._feelsLike = true;
    this._weather = undefined;
    this._maximumAge = 300000;

    this.onerror = undefined;
    this.onsuccess = undefined;
    
    peerSocket.addEventListener("message", (evt) => {
      // We are receiving a request from the app
      if (evt.data !== undefined && evt.data[WEATHER_MESSAGE_KEY] !== undefined) {
        let message = evt.data[WEATHER_MESSAGE_KEY];
        prv_fetchRemote(message.provider, message.apiKey, message.feelsLike);
      }
    });
  }
  
  setApiKey(apiKey) {
    this._apiKey = apiKey;
  }
  
  setProvider(provider) {
    this._provider = provider;
  }
  
  setFeelsLike(feelsLike) {
    this._feelsLike = feelsLike;
  }
  
  setMaximumAge(maximumAge) {
    this._maximumAge = maximumAge;
  }
  
  fetch() {
    let now = new Date().getTime();
    if(this._weather !== undefined && this._weather.timestamp !== undefined && (now - this._weather.timestamp < this._maximumAge)) {
      // return previous weather if the maximu age is not reached
      if(this.onsuccess) this.onsuccess(this._weather);
      return;
    }
    
    geolocation.getCurrentPosition(
      (position) => {
        //console.log("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude);
        prv_fetch(this._provider, this._apiKey, this._feelsLike, position.coords.latitude, position.coords.longitude, 
              (data) => {
                data.provider = this._provider;
                this._weather = data;
                if(this.onsuccess) this.onsuccess(data);
              }, 
              this.onerror);
      }, 
      (error) => {
        if(this.onerror) this.onerror(error);
      }, 
      {"enableHighAccuracy" : false, "maximumAge" : 1000 * 1800});
  }
};

/*******************************************/
/*********** PRIVATE FUNCTIONS  ************/
/*******************************************/

function prv_fetchRemote(provider, apiKey, feelsLike) {
  geolocation.getCurrentPosition(
    (position) => {
      prv_fetch(provider, apiKey, feelsLike, position.coords.latitude, position.coords.longitude,
          (data) => {
            data.provider = provider;
            outbox
              .enqueue(WEATHER_DATA_FILE, cbor.encode(data))
              .catch(error => console.log("Failed to send weather: " + error));
          },
          (error) => { 
            outbox
              .enqueue(WEATHER_ERROR_FILE, cbor.encode({ error : error }))
              .catch(error => console.log("Failed to send weather error: " + error));
          }
      );
    }, 
    (error) => {
      outbox
        .enqueue(WEATHER_ERROR_FILE, cbor.encode({ error : error }))
        .catch(error => console.log("Failed to send weather error: " + error));
    }, 
    {"enableHighAccuracy" : false, "maximumAge" : 1000 * 1800});
}

function prv_fetch(provider, apiKey, feelsLike, latitude, longitude, success, error) {
  // console.log("Latitude: " + latitude + " Longitude: " + longitude);
  if( provider === "owm" ) {
    prv_queryOWMWeather(apiKey, latitude, longitude, success, error);
  }
  else if( provider === "wunderground" ) {
    prv_queryWUWeather(apiKey, feelsLike, latitude, longitude, success, error);
  }
  else if( provider === "darksky" ) {
    prv_queryDarkskyWeather(apiKey, feelsLike, latitude, longitude, success, error);
  }
  else if( provider === "weatherbit" ) {
    prv_queryWeatherbit(apiKey, latitude, longitude, success, error);
  }
  else 
  {
    prv_queryYahooWeather(latitude, longitude, success, error);
  }
}

function prv_queryOWMWeather(apiKey, latitude, longitude, success, error) {
  var url = 'https://api.openweathermap.org/data/2.5/weather?appid=' + apiKey + '&lat=' + latitude + '&lon=' + longitude;

  fetch(url)
  .then((response) => {return response.json()})
  .then((data) => { 
      
      if(data.weather === undefined){
        if(error) error(data.message);
        return;
      }

      var condition = parseInt(data.weather[0].icon.substring(0,2), 10);
      switch(condition){
        case 1 :  condition = Conditions.ClearSky; break;
        case 2 :  condition = Conditions.FewClouds;  break;
        case 3 :  condition = Conditions.ScatteredClouds;  break;
        case 4 :  condition = Conditions.BrokenClouds;  break;
        case 9 :  condition = Conditions.ShowerRain;  break;
        case 10 : condition = Conditions.Rain; break;
        case 11 : condition = Conditions.Thunderstorm; break;
        case 13 : condition = Conditions.Snow; break;
        case 50 : condition = Conditions.Mist; break;
        default : condition = Conditions.Unknown; break;
      }

      let weather = {
        //temperatureK : data.main.temp.toFixed(1),
        temperatureC : data.main.temp - 273.15,
        location : data.name,
        description : data.weather[0].description,
        isDay : (data.dt > data.sys.sunrise && data.dt < data.sys.sunset),
        conditionCode : condition,
        realConditionCode : data.weather[0].id,
        sunrise : data.sys.sunrise * 1000,
        sunset : data.sys.sunset * 1000,
        timestamp : new Date().getTime(),
        icon: data.weather[0].icon,
        windspeed: data.wind.speed,
        winddeg: data.wind.deg
      };
      // Send the weather data to the device
      if(success) success(weather);
  })
  .catch((err) => { if(error) error(err); });
};
