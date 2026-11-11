
export const BGM_BATTLE_NORMAL = 'battle-normal';
export const BGM_BATTLE_CRITICAL = 'battle-critical';
export const BGM_VICTORY = 'victory';
export const BGM_WEATHER_SUN = 'weather-sun';
export const BGM_WEATHER_RAIN = 'weather-rain';
export const BGM_WEATHER_SAND = 'weather-sand';
export const BGM_WEATHER_HAIL = 'weather-hail';
export const BGM_LAST_POKEMON = 'last-pokemon';

// Proven, High-Availability Assets (Google Codeskulptor CDN)
// URLs updated to ensure variety and reliability.
export const TRACK_URLS: Record<string, string> = {
    // Normal: Retro/Synth Battle Theme
    [BGM_BATTLE_NORMAL]: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg', 
    
    // Critical: High Energy / Fast Paced
    [BGM_BATTLE_CRITICAL]: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race1.ogg',
    
    // Last Pokemon: Intense / Climax
    [BGM_LAST_POKEMON]: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race2.ogg',
    
    // Victory
    [BGM_VICTORY]: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
    
    // Weather: Google CodeSkulptor Assets (Stable & CORS-Friendly)
    [BGM_WEATHER_SUN]: 'https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/intromusic.ogg',
    [BGM_WEATHER_RAIN]: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/win.ogg',
    
    // Fix: Replaced broken URL with a reliable high-energy track
    [BGM_WEATHER_SAND]: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/start.ogg',
    
    // Fix: Replaced short SFX with a proper looping soundtrack
    [BGM_WEATHER_HAIL]: 'https://commondatastorage.googleapis.com/codeskulptor-assets/sounddogs/soundtrack.ogg',
};
