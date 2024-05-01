import { createContext } from 'react';
import { ColorModel } from '~/enums/ColorModel';
import { TileModel } from '~/enums/TileModel';
import { bspNode } from '~/utilities/bsp';
import { StatePair } from '~/types/StatePair';
import { Color } from '~/types/Color';
import { PaletteModel } from '~/enums/PaletteModel';
import { MenuOptionsV010 } from './MenuOptionsV010';

export const MENU_OPTIONS_STORAGE_KEY = 'MenuOptions';

export type MenuOptionsV020 = {version:'0.2.0'} & CompressionOptionsV020 & AbstractionOptionsV020

export type CompressionOptionsV020 = {
    k:number
    tileDimensions:number
    usePixelData: boolean
    selectedPalette: number,
    colorPalette: ColorPalette[]
};

export type AbstractionOptionsV020 = {
    colorModel: ColorModel,
    tileModel: TileModel
    paletteModel: PaletteModel
};

export type SavedColorPalette = {
    name:string,
    paletteModel:PaletteModel,
    colorPalette:ColorPalette[]
}

export type ColorPalette = {
    colors:Color[],
    bspt?:bspNode<Color>
}

export const MenuOptionsContext = createContext<StatePair<MenuOptionsV020>>([
    undefined as never,
    ()=>undefined]
);
export function convertToCurrent(value: MenuOptionsV020 | MenuOptionsV010) {
    if (!('version' in value))
        value = { ...value, version: '0.2.0', colorPalette: [value.colorPalette], paletteModel: PaletteModel.RGBA };
    return value;
}
