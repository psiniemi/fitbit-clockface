export const WEATHER_MESSAGE_KEY = "wthr_msg";
export const WEATHER_DATA_FILE   = "weather.cbor";
export const WEATHER_ERROR_FILE  = "weather_error.cbor";

// Each value of Fitbit's `WeatherCondition` enum has a matching PNG in
// `resources/` named after the enum value (e.g. `SunnyDay.png`,
// `MostlyCloudyWithThunderstormsDay.png`). The icon for a given condition
// is therefore just `condition + ".png"` — no lookup table required.
//
// All icons are meteocons line-style baked yellow at 51×51 with 2x stroke,
// except the `Flurries` snowflake which is from lucide (the meteocons
// snowflake renders as a double-line outline at small sizes). Thunderstorm
// variants use meteocons `thunderstorms-overcast` (plain Thunderstorms),
// `thunderstorms-day` (Day-suffixed enums), and `thunderstorms-night`
// (Night-suffixed enums) — meteocons' bare-bolt `thunderstorms` lacks the
// cloud cue and reads poorly at this size.
