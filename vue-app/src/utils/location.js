
const STORAGE_KEY = 'user_location';
const STORAGE_TIME_KEY = 'user_location_time';
const EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24 hours

// GPS -> GCJ02 (Simple approximation from shop-list.html)
function transformWGS84ToGCJ02(lng, lat) {
    const x = lng - 0.0065;
    const y = lat - 0.0060;
    return { lng: x, lat: y };
}

export const locationUtil = {
    // Get location: try cache first, then real positioning
    async getLocation(force = false) {
        if (!force) {
            const cached = this.getCachedLocation();
            if (cached) return Promise.resolve(cached);
        }
        return this.getRealLocation();
    },

    getCachedLocation() {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                const location = JSON.parse(cached);
                const cacheTime = localStorage.getItem(STORAGE_TIME_KEY);
                const now = new Date().getTime();
                if (cacheTime && (now - parseInt(cacheTime)) < EXPIRE_TIME) {
                    return location;
                }
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    },

    getRealLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("浏览器不支持地理定位"));
                return;
            }

            navigator.geolocation.getCurrentPosition(async position => {
                try {
                    const { longitude, latitude } = position.coords;
                    // Convert coords
                    const { lng, lat } = transformWGS84ToGCJ02(longitude, latitude);

                    // Get Address info
                    let region = null;
                    try {
                        region = await this.getRegionInfo(lng, lat);
                    } catch (err) {
                        console.error("Region fetch error", err);
                    }

                    const location = {
                        x: lng,
                        y: lat,
                        region: region || null // Explicitly null if missing, matching index.html
                    };

                    this.saveLocation(location);
                    resolve(location);
                } catch (e) {
                    console.error("Position logic error", e);
                    reject(e);
                }
            }, err => {
                reject(err);
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });
    },

    async getRegionInfo(lng, lat) {
        try {
            const response = await fetch(
                `https://restapi.amap.com/v3/geocode/regeo?key=60bdbf9b9cf98025c397ee43e8c25871&location=${lng},${lat}`
            );
            const data = await response.json();
            if (data.status === '1' && data.regeocode) {
                const address = data.regeocode.addressComponent;
                return {
                    province: address.province,
                    city: address.city || address.province,
                    district: address.district,
                    township: address.township,
                    fullAddress: data.regeocode.formatted_address
                };
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    },

    saveLocation(location) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
            localStorage.setItem(STORAGE_TIME_KEY, new Date().getTime().toString());
        } catch (e) {
            console.error(e);
        }
    }
};
