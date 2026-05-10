import { me } from "companion";
import Weather from '../common/weather/phone';

me.monitorSignificantLocationChanges = true;

new Weather();
