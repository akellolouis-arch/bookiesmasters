import axios from 'axios';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Get coordinates for a city name.
 * Uses Nominatim (OpenStreetMap) API.
 * Caller should handle caching.
 */
export const getCoordinatesForCity = async (cityName) => {
    try {
        if (!cityName) return null;

        // Add artificial delay to respect Nominatim's "1 request per second" policy if high volume
        // But for single request flow, it's fine.

        const response = await axios.get(NOMINATIM_URL, {
            params: {
                q: cityName,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'BookiesMasters/1.0 (contact@bookiesmasters.com)' // Required by Nominatim
            },
            timeout: 5000
        });

        if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
            return { lat: parseFloat(lat), lon: parseFloat(lon) };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching coordinates for ${cityName}:`, error.message);
        return null;
    }
};

/**
 * Haversine formula to calculate distance in km
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};
