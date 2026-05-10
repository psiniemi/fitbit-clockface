export const WEATHER_MESSAGE_KEY = "wthr_msg";
export const WEATHER_DATA_FILE   = "weather.cbor";
export const WEATHER_ERROR_FILE  = "weather_error.cbor";

// Map Fitbit's WeatherCondition enum to one of the bundled icon names.
// Conditions without an explicit Day/Night suffix in the enum get the
// suffix from the caller's `isDay` flag.
export function iconForCondition(condition, isDay) {
  const dn = isDay ? "d" : "n";
  switch (condition) {
    case "SunnyDay":
    case "MostlySunnyDay":
    case "HazySunshineDay":
    case "Hot":
      return "01d";
    case "ClearNight":
    case "MostlyClearNight":
    case "HazyMoonlight":
      return "01n";
    case "PartlySunnyDay":
    case "IntermittentCloudsDay":
      return "02d";
    case "PartlyCloudyNight":
    case "IntermittentCloudsNight":
      return "02n";
    case "MostlyCloudyDay":
      return "03d";
    case "MostlyCloudyNight":
      return "03n";
    case "Cloudy":
    case "Overcast":
      return "04" + dn;
    case "MostlyCloudyWithShowersDay":
    case "PartlySunnyWithShowersDay":
      return "09d";
    case "MostlyCloudyWithShowersNight":
    case "PartlyCloudyWithShowersNight":
      return "09n";
    case "Showers":
      return "09" + dn;
    case "Rain":
    case "FreezingRain":
      return "10" + dn;
    case "MostlyCloudyWithThunderstormsDay":
    case "PartlySunnyWithThunderstormsDay":
      return "11d";
    case "MostlyCloudyWithThunderstormsNight":
    case "PartlyCloudyWithThunderstormsNight":
      return "11n";
    case "Thunderstorms":
      return "11" + dn;
    case "MostlyCloudyWithFlurriesDay":
    case "MostlyCloudyWithSnowDay":
    case "PartlySunnyWithFlurriesDay":
      return "13d";
    case "MostlyCloudyWithFlurriesNight":
    case "MostlyCloudyWithSnowNight":
      return "13n";
    case "Snow":
    case "Flurries":
    case "Sleet":
    case "RainAndSnow":
    case "Ice":
      return "13" + dn;
    case "Fog":
    case "Cold":
    case "Windy":
      return "50d";
    default:
      return isDay ? "01d" : "01n";
  }
}
