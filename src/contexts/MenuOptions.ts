import { createContext } from 'react';
import { ColorModel } from '~/enums/ColorModel';
import { TileModel } from '~/enums/TileModel';
import { bspNode } from '~/utilities/bsp';
import { StatePair } from '~/types/StatePair';
import { Color } from '~/types/Color';
import { PaletteModel } from '~/enums/PaletteModel';

export const MENU_OPTIONS_STORAGE_KEY = 'MenuOptions';

export type MenuOptions = CompressionOptions & AbstractionOptions

export type CompressionOptions = {
    k:number
    tileDimensions:number
    usePixelData: boolean
    selectedPalette: number,
    colorPalette: ColorPalette[]
};

export type AbstractionOptions = {
    colorModel: ColorModel,
    tileModel: TileModel
    paletteModel: PaletteModel
};

export type SavedColorPalette = {
    name:string,
    colorPalette:ColorPalette[]
}

export type ColorPalette = {
    colors:Color[],
    bspt?:bspNode<Color>
}

export const MenuOptionsContext = createContext<StatePair<MenuOptions>>([
    undefined as never,
    ()=>undefined]
);