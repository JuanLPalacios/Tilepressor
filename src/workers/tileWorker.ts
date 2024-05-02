/* eslint-disable @typescript-eslint/no-unused-vars */
import { mapColors } from '../utilities/tileUtilities';
import { bspNode, calculateDivider, findBsptClosest, generateBsptFromPoints, isFront } from '../utilities/bsp';
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
import { hashTiles } from '../utilities/hashUtilities';
import { PaletteModel } from '~/enums/PaletteModel';
import { ColorPalette } from '~/contexts/MenuOptions';
import { CentroidFunction } from '~/types/CentroidFunction';

declare const self: {
    postMessage(message: WorkerResponse, options?: WindowPostMessageOptions): void;
 } & Omit<Window, 'postMessage'>;

self.onmessage = (e: CompressorMessageEvent) => {
    const { action } = e.data;
    switch (action) {
    case TaskTypes.applyFilter:
        return applyFilterWrapper(e.data);
        break;
    case TaskTypes.kMeansPlusPlus:
        return kMeansPlusPlusWrapper(e.data);
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

const getColorsCash:{[key:string]:ColorPalette[]} = {};
export const paletteDistance = (a: { colors: Color[]; bspt: bspNode<Color> } & SerializableTile, b: { colors: Color[]; bspt: bspNode<Color> } & SerializableTile): number => {
    return a.colors.reduce((prev, colorA)=>prev+euclideanDistance(colorA, findBsptClosest(colorA, b.bspt, isFront)), 0);
};

export const addPaletteCentroid:CentroidFunction<{ colors: Color[]; bspt: bspNode<Color> } & SerializableTile> = (a, b) => {
    if (!a) return b;
    if (!b) return a;
    return { data: Array.from(a.data), instances: [], raw: [...a.raw], colors: kMeansPlusPlus([...a.colors, ...b.colors], Math.max(a.colors.length, b.colors.length), euclideanDistance, addColor), bspt: a.bspt };
};
async function getColorsWrapper({ props: { tiles, paletteModel, colorModel }, id }:CompressorMessageData&{id:string|number}): Promise<void> {
    const key = (await hashTiles(tiles))+'';
    const cash = getColorsCash[key];
    if(cash) return self.postMessage({ id, action: TaskTypes.getColors, data: { colorPalette: cash }, progress: 1 });
    let groups:SerializableTile[][] = [tiles];
    if(paletteModel==PaletteModel.GBC) groups = tiles.map(tile =>[tile]);
    let colorPalette = groups.map((tiles, i)=>{
        let colors = indexColors(tiles);
        colors = kMeansPlusPlus(colors, (paletteModel==PaletteModel.GBC)?4:256, euclideanDistance, addColor, (progress: number)=>{ self.postMessage({ id, action: TaskTypes.getColors, data: { }, progress: progress }); });
        return { colors };
    });
    if(paletteModel==PaletteModel.GBC){
        const tilePair = colorPalette.map(({ colors }, j)=> {
            if(colorModel == ColorModel.Lab){
                const labColors = [];
                for (let i = 0; i < colors.length; i += 1) {
                    labColors.push(...rgb2lab(colors[i]));
                }
                colors = labColors;
            }
            const bspt = generateBsptFromPoints(Object.values(colors.reduce((map, color)=>({ ...map, [color.toString()]: color }), {} as {[key:string]:Color})), calculateDivider, isFront, (progress)=>(progress!=1)&&self.postMessage({ id, action: TaskTypes.generateBSPT, data: { }, progress: j/colorPalette.length + progress/colorPalette.length }));
            return { ...tiles[j], colors, bspt };
        });
        tiles.map((tile, i)=>({ tile,  }));
        colorPalette = kMeansPlusPlus(tilePair, 8, paletteDistance, addPaletteCentroid, (progress: number)=>{ self.postMessage({ id, action: TaskTypes.getColors, data: { }, progress: progress }); });
    }
    getColorsCash[key] = colorPalette;
    self.postMessage({ id, action: TaskTypes.getColors, data: { colorPalette }, progress: 1 });
}

function kMeansPlusPlusWrapper({ props: { tiles, k, colorModel, tileModel }, id }:CompressorMessageData&{id:string|number}): void {
    const { distanceFunc, centroidFunc } = getModelFunctions(colorModel, tileModel);
    tiles = kMeansPlusPlus(tiles, k, distanceFunc, centroidFunc, (progress: number)=>{ self.postMessage({ id, action: TaskTypes.kMeansPlusPlus, data: { }, progress: progress }); });
    self.postMessage({ id, action: TaskTypes.kMeansPlusPlus, data: { tiles }, progress: 1 });
}

function cdt2pixelsWrapper({ props: { tiles }, id }:CompressorMessageData&{id:string|number}): void {
    tiles.forEach((tile, i)=>{
        if(i%10==0)self.postMessage({ id, action: TaskTypes.cdt2pixels, data: { }, progress: i/tiles.length });
        tile.data = dct2pixels(tile.data);
        tile.data = changeTileColorSpace(tile, lab2rgb).data;
    });
    self.postMessage({ id, action: TaskTypes.cdt2pixels, data: { tiles }, progress: 1 });
}

const pixels2dctCash:{[key:string]:SerializableTile[]} = {};
async function pixels2dctWrapper({ props: { tiles }, id }:CompressorMessageData&{id:string|number}): Promise<void> {
    const key = await hashTiles(tiles);
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
async function rgb2labWrapper({ props: { tiles }, id }:CompressorMessageData&{id:string|number}): Promise<void> {
    const key = await hashTiles(tiles);
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
    tiles.forEach((tile, i)=>{
        if(i%10==0)self.postMessage({ id, action: TaskTypes.lab2rgb, data: { }, progress: i/tiles.length });
        tile.data = changeTileColorSpace(tile, lab2rgb).data;
    });
    self.postMessage({ id, action: TaskTypes.lab2rgb, data: { tiles }, progress: 1 });
}

function applyFilterWrapper({ props: { tiles, colorPalette, paletteModel }, id }:CompressorMessageData&{id:string|number}): void {
    let bspt: bspNode<Color> | undefined;
    if (paletteModel == PaletteModel.RGBA)
        return self.postMessage({ id, action: TaskTypes.applyFilter, data: {}, progress: 1 });
    if(paletteModel == PaletteModel.Indexed){
        bspt = colorPalette[0].bspt;
    }
    tiles.forEach((tile, i)=>{
        mapColors(tile, bspt||null);
        self.postMessage({ id, action: TaskTypes.applyFilter, data: { }, progress: (i/tiles.length) });
    });
    self.postMessage({ id, action: TaskTypes.applyFilter, data: { tiles }, progress: 1 });
}
function generateBSPTWrapper({ props: { colorPalette, paletteModel }, id }:CompressorMessageData&{id:string|number}): void {
    if (paletteModel == PaletteModel.RGBA)
        return self.postMessage({ id, action: TaskTypes.applyFilter, data: {}, progress: 1 });
    self.postMessage({ id, action: TaskTypes.generateBSPT, data: { colorPalette: colorPalette.map(({ colors }, i)=>{
        const bspt = generateBsptFromPoints(Object.values(colors.reduce((map, color)=>({ ...map, [color.toString()]: color }), {} as {[key:string]:Color})), calculateDivider, isFront, (progress)=>(progress!=1)&&self.postMessage({ id, action: TaskTypes.generateBSPT, data: { }, progress: i/colorPalette.length + progress/colorPalette.length }));
        return { bspt, colors };
    }) }, progress: 1 });
}
function cleanCacheWrapper(): void {
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

