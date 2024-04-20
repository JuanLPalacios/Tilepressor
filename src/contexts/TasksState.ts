import { createContext } from 'react';
import { TileWorker } from '~/types/TileWorker';
import { Task } from '~/types/Task';

export type TaskListsState = {
    [key:string|number]:Task[]|undefined
}

type TaskAction =
    AddTask |
    UpdateTask |
    RemoveTask;

type AddTask = {
    type: 'task/add',
    payload:{
        id:number|string,
        chain:Task[]
    }
}

type UpdateTask = {
    type: 'task/update',
    payload:{
        id:number|string,
        task:Task
    }
}

type RemoveTask = {
    type: 'task/remove',
    payload:number|string,
}
export const tasksReducer = (tileWorker: TileWorker)=>{
    return (state:TaskListsState, action: TaskAction):TaskListsState => {
        state;
        switch (action.type) {
        case 'task/add':
            tileWorker.postMessage(action.payload.chain[0] as never, []);
            return { ...state, [action.payload.id]: action.payload.chain };
        case 'task/remove':
            return (state=>{
                delete state[action.payload];
                return state;
            })({ ...state });
        case 'task/update':
            return { ...state, [action.payload.id]: state[action.payload.id]?.map(task => task.action==action.payload.task.action?action.payload.task:task) };
        default:
            throw new Error();
        }
    };
};

export const TasksContext = createContext<[TaskListsState, React.Dispatch<TaskAction>]>([
    {}, ()=>undefined]);