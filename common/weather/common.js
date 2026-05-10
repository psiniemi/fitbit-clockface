export const WEATHER_MESSAGE_KEY = "wthr_msg";
export const WEATHER_DATA_FILE   = "weather.cbor";
export const WEATHER_ERROR_FILE  = "weather_error.cbor";

// Each value of Fitbit's `WeatherCondition` enum has a matching PNG in
// `resources/` named after the enum value (e.g. `SunnyDay.png`,
// `MostlyCloudyWithThunderstormsDay.png`). The icon for a given condition
// is therefore just `condition + ".png"` — no lookup table required.
//
// Most icons are meteocons line-style baked yellow at 51×51 with 2x stroke;
// the `Flurries` snowflake is from lucide; the five thunderstorm variants
// reuse the original cloud+bolt OWM-style icon because the meteocons
// thunderstorm is a bare bolt with no cloud.
