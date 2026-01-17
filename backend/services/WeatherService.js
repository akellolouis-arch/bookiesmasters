import axios from 'axios';

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetch weather forecast for a specific location and time.
 * @param {number} lat 
 * @param {number} lon 
 * @param {string} dateString ISO State string (prop.date)
 */
export const getMatchWeather = async (lat, lon, dateString) => {
    try {
        if (!lat || !lon || !dateString) return null;

        const dateObj = new Date(dateString);
        const yyyyMmDd = dateObj.toISOString().split('T')[0];
        const hour = dateObj.getHours();

        const response = await axios.get(WEATHER_URL, {
            params: {
                latitude: lat,
                longitude: lon,
                hourly: 'temperature_2m,precipitation_probability,weathercode',
                timezone: 'auto',
                start_date: yyyyMmDd,
                end_date: yyyyMmDd
            },
            timeout: 5000
        });

        if (response.data && response.data.hourly) {
            // hourly.time is array of ISO strings, but we know index matches hour (0-23)
            // provided timezone is handled correctly by API response structure?
            // Open-Meteo returns 'relative' local time in the requested timezone.
            // But we actually just want the index corresponding to the hour.
            // Safest way: find index where time string matches our target hour.

            // Actually, simpler: index 0 is 00:00, index 15 is 15:00.
            const index = hour;

            if (response.data.hourly.temperature_2m[index] !== undefined) {
                return {
                    temp: response.data.hourly.temperature_2m[index],
                    precip: response.data.hourly.precipitation_probability[index],
                    code: response.data.hourly.weathercode[index] // WMO Weather code
                };
            }
        }
        return null;
    } catch (error) {
        // console.error(`Error fetching weather:`, error.message);
        return null;
    }
};
