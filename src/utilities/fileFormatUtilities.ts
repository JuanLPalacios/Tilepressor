import { Dispatch, SetStateAction } from 'react';
import { img2Tiles } from './tileUtilities';
import { FileAction, FileListsState } from '../contexts/FilesStates';
import { UUID } from './tasksUtilities';

export function openRaster(dispatchFilesAction: Dispatch<FileAction>, file: File, setActiveTab, maps: FileListsState, tileDimensions: number) {
    const id = UUID();
    dispatchFilesAction({ type: 'file/open', payload: { id, chain: { id, changed: false, file, } } });
    setActiveTab(maps.length);
    const fr = new FileReader();
    fr.onload = () => {
        const image = new Image();
        image.onload = () => {
            img2Tiles(fr.result as string, tileDimensions).then(tiles => {
                dispatchFilesAction({ type: 'file/update', payload: { id, file: { tiles, image } } });
            });
        };
        image.src = fr.result as string;
    };
    fr.readAsDataURL(file);
}
export function openGBStudioZIP(dispatchFilesAction: Dispatch<FileAction>, file: File, setActiveTab: Dispatch<SetStateAction<number>>, maps: FileListsState, tileDimensions: number) {
    throw new Error('Function not implemented.');
}
