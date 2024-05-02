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
}
export function kMeansPlusPlus<T>(tiles: T[], k: number, distanceFunc: DistanceFunction<T>, addCentroid: CentroidFunction<T>, update?: (progess: number) => void): T[] {
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
export function mapColors(tile: SerializableTile, root: bspNode<number[]>) {
    const { raw } = tile;
    const data = Array.from(raw);
    for (let i = 0; i < data.length; i += 4) {
        const color = findBsptClosest(data.slice(i, i + 4), root, isFront);
        for (let j = 0; j < 4; j++) {
            raw[i + j] = color[j];
        }
    }
}

