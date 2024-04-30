import { ColorModel } from '../enums/ColorModel';
import { TileModel } from '../enums/TileModel';
import { TaskTypes } from '../enums/TaskType';
import { PaletteModel } from '~/enums/PaletteModel';

export function addId(arg0: { action: TaskTypes; progress: number; }[], id: number|string): { action: TaskTypes; id: number | string; progress: number; }[] {
    return arg0.map(x=>({ ...x, id }));
}

export function createFilterChain(arg0: { action: TaskTypes; progress: number; }[], paletteModel: PaletteModel): { action: TaskTypes; progress: number; }[] {
    return (paletteModel!=PaletteModel.RGBA)? [{ action: TaskTypes.generateBSPT, progress: 0 }, ...arg0, { action: TaskTypes.applyFilter, progress: 0 }]:arg0;
}

export function colorLab(arg0: { action: TaskTypes; progress: number; }[], colorModel: ColorModel, usePixelData:boolean): { action: TaskTypes; progress: number; }[] {
    return (colorModel!==ColorModel.RGB)? [{ action: TaskTypes.rgb2lab, progress: 0 }, ...arg0, ...(usePixelData?[]:[{ action: TaskTypes.lab2rgb, progress: 0 }])]:arg0;
}

export function CDT(arg0: { action: TaskTypes; progress: number; }[], tileModel: TileModel, usePixelData:boolean): { action: TaskTypes; progress: number; }[] {
    return (tileModel!==TileModel.Raster)? [{ action: TaskTypes.pixels2dct, progress: 0 }, ...arg0, ...(usePixelData?[]:[{ action: TaskTypes.cdt2pixels, progress: 0 }])]:arg0;
}

export function createCompressChain(): { action: TaskTypes; progress: number; }[] {
    return [{ action: TaskTypes.kMeansPlusPlus, progress: 0 }];
}
let _id = Date.now();
export const UUID = () => `${++_id}`;
