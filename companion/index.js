import { me } from "companion"
me.monitorSignificantLocationChanges = true

// Import the weather module
import Weather from '../common/weather/phone';

// Create the weather object
// this is always needed to answer the device's requests
let weather = new Weather();

const weather_api_key = "0e4c66ae67d6526d3a47354255999771";
weather.setProvider("owm"); 
weather.setApiKey(weather_api_key);
weather.setMaximumAge(25 * 1000); 
weather.setFeelsLike(true);
weather.fetch();