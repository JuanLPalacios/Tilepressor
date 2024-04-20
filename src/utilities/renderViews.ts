import { Tile } from './tileUtilities';

export function renderOriginal(canvas: HTMLCanvasElement, image: HTMLImageElement) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
    }
}
export function renderTileSet(canvas: HTMLCanvasElement, tiles: Tile[], tileDimensions: number) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const tileSetWidth = Math.ceil(Math.sqrt(tiles.length));
        canvas.width = tileSetWidth * tileDimensions;
        canvas.height = tileSetWidth * tileDimensions;
        tiles.forEach(({ raw }, i) => {
            ctx.putImageData(raw, (i % tileSetWidth) * tileDimensions, Math.floor(i / tileSetWidth) * tileDimensions);
        });
    }
}
export function renderCompressed(canvas: HTMLCanvasElement, image: HTMLImageElement, newTiles: Tile[] | undefined, tileDimensions: number) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;
        newTiles?.forEach(({ instances, raw }) => {
            instances.forEach(([x, y]) => {
                ctx.putImageData(raw, x * tileDimensions, y * tileDimensions);
            });
        });
    }
}
