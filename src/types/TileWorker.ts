import { bspNode } from '../utilities/bsp';
import { SerializableTile } from './SerializableTile';
import { Color } from './Color';
import { ColorModel } from '../enums/ColorModel';
import { TileModel } from '../enums/TileModel';
import { TaskTypes } from '~/enums/TaskType';
import { PaletteModel } from '~/enums/PaletteModel';

export interface TileWorker extends Omit<Worker, 'postMessage'> {
    postMessage(message: CompressorMessage, transfer: Transferable[]): void;
}

export type ColorPalette = {
    colors: Color[];
    bspt?: bspNode<Color>;
}[]

export type WorkerData = {
    k: number;
    colorModel: ColorModel;
    tileModel: TileModel;
    paletteModel: PaletteModel;
    tiles: SerializableTile[];
    colorPalette: ColorPalette;
};

export type CompressorMessageData = {
    id: string | number;
    action: TaskTypes;
    props: WorkerData;
};

export type CompressorMessageEvent = MessageEvent<CompressorMessage>;
type CompressorMessage = {
    id: string | number;
} & CompressorMessageData;

export type WorkerResponse = {
    id: string | number;
    action: TaskTypes;
    progress: number;
    data: Partial<WorkerData>;
};
