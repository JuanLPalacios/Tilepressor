/* eslint-disable no-console */
export interface ITile {
  coords:{
    x:number,
    y:number
  }[],
  tileData: ImageData,
  times: number,
  uuid: number
}

export function mapTiles(img:HTMLImageElement, width = 8, height = 8):{[key:string]:ITile }{
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = Math.ceil(img.width/width)*8;
  canvas.height = Math.ceil(img.height/height)*8;
  canvas.style.width = `${Math.ceil(img.width/width)*8 * 2}px`;
  canvas.style.height = `${Math.ceil(img.height/height)*8 * 2}px`;

  ctx.fillStyle = '#e0f8cf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  img.onload = null;

  const tiles = {};
  let uuid = 0;
  for (let y = 0; y < img.height; y += 8) {
    for (let x = 0; x < img.width; x += 8) {
      const tileData = ctx.getImageData(x, y, width, height);
      const index = tileData.data.toString();
      if (tiles[index]) {
        tiles[index].coords.push({ x: x/width, y: y/height });
        tiles[index].times++;
      } else {
        tiles[index] = {
          uuid: uuid++,
          coords: [{ x: x/width, y: y/height }],
          times: 1,
          tileData: tileData
        };
      }
    }
  }
  return tiles;
}
