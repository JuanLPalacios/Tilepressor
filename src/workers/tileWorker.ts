/* eslint-disable @typescript-eslint/no-unused-vars */
import { mapColors, clusterPalettesFromTiles, tilePaletteDistance, mapColorsToPalette, mapColor2SingleColor } from '../utilities/tileUtilities';
import { calculateDivider, generateBsptFromPoints, isFront } from '../utilities/bsp';
import { indexColors, kMeansPlusPlus, euclideanDistance, pixelPermutedDifferenceDistance, addCentroid } from '../utilities/tileUtilities';
import { addColor } from '../utilities/colorUtilities';
import { dct2pixels } from '../utilities/dctUtilities';
import { pixels2dct } from '../utilities/dctUtilities';
import { dctPermutedDifferenceDistance } from '../utilities/dctUtilities';
import { changeTileColorSpace } from '../utilities/tileUtilities';
import { SerializableTile } from '../types/SerializableTile';
import { Color } from '../types/Color';
import { rgb2lab, lab2rgb } from 'rgb-lab';
import { ColorModel } from '../enums/ColorModel';
import { TileModel } from '../enums/TileModel';
import { WorkerResponse, CompressorMessageEvent, CompressorMessageData } from '../types/TileWorker';
import { TaskTypes } from '../enums/TaskType';

declare const self: {
    postMessage(message: WorkerResponse, options?: WindowPostMessageOptions): void;
 } & Omit<Window, 'postMessage'>;

self.onmessage = (e: CompressorMessageEvent) => {
    const { action } = e.data;
    switch (action) {
    case TaskTypes.applyFilter:
        return applyFilterWrapper(e.data);
        break;
    case TaskTypes.applyPaletteFilter:
        return applyPaletteFilterWrapper(e.data);
        break;
    case TaskTypes.kMeansPlusPlus:
        return kMeansPlusPlusWrapper(e.data);
        break;
    case TaskTypes.clusterPalettes:
        return clusterPalettesWrapper(e.data);
        break;
    case TaskTypes.pixels2dct:
        return pixels2dctWrapper(e.data);
        break;
    case TaskTypes.cdt2pixels:
        return cdt2pixelsWrapper(e.data);
        break;
    case TaskTypes.generateBSPT:
        return generateBSPTWrapper(e.data);
        break;
    case TaskTypes.lab2rgb:
        return lab2rgbWrapper(e.data);
        break;
    case TaskTypes.rgb2lab:
        return rgb2labWrapper(e.data);
        break;
    case TaskTypes.lab2cgbIndex:
        return lab2cgbIndexWrapper(e.data);
        break;
    case TaskTypes.cgbIndex2lab:
        return cgbIndex2labWrapper(e.data);
        break;
    case TaskTypes.cleanCache:
        return cleanCacheWrapper();
        break;
    case TaskTypes.getColors:
        return getColorsWrapper(e.data);
        break;

    default:
        break;
    }
};

export {};

const getColorsCash:{[key:string]:Color[]} = {};
function getColorsWrapper({ props: { tiles }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('getColorsWrapper called with tiles:', tiles);
    const key = tiles.toString();
    const cash = getColorsCash[key];
    if(cash) return self.postMessage({ id, action: TaskTypes.getColors, data: { colors: cash }, progress: 1 });
    let colors = indexColors(tiles);
    colors = kMeansPlusPlus(colors, 256, euclideanDistance, addColor, (progress: number)=>{ self.postMessage({ id, action: TaskTypes.getColors, data: { }, progress: progress }); });
    getColorsCash[key] = colors;
    self.postMessage({ id, action: TaskTypes.getColors, data: { colors }, progress: 1 });
}

function kMeansPlusPlusWrapper({ props: { tiles, k, colorModel, tileModel }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('kMeansPlusPlusWrapper called with k:', k, 'colorModel:', colorModel, 'tileModel:', tileModel);
    const { distanceFunc, centroidFunc } = getModelFunctions(colorModel, tileModel);
    tiles = kMeansPlusPlus(tiles, k, distanceFunc, centroidFunc, (progress: number)=>{ self.postMessage({ id, action: TaskTypes.kMeansPlusPlus, data: { }, progress: progress }); });
    self.postMessage({ id, action: TaskTypes.kMeansPlusPlus, data: { tiles }, progress: 1 });
}

function cdt2pixelsWrapper({ props: { tiles }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('cdt2pixelsWrapper called with tiles:', tiles);
    tiles.forEach((tile, i)=>{
        if(i%10==0)self.postMessage({ id, action: TaskTypes.cdt2pixels, data: { }, progress: i/tiles.length });
        tile.data = dct2pixels(tile.data);
        tile.data = changeTileColorSpace(tile, lab2rgb).data;
    });
    self.postMessage({ id, action: TaskTypes.cdt2pixels, data: { tiles }, progress: 1 });
}

const pixels2dctCash:{[key:string]:SerializableTile[]} = {};
function pixels2dctWrapper({ props: { tiles }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('pixels2dctWrapper called with tiles:', tiles);
    const key = tiles.toString();
    const cash = pixels2dctCash[key];
    if(cash) return self.postMessage({ id, action: TaskTypes.pixels2dct, data: { tiles: cash }, progress: 1 });
    tiles.forEach((tile, i)=>{
        if(i%10==0)self.postMessage({ id, action: TaskTypes.pixels2dct, data: { }, progress: i/tiles.length });
        const newData = pixels2dct(changeTileColorSpace(tile, rgb2lab).data);
        tile.data = newData;
    });
    pixels2dctCash[key] = tiles;
    self.postMessage({ id, action: TaskTypes.pixels2dct, data: { tiles }, progress: 1 });
}

const rgb2labCash:{[key:string]:SerializableTile[]} = {};
function rgb2labWrapper({ props: { tiles }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('rgb2labWrapper called with tiles:', tiles);
    const key = tiles.toString();
    const cash = rgb2labCash[key];
    if(cash) return self.postMessage({ id, action: TaskTypes.rgb2lab, data: { tiles: cash }, progress: 1 });
    tiles.forEach((tile, i)=>{
        if(i%10==0)self.postMessage({ id, action: TaskTypes.rgb2lab, data: { }, progress: i/tiles.length });
        const newData = changeTileColorSpace(tile, rgb2lab).data;
        tile.data = newData;
    });
    rgb2labCash[key] = tiles;
    self.postMessage({ id, action: TaskTypes.rgb2lab, data: { tiles }, progress: 1 });
}

function lab2rgbWrapper({ props: { tiles }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('lab2rgbWrapper called with tiles:', tiles);
    tiles.forEach((tile, i)=>{
        if(i%10==0)self.postMessage({ id, action: TaskTypes.lab2rgb, data: { }, progress: i/tiles.length });
        tile.data = changeTileColorSpace(tile, lab2rgb).data;
    });
    self.postMessage({ id, action: TaskTypes.lab2rgb, data: { tiles }, progress: 1 });
}

function lab2cgbIndexWrapper({ props: { tiles, palettes, paletteIndexes }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('lab2cgbIndexWrapper called with tiles:', tiles);
    const paletteLabCache: { [key: number]: number[][] } = {};
    tiles.forEach((tile, i)=>{
        if(i%10==0)self.postMessage({ id, action: TaskTypes.lab2cgbIndex, data: { }, progress: i/tiles.length });
        const paletteIndex = paletteIndexes?.[i] ?? 0;
        let paletteLab = paletteLabCache[paletteIndex];
        if (!paletteLab) {
            const palette = palettes?.[paletteIndex] ?? [];
            paletteLab = palette.slice(0, 4).map(([r, g, b]) => rgb2lab([r, g, b]));
            paletteLabCache[paletteIndex] = paletteLab;
        }
        const newData: number[] = [];
        for (let p = 0; p < tile.data.length; p += 4) {
            const alpha = tile.data[p + 3];
            if (alpha === 0) {
                newData.push(0, 0, 0, 0);
                continue;
            }
            const lab = tile.data.slice(p, p + 3);
            newData.push(
                paletteLab[0] ? euclideanDistance(lab, paletteLab[0]) : 0,
                paletteLab[1] ? euclideanDistance(lab, paletteLab[1]) : 0,
                paletteLab[2] ? euclideanDistance(lab, paletteLab[2]) : 0,
                paletteLab[3] ? euclideanDistance(lab, paletteLab[3]) : 0
            );
        }
        tile.data = newData;
    });
    self.postMessage({ id, action: TaskTypes.lab2cgbIndex, data: { tiles }, progress: 1 });
}

function cgbIndex2labWrapper({ props: { tiles, palettes, paletteIndexes }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('cgbIndex2labWrapper called with tiles:', tiles);
    const paletteLabCache: { [key: number]: number[][] } = {};
    tiles.forEach((tile, i)=>{
        if(i%10==0)self.postMessage({ id, action: TaskTypes.cgbIndex2lab, data: { }, progress: i/tiles.length });
        const paletteIndex = paletteIndexes?.[i] ?? 0;
        let paletteLab = paletteLabCache[paletteIndex];
        if (!paletteLab) {
            const palette = palettes?.[paletteIndex] ?? [];
            paletteLab = palette.slice(0, 4).map(([r, g, b]) => rgb2lab([r, g, b]));
            paletteLabCache[paletteIndex] = paletteLab;
        }

        const newData: number[] = [];
        for (let p = 0; p < tile.data.length; p += 4) {
            const v0 = tile.data[p];
            const v1 = tile.data[p + 1];
            const v2 = tile.data[p + 2];
            const v3 = tile.data[p + 3];
            let maxIndex = 0;
            let maxValue = v0;
            if (v1 > maxValue) { maxValue = v1; maxIndex = 1; }
            if (v2 > maxValue) { maxValue = v2; maxIndex = 2; }
            if (v3 > maxValue) { maxValue = v3; maxIndex = 3; }

            const lab = paletteLab[maxIndex] ?? [0, 0, 0, 0];
            newData.push(lab[0], lab[1], lab[2], lab[3]);
        }
        tile.data = newData;
    });
    self.postMessage({ id, action: TaskTypes.cgbIndex2lab, data: { tiles }, progress: 1 });
}

function applyFilterWrapper({ props: { tiles, bspt, paletteBspts, paletteIndexes }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('applyFilterWrapper called with tiles:', tiles);
    tiles.forEach((tile, i)=>{
        const paletteIndex = paletteIndexes?.[i];
        const paletteBspt = (paletteIndex !== undefined && paletteBspts)? paletteBspts[paletteIndex] : undefined;
        mapColors(tile, paletteBspt || bspt || null);
        tile.data = Array.from(tile.raw);
        self.postMessage({ id, action: TaskTypes.applyFilter, data: { }, progress: (i/tiles.length) });
    });
    self.postMessage({ id, action: TaskTypes.applyFilter, data: { tiles }, progress: 1 });
}

function applyPaletteFilterWrapper({ props: { tiles, palettes, paletteBspts }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('applyPaletteFilterWrapper called with tiles:', tiles, 'palettes:', palettes);
    tiles.forEach((tile, i)=>{
        if (palettes && palettes.length) {
            let bestIndex = 0;
            let bestDistance = Number.MAX_VALUE;
            for (let j = 0; j < palettes.length; j++) {
                const distance = tilePaletteDistance(tile, palettes[j]);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestIndex = j;
                }
            }
            const paletteBspt = paletteBspts?.[bestIndex];
            if (paletteBspt) {
                mapColors(tile, paletteBspt);
            }
            else if (palettes[bestIndex]?.length === 1) {
                mapColor2SingleColor(tile, palettes[bestIndex]);
            }
            else if (palettes[bestIndex]?.length) {
                mapColorsToPalette(tile, palettes[bestIndex]);
            }
            tile.data = Array.from(tile.raw);
        }
        self.postMessage({ id, action: TaskTypes.applyPaletteFilter, data: { }, progress: (i/tiles.length) });
    });
    self.postMessage({ id, action: TaskTypes.applyPaletteFilter, data: { tiles }, progress: 1 });
}

function clusterPalettesWrapper({ props: { tiles, paletteCount, paletteSize }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('clusterPalettesWrapper called with paletteCount:', paletteCount, 'paletteSize:', paletteSize);
    const { palettes, paletteIndexes } = clusterPalettesFromTiles(
        tiles,
        paletteCount || 1,
        paletteSize || 256,
        (progress: number)=>{
            if (progress < 1) {
                self.postMessage({ id, action: TaskTypes.clusterPalettes, data: { }, progress: progress });
            }
        }
    );
    console.log('clusterPalettesFromTiles returned', palettes, paletteIndexes);
    const paletteBspts = palettes.map((colors, index)=>{
        const unique = Object.values(colors.reduce((map, color)=>({ ...map, [color.toString()]: color }), {} as {[key:string]:Color}));
        return generateBsptFromPoints(unique, calculateDivider, isFront, (progress)=>{
            if(progress != 1) self.postMessage({ id, action: TaskTypes.clusterPalettes, data: { }, progress: (index + progress) / palettes.length });
        });
    });
    self.postMessage({ id, action: TaskTypes.clusterPalettes, data: { palettes, paletteIndexes, paletteBspts }, progress: 1 });
}
function generateBSPTWrapper({ props: { colors }, id }:CompressorMessageData&{id:string|number}): void {
    console.log('generateBSPTWrapper called with colors:', colors);
    const bspt = generateBsptFromPoints(Object.values(colors.reduce((map, color)=>({ ...map, [color.toString()]: color }), {} as {[key:string]:Color})), calculateDivider, isFront, (progress)=>(progress!=1)&&self.postMessage({ id, action: TaskTypes.generateBSPT, data: { }, progress }));
    self.postMessage({ id, action: TaskTypes.generateBSPT, data: { bspt }, progress: 1 });
}
function cleanCacheWrapper(): void {
    console.log('cleanCacheWrapper called');
    const globalCache = [rgb2labCash, pixels2dctCash, getColorsCash];
    globalCache.forEach(cache=>{
        Object.keys(cache).forEach(key=>{
            delete cache[key];
        });
    });
}
function getModelFunctions(colorModel: ColorModel, tileModel: TileModel) {
    return {
        centroidFunc: addCentroid,
        distanceFunc: {
            [TileModel.CDT]: dctPermutedDifferenceDistance,
            [TileModel.Raster]: pixelPermutedDifferenceDistance,
        }[tileModel]
    };
}

