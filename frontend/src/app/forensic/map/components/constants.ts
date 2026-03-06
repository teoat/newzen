// Indonesia TopoJSON URL
export const geoUrl = "https://raw.githubusercontent.com/ansis/world-topojson/master/countries/indonesia.json";

export interface MapPosition {
    coordinates: [number, number];
    zoom: number;
}

export const DEFAULT_POSITION: MapPosition = { coordinates: [118, -2], zoom: 1200 };
