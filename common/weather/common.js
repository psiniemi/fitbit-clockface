export const Conditions = {
  ClearSky        : 0,
  FewClouds       : 1,
  ScatteredClouds : 2,
  BrokenClouds    : 3,
  ShowerRain      : 4,
  Rain            : 5,
  Thunderstorm    : 6,
  Snow            : 7,
  Mist            : 8,
  Unknown         : 1000,
};

export var WEATHER_MESSAGE_KEY = "wthr_msg";
export var WEATHER_DATA_FILE   = "weather.cbor";
export var WEATHER_ERROR_FILE  = "weather_error.cbor";
