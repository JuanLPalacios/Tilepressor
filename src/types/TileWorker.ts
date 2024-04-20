import { bspNode } from '../utilities/bsp';
import { SerializableTile } from './SerializableTile';
import { Color } from './Color';
import { ColorModel } from '../enums/ColorModel';
import { TileModel } from '../enums/TileModel';
import { TaskTypes } from '~/enums/TaskType';

export interface TileWorker extends Omit<Worker, 'postMessage'> {
    postMessage(message: CompressorMessage, transfer: Transferable[]): void;
}

export type WorkerData = {
    k: number;
    colorModel: ColorModel;
    tileModel: TileModel;
    tiles: SerializableTile[];
    colors: Color[];
    bspt?: bspNode<Color>;
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
