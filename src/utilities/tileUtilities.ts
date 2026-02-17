import { Centroid } from '~/types/Centroid';
import { CentroidFunction } from '~/types/CentroidFunction';
import { Color } from '~/types/Color';
import { DistanceFunction } from '~/types/DistanceFunction';
import { ColorFunction } from '../types/ColorFunction';
import { SerializableTile } from '../types/SerializableTile';
import { colorDifferenceCh } from './colorUtilities';
import { bspNode, findBsptClosest, isFront } from './bsp';

export type Tile = {
    data:number[]
    raw:ImageData
    instances:[number, number][]
}

export type WeightedColor = {
    color: Color;
    weight: number;
};

export type Palette = {
    colors: WeightedColor[];
    weight: number;
    tileIndex?: number;
};

export async function img2Tiles(img:string, tileDimensions:number):Promise<Tile[]> {
    return new Promise<Tile[]>((success, failure) => {
        //load image
        const image = new Image();
        image.onload = () => {
            //draw image into the canvas
            const canvas = <HTMLCanvasElement>document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if(!ctx) return failure();
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            //cycle trough the image and get the tile data into a hash by data string
            const tileHash: { [key:string]:Tile } = {};
            for(let y = 0; y < image.height; y += tileDimensions){
                for(let x = 0; x < image.width; x += tileDimensions){
                    const raw = ctx.getImageData(x, y, tileDimensions, tileDimensions);
                    let tile = tileHash[raw.data.toString()];
                    if(!tile)
                        tile = tileHash[raw.data.toString()] = { data: Array.from(raw.data), instances: [], raw };
                    tile.instances.push([x/tileDimensions, y/tileDimensions]);
                }
            }
            success(Object.values(tileHash));
        };
        image.onerror = failure;
        image.src = img;
    });
}
export const serializeTiles = (tiles: Tile[]) => tiles.map(tile => ({ ...tile, raw: Array.from(tile.raw.data) }));
export function changeTileColorSpace({ data, raw, instances }: SerializableTile, func: ColorFunction): SerializableTile {
    const newData = [];

    for (let i = 0; i < data.length; i += 4) {
        newData.push(...func(<[number, number, number]>data.slice(i, i + 3)));
        newData.push(data[i + 3]);
    }

    return { data: newData, instances, raw };
}export function kMeansPlusPlus<T>(tiles: T[], k: number, distanceFunc: DistanceFunction<T>, addCentroid: CentroidFunction<T>, update?: (progess: number) => void): T[] {
    if (tiles.length == 0) return tiles;
    if (tiles.length <= k) return tiles;
    //choose a random C tile
    let selectedCentroid: Centroid<T> = { tile: tiles[0], points: tiles };
    const centroids = [selectedCentroid];
    //k times
    for (let i = 1; i < k; i++) {
        if (update) update(i / k);
        let maxDistanceOfCentroid = 0;
        let mostDistantTile = selectedCentroid.tile;
        //cycle trough all centroids
        for (let j = 0; j < centroids.length; j++) {
            const centroid = centroids[j];
            //cycle trough all tiles in the centroid group
            for (let jTileIndex = 0; jTileIndex < centroid.points.length; jTileIndex++) {
                const tile = centroid.points[jTileIndex];
                const distance = distanceFunc(centroid.tile, tile);
                if (distance > maxDistanceOfCentroid) {
                    //select this tile as the new C
                    mostDistantTile = tile;
                    maxDistanceOfCentroid = distance;
                }
            }
        }
        //find most distant tile from its centroid
        selectedCentroid = { tile: mostDistantTile, points: [] };
        centroids.unshift(selectedCentroid);
        //recalculate the most ideal group for every tile
        for (let j = 1; j < centroids.length; j++) {
            const centroid = centroids[j];
            for (let jTileIndex = 0; jTileIndex < centroid.points.length; jTileIndex++) {
                const tile = centroid.points[jTileIndex];
                const distanceFromNewCentroid = distanceFunc(selectedCentroid.tile, tile);
                const distance = distanceFunc(centroid.tile, tile);
                if (distance > distanceFromNewCentroid) {
                    selectedCentroid.points.push(tile);
                    centroid.points.splice(jTileIndex, 1);
                    // the current index element changes so index need to be repeated
                    jTileIndex--;
                }
            }
        }
    }
    // calculate average centroids of groups
    for (let i = 0; i < centroids.length; i++) {
        const centroid = centroids[i];
        if (centroid.points.length == 1) continue;
        //const tile:T = { data: Array.from(centroid.tile.data).fill(0), instances: [], raw: centroid.tile.raw };
        centroid.tile = centroid.points.reduce((prev, current) => {
            return addCentroid(prev, current);
        });
    }
    return centroids.map((centroid) => centroid.tile);
}

export function pixelDifferenceDistance(a: SerializableTile, b: SerializableTile): number {
    let sum = 0;
    for (let i = 0; i < a.data.length; i += 4) {
        const dA = (a.data[i + 3] - b.data[i + 3]) / 255;
        sum += colorDifferenceCh(a.data[i], b.data[i], dA) +
            colorDifferenceCh(a.data[i + 1], b.data[i + 1], dA) +
            colorDifferenceCh(a.data[i + 2], b.data[i + 2], dA);
    }
    return sum;
}

export function pixelPermutedDifferenceDistance(a: SerializableTile, b: SerializableTile): number {
    return pixelDifferenceDistance(a, b) * (a.instances.length + b.instances.length);
}

export const euclideanDistance = (v1: number[], v2: number[]) => {
    return Math.sqrt(v1.reduce((total, x1, i) => total + (x1 - v2[i]) ** 2, 0));
};

export function addCentroid(a: SerializableTile, b: SerializableTile): SerializableTile {
    if (!a) return b;
    if (!b) return a;
    const newTile: SerializableTile = { data: Array.from(a.data), instances: [], raw: [...a.raw] };
    const totalWeight = a.instances.length + b.instances.length;
    for (let i = 0; i < a.data.length; i++) {
        newTile.data[i] = (a.data[i] * a.instances.length + b.data[i] * b.instances.length) / totalWeight;
    }

    for (let i = 0; i < a.data.length; i++) {
        newTile.raw[i] = Math.min(Math.floor((a.raw[i] * a.instances.length + b.raw[i] * b.instances.length) / totalWeight), 255);
    }

    newTile.instances.push(...a.instances);
    newTile.instances.push(...b.instances);
    return newTile;
}

export function indexColors(tiles: SerializableTile[]): Color[] {
    const colorHash: { [key: string]: Color; } = {};
    //let limit = 1;
    //let colors = [];
    for (let j = 0; j < tiles.length; j++) {
        const tile = tiles[j];
        for (let i = 0; i < tile.data.length; i += 4) {
            let color: Color = <Color>tile.data.slice(i, i + 4);
            if (color[3] == 0) color = [0, 0, 0, 0];
            colorHash[color.toString()] = color;
        }
        /* if(j%limit==0){
            limit*=2;
            colors = Object.values(colorHash);
            if(colors.length>=256)
                return colors.slice(0, 256);
        } */
    }
    return Object.values(colorHash);
}
export function mapColors(tile: SerializableTile, root: bspNode<number[]>|null) {
    const { raw } = tile;
    const data = Array.from(raw);
    for (let i = 0; i < data.length; i += 4) {
        const color = findBsptClosest(data.slice(i, i + 4), root, isFront);
        for (let j = 0; j < 4; j++) {
            raw[i + j] = color[j];
        }
    }
}

export function mapColor2SingleColor(tile: SerializableTile, [color]: Color[]) {
    const { raw } = tile;
    const data = Array.from(raw);
    for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 4; j++) {
            raw[i + j] = color[j];
        }
    }
}

export function kMeansPlusPlusClusters<T>(tiles: T[], k: number, distanceFunc: DistanceFunction<T>, addCentroid: CentroidFunction<T>, update?: (progess: number) => void): Centroid<T>[] {
    if (tiles.length == 0) return [];
    if (tiles.length <= k) {
        if (update) update(1);
        return tiles.map(tile => ({ tile, points: [tile] }));
    }
    let selectedCentroid: Centroid<T> = { tile: tiles[0], points: tiles };
    const centroids = [selectedCentroid];
    for (let i = 1; i < k; i++) {
        if (update) update(i / k);
        let maxDistanceOfCentroid = 0;
        let mostDistantTile = selectedCentroid.tile;
        for (let j = 0; j < centroids.length; j++) {
            const centroid = centroids[j];
            for (let jTileIndex = 0; jTileIndex < centroid.points.length; jTileIndex++) {
                const tile = centroid.points[jTileIndex];
                const distance = distanceFunc(centroid.tile, tile);
                if (distance > maxDistanceOfCentroid) {
                    mostDistantTile = tile;
                    maxDistanceOfCentroid = distance;
                }
            }
        }
        selectedCentroid = { tile: mostDistantTile, points: [] };
        centroids.unshift(selectedCentroid);
        for (let j = 1; j < centroids.length; j++) {
            const centroid = centroids[j];
            for (let jTileIndex = 0; jTileIndex < centroid.points.length; jTileIndex++) {
                const tile = centroid.points[jTileIndex];
                const distanceFromNewCentroid = distanceFunc(selectedCentroid.tile, tile);
                const distance = distanceFunc(centroid.tile, tile);
                if (distance > distanceFromNewCentroid) {
                    selectedCentroid.points.push(tile);
                    centroid.points.splice(jTileIndex, 1);
                    jTileIndex--;
                }
            }
        }
    }
    if (update) update(1);
    for (let i = 0; i < centroids.length; i++) {
        const centroid = centroids[i];
        if (centroid.points.length <= 1) continue;
        centroid.tile = centroid.points.reduce((prev, current) => {
            return addCentroid(prev, current);
        });
    }
    return centroids;
}

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const weightedColorDistance = (a: WeightedColor, b: WeightedColor) => euclideanDistance(a.color, b.color);

const addWeightedColor = (a: WeightedColor, b: WeightedColor): WeightedColor => {
    if (!a) return b;
    if (!b) return a;
    const totalWeight = a.weight + b.weight;
    const color = <Color>a.color.map((value, index) =>
        clampChannel((value * a.weight + b.color[index] * b.weight) / totalWeight)
    );
    return { color, weight: totalWeight };
};

const findClosestWeightedColor = (color: WeightedColor, palette: WeightedColor[]) => {
    let closest = palette[0];
    let minDistance = weightedColorDistance(color, closest);
    for (let i = 1; i < palette.length; i++) {
        const candidate = palette[i];
        const distance = weightedColorDistance(color, candidate);
        if (distance < minDistance) {
            minDistance = distance;
            closest = candidate;
        }
    }
    return closest;
};

export function tilePaletteDistance(tile: SerializableTile, palette: Color[]): number {
    if (!palette.length) return Number.MAX_VALUE;
    const colorMap: { [key: string]: WeightedColor } = {};
    for (let i = 0; i < tile.raw.length; i += 4) {
        const color = <Color>tile.raw.slice(i, i + 4);
        const normalizedColor = (color[3] === 0 ? [0, 0, 0, 0] : color) as Color;
        const key = normalizedColor.toString();
        if (!colorMap[key]) {
            colorMap[key] = { color: normalizedColor, weight: 0 };
        }
        colorMap[key].weight += 1;
    }
    const weightedColors = Object.values(colorMap);
    let total = 0;
    let weightSum = 0;
    for (const entry of weightedColors) {
        let closest = palette[0];
        let minDistance = euclideanDistance(entry.color, closest);
        for (let i = 1; i < palette.length; i++) {
            const candidate = palette[i];
            const distance = euclideanDistance(entry.color, candidate);
            if (distance < minDistance) {
                minDistance = distance;
                closest = candidate;
            }
        }
        total += minDistance * entry.weight;
        weightSum += entry.weight;
    }
    return weightSum ? total / weightSum : 0;
}

export function mapColorsToPalette(tile: SerializableTile, palette: Color[]): void {
    if (!palette.length) return;
    const { raw } = tile;
    for (let i = 0; i < raw.length; i += 4) {
        const color = raw.slice(i, i + 4);
        let closest = palette[0];
        let minDistance = euclideanDistance(color, closest);
        for (let j = 1; j < palette.length; j++) {
            const candidate = palette[j];
            const distance = euclideanDistance(color, candidate);
            if (distance < minDistance) {
                minDistance = distance;
                closest = candidate;
            }
        }
        for (let j = 0; j < 4; j++) {
            raw[i + j] = closest[j];
        }
    }
}

const reducePaletteColors = (palette: Palette, maxColors: number): Palette => {
    if (palette.colors.length <= maxColors) return palette;
    const colors = kMeansPlusPlus(palette.colors, maxColors, weightedColorDistance, addWeightedColor);
    const weight = colors.reduce((total, color) => total + color.weight, 0);
    return { ...palette, colors, weight };
};

const normalizePalette = (palette: Palette) => {
    const map = new Map<string, WeightedColor>();
    for (const entry of palette.colors) {
        const key = entry.color.toString();
        const existing = map.get(key);
        if (existing) {
            existing.weight += entry.weight;
        }
        else {
            map.set(key, { ...entry });
        }
    }
    const colors = Array.from(map.values());
    return { ...palette, colors, weight: colors.reduce((total, entry) => total + entry.weight, 0) };
};

export const paletteDistance = (a: Palette, b: Palette, maxColors: number) => {
    //const paletteA = reducePaletteColors(a, maxColors).colors;
    //const paletteB = reducePaletteColors(b, maxColors).colors;
    const paletteA = a.colors;
    const paletteB = b.colors;
    if (paletteA.length + paletteB.length <= maxColors) return 0;
    let enptySlots = Math.max(0, paletteA.length + paletteB.length - maxColors);
    const directedDistance = (from: WeightedColor[], to: WeightedColor[]) => {
        const distances: { distance: number; weight: number }[] = [];
        for (const color of from) {
            const closest = findClosestWeightedColor(color, to);
            const distance = weightedColorDistance(color, closest);
            distances.push({ distance, weight: color.weight });
        }
        if (enptySlots > 0 && distances.length > 0) {
            const removeCount = Math.min(enptySlots, distances.length);
            distances.sort((aEntry, bEntry) => bEntry.distance - aEntry.distance);
            distances.splice(0, removeCount);
        }
        let total = 0;
        let weightSum = 0;
        for (const entry of distances) {
            total += entry.distance * entry.weight;
            weightSum += entry.weight;
        }
        return weightSum ? total / weightSum : 0;
    };
    return (directedDistance(paletteA, paletteB) + directedDistance(paletteB, paletteA)) / 2;
};

const paletteCentroid = (a: Palette, b: Palette, maxColors: number): Palette => {
    console.log('Calculating centroid for palettes with weights', a.weight, b.weight, 'and maxColors', maxColors);
    const paletteA = reducePaletteColors(a, maxColors).colors;
    const paletteB = reducePaletteColors(b, maxColors).colors;
    const merged: WeightedColor[] = [];
    for (const colorA of paletteA) {
        const closest = findClosestWeightedColor(colorA, paletteB);
        merged.push(addWeightedColor(colorA, closest));
    }
    for (const colorB of paletteB) {
        const closest = findClosestWeightedColor(colorB, paletteA);
        merged.push(addWeightedColor(colorB, closest));
    }
    const normalized = normalizePalette({ colors: merged, weight: 0 });
    return reducePaletteColors(normalized, maxColors);
};

export function clusterPalettesFromTiles(tiles: SerializableTile[], paletteCount: number, maxColors: number, update?: (progress: number) => void): { palettes: Color[][]; paletteIndexes: number[] } {
    if (!tiles.length) return { palettes: [], paletteIndexes: [] };
    const palettes: Palette[] = tiles.map((tile, tileIndex) => {
        const colorMap: { [key: string]: WeightedColor } = {};
        const weightMultiplier = Math.max(1, tile.instances.length);
        for (let i = 0; i < tile.raw.length; i += 4) {
            const color = <Color>tile.raw.slice(i, i + 4);
            const normalizedColor = (color[3] === 0 ? [0, 0, 0, 0] : color) as Color;
            const key = normalizedColor.toString();
            if (!colorMap[key]) {
                colorMap[key] = { color: normalizedColor, weight: 0 };
            }
            colorMap[key].weight += weightMultiplier;
        }
        const colors = Object.values(colorMap);
        return { colors, weight: colors.reduce((total, entry) => total + entry.weight, 0), tileIndex };
    });
    const targetPaletteCount = Math.max(1, Math.min(paletteCount, palettes.length));
    const targetMaxColors = Math.max(1, maxColors);
    const initialMaxColors = palettes.reduce((maxValue, palette) => Math.max(maxValue, palette.colors.length), targetMaxColors);
    if (targetPaletteCount >= palettes.length) {
        const paletteIndexes = tiles.map((_tile, index) => index);
        const paletteColors = palettes.map(palette => reducePaletteColors(palette, targetMaxColors).colors.map(entry => entry.color));
        if (update) update(1);
        return { palettes: paletteColors, paletteIndexes };
    }
    let currentMaxColors = initialMaxColors;
    const updateProgress = (progress: number) => {
        currentMaxColors = Math.max(targetMaxColors, Math.round(initialMaxColors - (initialMaxColors - targetMaxColors) * progress));
        if (update) update(progress);
    };
    const centroids = kMeansPlusPlusClusters(
        palettes,
        targetPaletteCount,
        (a, b) => paletteDistance(a, b, currentMaxColors),
        (a, b) => paletteCentroid(a, b, currentMaxColors),
        updateProgress
    );
    const paletteIndexes = new Array(tiles.length).fill(0);
    centroids.forEach((centroid, index) => {
        centroid.points.forEach((palette) => {
            if (palette.tileIndex !== undefined) paletteIndexes[palette.tileIndex] = index;
        });
    });
    const paletteColors = centroids.map((centroid) => {
        const reduced = reducePaletteColors(centroid.tile, targetMaxColors);
        return reduced.colors.map(entry => entry.color);
    });
    return { palettes: paletteColors, paletteIndexes };
}

