import { JSXElementConstructor, ReactElement, ReactFragment, ReactPortal, useEffect, useLayoutEffect, useMemo, useReducer, useState } from 'react';
import { MenuOptions, MenuOptionsContext, MENU_OPTIONS_STORAGE_KEY } from './MenuOptions';
import { ExportFormat } from '~/enums/ExportFormat';
import { TileModel } from '~/enums/TileModel';
import { ColorModel } from '~/enums/ColorModel';
import { MapFeedback, MapFeedbackContext } from './MapFeedback';
import { TasksContext, tasksReducer } from './TasksState';
import { TileWorker, WorkerResponse } from '~/types/TileWorker';
import { TaskTypes } from '~/enums/TaskType';
import { createImageData, loadData } from '~/utilities/2dContextUtilities';
import { FilesContext, filesReducer } from './FilesStates';
import { SizeContext } from './Size';
import { img2Tiles } from '~/utilities/tileUtilities';
import { GLOBAL_TASK_ID } from './GLOBAL_TASK_ID';
import { CONFIG_OPTIONS_STORAGE_KEY, ConfigOptions, ConfigOptionsContext } from './ConfigOptions';
import { PaletteModel } from '~/enums/PaletteModel';

export const AppStateProvider = (props: { children: string | number | boolean | ReactElement<unknown, string | JSXElementConstructor<unknown>> | ReactFragment | ReactPortal | null | undefined; }) => {
    const tileWorker: TileWorker = useMemo(
        () => new Worker(new URL('../workers/tileWorker.ts', import.meta.url), { type: 'module' }),
        []
    );
    const useTasks = useReducer(tasksReducer(tileWorker), { });
    const useFiles = useReducer(filesReducer, []);
    const useMenuOptions = useState<MenuOptions>(():MenuOptions=>{
        const value = window.localStorage.getItem(MENU_OPTIONS_STORAGE_KEY);
        if(!value) return {
            colorPalette: [{ colors: [] }],
            k: 0,
            selectedPalette: -1,
            tileDimensions: 8,
            colorModel: ColorModel.Lab,
            tileModel: TileModel.CDT,
            paletteModel: PaletteModel.RGBA,
            usePixelData: true
        };
        return JSON.parse(value);
    });
    const useConfigOptions = useState<ConfigOptions>(():ConfigOptions=>{
        const value = window.localStorage.getItem(CONFIG_OPTIONS_STORAGE_KEY);
        if(!value) return {
            exportingFormat: ExportFormat.PNG,
            savedPalettes: [
                {
                    'name': 'GB studio bg',
                    colorPalette: [{
                        'colors': [[48, 104, 80, 255], [134, 192, 108, 255], [224, 248, 207, 255], [7, 24, 33, 255]],
                        'bspt': { 'divider': [[48, 104, 80, 255], [134, 192, 108, 255]], 'front': [48, 104, 80, 255], 'back': [134, 192, 108, 255], 'inFront': { 'divider': [[48, 104, 80, 255], [7, 24, 33, 255]], 'front': [48, 104, 80, 255], 'back': [7, 24, 33, 255], 'inFront': null, 'inBack': null }, 'inBack': { 'divider': [[134, 192, 108, 255], [224, 248, 207, 255]], 'front': [134, 192, 108, 255], 'back': [224, 248, 207, 255], 'inFront': null, 'inBack': null } }
                    }],
                    paletteModel: PaletteModel.Indexed
                },
                {
                    'name': 'GB studio sprite',
                    colorPalette: [{
                        'colors': [[101, 255, 0, 255], [7, 24, 33, 255], [134, 192, 108, 255], [224, 248, 207, 255]],
                        'bspt': { 'divider': [[101, 255, 0, 255], [134, 192, 108, 255]], 'front': [101, 255, 0, 255], 'back': [134, 192, 108, 255], 'inFront': null, 'inBack': { 'divider': [[7, 24, 33, 255], [134, 192, 108, 255]], 'front': [7, 24, 33, 255], 'back': [134, 192, 108, 255], 'inFront': null, 'inBack': { 'divider': [[134, 192, 108, 255], [224, 248, 207, 255]], 'front': [134, 192, 108, 255], 'back': [224, 248, 207, 255], 'inFront': null, 'inBack': null } } }
                    }],
                    paletteModel: PaletteModel.Indexed
                }
            ],
            useGrid: false,
            presets: [
                {
                    'name': 'GB studio bg',
                    'options': { 'colorModel': 1, 'colorPalette': [{ 'colors': [[48, 104, 80, 255], [134, 192, 108, 255], [224, 248, 207, 255], [7, 24, 33, 255]], 'bspt': { 'divider': [[48, 104, 80, 255], [134, 192, 108, 255]], 'front': [48, 104, 80, 255], 'back': [134, 192, 108, 255], 'inFront': { 'divider': [[48, 104, 80, 255], [7, 24, 33, 255]], 'front': [48, 104, 80, 255], 'back': [7, 24, 33, 255], 'inFront': null, 'inBack': null }, 'inBack': { 'divider': [[134, 192, 108, 255], [224, 248, 207, 255]], 'front': [134, 192, 108, 255], 'back': [224, 248, 207, 255], 'inFront': null, 'inBack': null } } }], 'k': 192, 'selectedPalette': 0, 'tileDimensions': 8, 'tileModel': 1, 'paletteModel': PaletteModel.Indexed, 'usePixelData': true }
                },
                {
                    'name': 'GB studio sprite',
                    'options': { 'colorModel': 1, 'colorPalette': [{ 'colors': [[101, 255, 0, 255], [7, 24, 33, 255], [134, 192, 108, 255], [224, 248, 207, 255]], 'bspt': { 'divider': [[101, 255, 0, 255], [134, 192, 108, 255]], 'front': [101, 255, 0, 255], 'back': [134, 192, 108, 255], 'inFront': null, 'inBack': { 'divider': [[7, 24, 33, 255], [134, 192, 108, 255]], 'front': [7, 24, 33, 255], 'back': [134, 192, 108, 255], 'inFront': null, 'inBack': { 'divider': [[134, 192, 108, 255], [224, 248, 207, 255]], 'front': [134, 192, 108, 255], 'back': [224, 248, 207, 255], 'inFront': null, 'inBack': null } } } }], 'k': 100, 'selectedPalette': 1, 'tileDimensions': 8, 'tileModel': 1, 'paletteModel': PaletteModel.Indexed, 'usePixelData': true }
                }
            ],
            saveFreq: 0
        };
        return JSON.parse(value);
    });
    const useMapFeedback = useState<MapFeedback>({
        maxK: 1,
    });
    const [menuOptions, setMenuOptions] = useMenuOptions;
    const [configOptions] = useConfigOptions;
    const [tasks, dispatchTasksAction] = useTasks;
    const [files, dispatchFilesAction] = useFiles;
    const { usePixelData } = menuOptions;
    const { saveFreq } = configOptions;
    const [size, setSize] = useState({ width: 0, height: 0 });
    const { tileDimensions } = menuOptions;
    useLayoutEffect(() => {
        function updateSize() {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            files.forEach(({ id, image })=> {
                if(image){ //needed here to both prevent yet to be loaded files and clearing the generated original tileset
                    dispatchFilesAction({ type: 'file/update', payload: { id, file: { tiles: undefined } } });
                    img2Tiles(image.src as string, tileDimensions).then(tiles=>{
                        dispatchFilesAction({ type: 'file/update', payload: { id, file: { tiles } } });
                    });
                }
            });
        }, 3000);

        return () => clearTimeout(delayDebounceFn);
    }, [files.length, tileDimensions]);
    if (window.Worker) {
        tileWorker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const { id, action, progress, data } = e.data;
            const { tiles, colorPalette } = data;
            const chain = tasks[id];
            if(!chain)return;
            const i = chain.findIndex(x=>x.action == action);
            const task = chain[i];
            if(!task.props) return;
            task.progress = progress;
            if(progress == 1){
                switch (action) {
                case TaskTypes.kMeansPlusPlus:
                    if(usePixelData)tiles?.forEach(tile => { tile.data=tile.raw; });
                    break;
                case TaskTypes.getColors:
                    if(id == GLOBAL_TASK_ID){
                        if(colorPalette)setMenuOptions({ ...menuOptions, colorPalette });
                    }
                    break;
                case TaskTypes.generateBSPT:
                    if(id == GLOBAL_TASK_ID){
                        if(colorPalette)setMenuOptions({ ...menuOptions, colorPalette });
                    }
                    break;
                default:
                    break;
                }
                if(i<chain.length-1){
                    const nextTask = chain[i+1];
                    const props = { ...task.props, ...data };
                    nextTask.props = props;
                    tileWorker.postMessage({ id, action: nextTask.action, props }, []);
                    dispatchTasksAction({ type: 'task/update', payload: { id, task: { ...task, progress } } });
                }
                else{
                    if(colorPalette)setMenuOptions({ ...menuOptions, colorPalette });
                    dispatchFilesAction({ type: 'file/update', payload: { id, file: { newTiles: tiles?.map((tile)=>{
                        const tileDimensions = Math.sqrt(tile.data.length/4);
                        const newTile = { ...tile, raw: createImageData({ width: tileDimensions, height: tileDimensions }) };
                        loadData(newTile);
                        return newTile;
                    }) } } });
                    dispatchTasksAction({ type: 'task/remove', payload: id });
                }
            }
            else{
                dispatchTasksAction({ type: 'task/update', payload: { id, task: { ...task, progress } } });
            }
        };
    }
    useEffect(()=>{
        const id = setTimeout(()=>{ window.localStorage.setItem(MENU_OPTIONS_STORAGE_KEY, JSON.stringify(menuOptions)); }, saveFreq);
        return ()=>clearTimeout(id);
    }, [menuOptions]);
    useEffect(()=>{
        const id = setTimeout(()=>{ window.localStorage.setItem(CONFIG_OPTIONS_STORAGE_KEY, JSON.stringify(configOptions)); }, saveFreq);
        return ()=>clearTimeout(id);
    }, [configOptions]);
    return<MapFeedbackContext.Provider value={useMapFeedback}>
        <MenuOptionsContext.Provider value={useMenuOptions}>
            <ConfigOptionsContext.Provider value={useConfigOptions}>
                <TasksContext.Provider value={useTasks}>
                    <FilesContext.Provider value={useFiles}>
                        <SizeContext.Provider value={size}>
                            {props.children}
                        </SizeContext.Provider>
                    </FilesContext.Provider>
                </TasksContext.Provider>
            </ConfigOptionsContext.Provider>
        </MenuOptionsContext.Provider>
    </MapFeedbackContext.Provider>;
};