import { ExportFormat } from '~/enums/ExportFormat';
import { SavedColorPalette, MenuOptionsV020, ColorPalette } from './MenuOptions';
import { createContext } from 'react';
import { StatePair } from '~/types/StatePair';
import { MenuOptionsV010 } from './MenuOptionsV010';

export type ConfigOptionsV010 = {
    useGrid: boolean;
    savedPalettes: (ColorPalette&{name:string})[];
    exportingFormat: ExportFormat;
    presets: { name: string; options: MenuOptionsV020; }[];
    saveFreq: number
};

export type ConfigOptionsV020 = {
    version:'0.2.0'
    useGrid: boolean;
    savedPalettes: SavedColorPalette[];
    exportingFormat: ExportFormat;
    presets: {
        name: string;
        options: MenuOptionsV020|MenuOptionsV010;
    }[];
    saveFreq: number
};

export const CONFIG_OPTIONS_STORAGE_KEY = 'ConfigOptions';

export const ConfigOptionsContext = createContext<StatePair<ConfigOptionsV020>>([
    undefined as never,
    ()=>undefined]
);
