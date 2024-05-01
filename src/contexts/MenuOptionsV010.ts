import { ColorModel } from '~/enums/ColorModel';
import { TileModel } from '~/enums/TileModel';
import { ColorPalette } from './MenuOptions';

export type MenuOptionsV010 = CompressionOptionsV010 & AbstractionOptionsV010

export type CompressionOptionsV010 = {
    k:number
    tileDimensions:number
    usePixelData: boolean
    selectedPalette: number,
    usePalette: boolean,
    colorPalette: ColorPalette
};

export type AbstractionOptionsV010 = {
    colorModel: ColorModel,
    tileModel: TileModel
};

export type SavedColorPaletteV010 = {
    name:string,
}&ColorPalette