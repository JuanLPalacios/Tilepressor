import { ExportFormat } from '~/enums/ExportFormat';
import { SavedColorPalette, MenuOptions } from './MenuOptions';
import { createContext } from 'react';
import { StatePair } from '~/types/StatePair';

export type ConfigOptions = {
    useGrid: boolean;
    savedPalettes: SavedColorPalette[];
    exportingFormat: ExportFormat;
    presets: { name: string; options: MenuOptions; }[];
    saveFreq: number
};

export const CONFIG_OPTIONS_STORAGE_KEY = 'ConfigOptions';

export const ConfigOptionsContext = createContext<StatePair<ConfigOptions>>([
    undefined as never,
    ()=>undefined]
);
