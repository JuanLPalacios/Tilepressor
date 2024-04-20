import { createContext } from 'react';
import { Tile } from '~/utilities/tileUtilities';

export type MapState = {
    id:number|string
    file:File
    image?: HTMLImageElement
    tiles?:Tile[]
    newTiles?:Tile[]
    changed: boolean
}

export type FileListsState = MapState[]

type FileAction =
    AddFile |
    UpdateFile |
    RemoveFile |
    SaveFile;

type AddFile = {
    type: 'file/open',
    payload:{
        id:number|string,
        chain:MapState
    }
}

type UpdateFile = {
    type: 'file/update',
    payload:{
        id:number|string,
        file:Partial<MapState>
    }
}

type RemoveFile = {
    type: 'file/close',
    payload:number|string,
}

type SaveFile = {
    type: 'file/save',
    payload:number|string,
}

export const filesReducer = (state:FileListsState, action: FileAction):FileListsState => {
    state;
    switch (action.type) {
    case 'file/open':
        return [...state, action.payload.chain];
    case 'file/close':
        return state.filter(x=>x.id!=action.payload);
    case 'file/update':
        return state.map(x=>(x.id === action.payload.id)?{ ...x, ...action.payload.file, changed: true }:x);
    case 'file/save':
        return state.map(x=>(x.id === action.payload)?{ ...x, changed: false }:x);
    default:
        throw new Error();
    }
};

export const FilesContext = createContext<[FileListsState, React.Dispatch<FileAction>]>([
    [], ()=>undefined]);