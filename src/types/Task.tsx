import { WorkerData } from '~/types/TileWorker';
import { TaskTypes } from '~/enums/TaskType';

export type Task = {
    action: TaskTypes;
    id: number | string;
    progress: number;
    props?: WorkerData;
};
