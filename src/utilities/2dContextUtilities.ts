import { Tile } from './tileUtilities';
import { euclideanDistance } from './tileUtilities';

export function loadData(tile:Tile) {
    for (let p = 0; p < tile.data.length; p++) {
        tile.raw.data[p] = Math.round(tile.data[p]);
    }
}
export function saveData(tile:Tile) {
    for (let p = 0; p < tile.data.length; p++) {
        tile.data[p] = tile.raw.data[p];
    }
}

export function compressionDifferenceDistance(a:Tile, b:Tile):number {
    loadData(a);
    loadData(b);
    const tileDimensions = a.raw.width;
    const test = <HTMLCanvasElement>document.createElement('canvas');
    const canvasA = <HTMLCanvasElement>document.createElement('canvas');
    const canvasB = <HTMLCanvasElement>document.createElement('canvas');
    canvasA.width = canvasB.width = test.width = tileDimensions;
    canvasA.height = canvasB.height = test.height = tileDimensions;
    const testCtx = <CanvasRenderingContext2D>test.getContext('2d', { willReadFrequently: true });
    const canvasACtx = <CanvasRenderingContext2D>canvasA.getContext('2d', { willReadFrequently: true });
    canvasACtx.putImageData(a.raw, 0, 0);
    const canvasBCtx = <CanvasRenderingContext2D>canvasB.getContext('2d', { willReadFrequently: true });
    canvasBCtx.putImageData(b.raw, 0, 0);
    let loss = 0;
    for (let scale = 1; scale <= tileDimensions; scale++) {
        const sq = scale**2;
        const w = scale;
        const h =  scale;
        testCtx.clearRect(0, 0, w, h);
        testCtx.drawImage(canvasA, 0, 0, canvasA.width, canvasA.height, 0, 0, w, h);
        const targetData = Array.from(testCtx.getImageData(0, 0, w, h).data);
        testCtx.clearRect(0, 0, w, h);
        testCtx.drawImage(canvasB, 0, 0, canvasB.width, canvasB.height, 0, 0, w, h);
        const testData = Array.from(testCtx.getImageData(0, 0, w, h).data);
        for (let index = 0; index < testData.length; index+=4) {
            loss += euclideanDistance(targetData.slice(index, index+4), testData.slice(index, index+4))/sq;
        }
    }
    loss /= 255*tileDimensions;
    return loss;
}const tempCtx = <CanvasRenderingContext2D>(<HTMLCanvasElement>document.createElement('canvas')).getContext('2d', { willReadFrequently: true });

export function createImageData(data: ImageData | { width: number; height: number; }) {
    if (!(data instanceof ImageData)) return tempCtx.getImageData(0, 0, data.width, data.height);
    tempCtx.putImageData(data, 0, 0);
    return tempCtx.getImageData(0, 0, data.width, data.height);
}

