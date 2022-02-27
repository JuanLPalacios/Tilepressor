export function mapTiles(img:HTMLImageElement, width = 8, height = 8){
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = Math.max(256, img.width);
  canvas.height = Math.max(256, img.height);
  canvas.style.width = `${Math.max(256, img.width) * 2}px`;
  canvas.style.height = `${Math.max(256, img.height) * 2}px`;

  ctx.fillStyle = '#e0f8cf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  img.onload = null;

  const tiles = {};
  let uuid = 0;
  for (let y = 0; y < img.height; y += 8) {
    for (let x = 0; x < img.width; x += 8) {
      // console.log(x, y);
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
    return tiles;
  }
}