import { SerializableTile } from '../types/SerializableTile';

async function bufferToBase64(buffer: Uint8Array) {
    const base64url = await new Promise<string>(r => {
        const reader = new FileReader();
        reader.onload = () => r(reader.result as string || '');
        reader.readAsDataURL(new Blob([buffer]));
    });
    return base64url.slice(base64url.indexOf(',') + 1);
}

async function hashTile(tile: SerializableTile) {
    return await bufferToBase64(new Uint8Array(tile.data));
}
export async function hashTiles(tiles: SerializableTile[]) {
    const encoded = [];
    for (let i = 0; i < tiles.length; i++) {
        encoded.push(await hashTile(tiles[i]));
    }
    return encoded.toString();
}
