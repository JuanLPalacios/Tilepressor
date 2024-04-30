import { Tabs } from './Tabs';
import { ExportFormat } from '../enums/ExportFormat';
import { Tab } from './Tab';
import { TileModel } from '../enums/TileModel';
import { ColorModel } from '../enums/ColorModel';
import { useContext, useEffect, useState } from 'react';
import { MenuOptionsContext } from '../contexts/MenuOptions';
import { MapFeedbackContext } from '../contexts/MapFeedback';
import { TasksContext } from '../contexts/TasksState';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { FilesContext } from '../contexts/FilesStates';
import { renderCompressed, renderOriginal, renderTileSet } from '../utilities/renderViews';
import { Task } from '../types/Task';
import { CDT, addId, colorLab, createCompressChain, createFilterChain } from '../utilities/tasksUtilities';
import { serializeTiles } from '../utilities/tileUtilities';
import { Size } from '../contexts/Size';
import { TaskTypes } from '../enums/TaskType';
import { GLOBAL_TASK_ID } from '../contexts/GLOBAL_TASK_ID';
import { GrClose, GrArchive, GrInProgress, GrDocumentDownload, GrConfigure, GrSave, GrEdit, GrTrash, GrDownload, GrInstallOption  } from 'react-icons/gr';
import { ConfigOptionsContext } from '../contexts/ConfigOptions';
import { PaletteModel } from '~/enums/PaletteModel';
import { ColorPaletteMenu } from './ColorPaletteMenu';

export const Menu = ({ width=100, height=100 }:Partial<Size>) => {
    const useMenuOptions = useContext(MenuOptionsContext);
    const useConfigOptions = useContext(ConfigOptionsContext);
    const useMapFeedback = useContext(MapFeedbackContext);
    const useFiles = useContext(FilesContext);
    const useTasks = useContext(TasksContext);
    const [tasks, dispatchTasksAction] = useTasks;
    const [files, dispatchFilesAction] = useFiles;
    const [isEditingPalette, setIsEditingPalette] = useState<boolean>(false);
    const [waitingToDownload, setWaitingToDownload] = useState<boolean>(false);
    const [selectedPreset, setSelectedPreset] = useState<number>(-1);
    const [menuOptions, setMenuOptions] = useMenuOptions;
    const [mapFeedback] = useMapFeedback;
    const [ConfigOptions, setConfigOptions] = useConfigOptions;
    const { exportingFormat, presets, savedPalettes } = ConfigOptions;
    const { colorModel, colorPalette, k, selectedPalette, tileDimensions, tileModel, paletteModel, usePixelData } = menuOptions;
    const { maxK, map } = mapFeedback;

    const usePalette = paletteModel !== PaletteModel.RGBA,
        bspt = colorPalette.reduce((prev, { bspt })=>(prev&&(!!bspt)), true);

    const download = async () => {
        const canvas:HTMLCanvasElement = document.createElement('canvas');
        const zip = new JSZip();
        const img = zip.folder('images');
        const comp = zip.folder('compressed');
        const tile = zip.folder('tileSets');
        if(!img)return;
        if(!comp)return;
        if(!tile)return;
        if (map) {
            const { file, image, newTiles, id } = map;
            if(newTiles&&image){
                const tileDimensions = Math.sqrt(newTiles[0].data.length);
                renderOriginal(canvas, image);
                img.file(file.name, await new Promise<Blob>(res => canvas.toBlob(t=>{ if(t)res(t); })));
                renderCompressed(canvas, image, newTiles, tileDimensions);
                comp.file(file.name, await new Promise<Blob>(res => canvas.toBlob(t=>{ if(t)res(t); })));
                renderTileSet(canvas, newTiles, tileDimensions);
                tile.file(file.name, await new Promise<Blob>(res => canvas.toBlob(t=>{ if(t)res(t); })));
                dispatchFilesAction({ type: 'file/save', payload: id });
                zip.generateAsync({ type: 'blob' })
                    .then(function(content) {
                        saveAs(content, file.name.split('.')[0]+'.zip');
                    });
            }
        }
    };
    const downloadAll = async () => {
        const canvas:HTMLCanvasElement = document.createElement('canvas');
        const zip = new JSZip();
        const img = zip.folder('images');
        const comp = zip.folder('compressed');
        const tile = zip.folder('tileSets');
        if(!img)return;
        if(!comp)return;
        if(!tile)return;
        for (let i = 0; i < files.length; i++) {
            const { file, image, newTiles, id } = files[i];
            if(newTiles&&image){
                const tileDimensions = Math.sqrt(newTiles[0].data.length/4);
                renderOriginal(canvas, image);
                img.file(file.name, await new Promise<Blob>(res => canvas.toBlob(t=>{ if(t)res(t); })));
                renderCompressed(canvas, image, newTiles, tileDimensions);
                comp.file(file.name, await new Promise<Blob>(res => canvas.toBlob(t=>{ if(t)res(t); })));
                renderTileSet(canvas, newTiles, tileDimensions);
                tile.file(file.name, await new Promise<Blob>(res => canvas.toBlob(t=>{ if(t)res(t); })));
                dispatchFilesAction({ type: 'file/save', payload: id });
            }
        }
        zip.generateAsync({ type: 'blob' })
            .then(function(content) {
                saveAs(content, 'tilepressor.zip');
            });
    };
    const savePalette = () =>{
        const name = prompt('Palette name:')||'new palette';
        setConfigOptions({ ...ConfigOptions, savedPalettes: [...savedPalettes, { name, paletteModel, colorPalette }] });
        setMenuOptions({ ...menuOptions, selectedPalette: savedPalettes.length });
        setIsEditingPalette(false);
    };
    const savePreset = () =>{
        const name = prompt('Preset name:')||'new preset';
        //setSelectedPreset(presets.length);
        setConfigOptions({ ...ConfigOptions, presets: [...presets, { name, options: menuOptions }] });
    };
    const compress = () => {
        if (map&&window.Worker && map.tiles) {
            const { id, tiles } = map;
            const chain:Task[] = addId(createFilterChain(colorLab(CDT(createCompressChain(), tileModel, usePixelData), colorModel, usePixelData), paletteModel), id);
            const nextTask = chain[0];
            const props = { tiles: serializeTiles(tiles), colorModel, tileModel, k, colorPalette, paletteModel };
            nextTask.props = props;
            dispatchTasksAction({ type: 'task/add', payload: { id, chain } });
        }
    };
    const compressAll = () => {
        if (map&&window.Worker && map.tiles) {
            for (let i = 0; i < files.length; i++) {
                const { id, tiles } = files[i];
                if(tiles){
                    const chain:Task[] = addId(createFilterChain(colorLab(CDT(createCompressChain(), tileModel, usePixelData), colorModel, usePixelData), paletteModel), id);
                    const nextTask = chain[0];
                    const props = { tiles: serializeTiles(tiles), colorModel, tileModel, k, colorPalette, paletteModel };
                    nextTask.props = props;
                    dispatchTasksAction({ type: 'task/add', payload: { id, chain } });
                }
            }
            setWaitingToDownload(true);
        }
    };
    useEffect(() => {
        if(waitingToDownload&&(Object.keys(tasks).length==0)){
            downloadAll();
            setWaitingToDownload(false);
        }
    }, [waitingToDownload, tasks]);
    useEffect(() => {
        if(selectedPalette==-1){
            if(map){
                const { tiles } = map;
                if(tiles){
                    const serializedTiles = serializeTiles(tiles);
                    dispatchTasksAction({ type: 'task/add', payload: { id: GLOBAL_TASK_ID, chain: [
                        { id: GLOBAL_TASK_ID, action: TaskTypes.getColors, progress: 0, props: { tiles: serializedTiles, k: 0, colorModel, tileModel, paletteModel, colorPalette } },
                        { id: GLOBAL_TASK_ID, action: TaskTypes.generateBSPT, progress: 0, props: { tiles: serializedTiles, k: 0, colorModel, tileModel, paletteModel, colorPalette } }
                    ] } });
                }
            }
        }
        else{
            setMenuOptions({ ...menuOptions, colorPalette: { ...savedPalettes[selectedPalette].colorPalette } });
        }
    }, [selectedPalette, map?.image]);
    const applyPreset =() => {
        if(selectedPreset!=-1){
            setSelectedPreset(-1);
            setMenuOptions({ ...presets[selectedPreset].options });
        }
    };
    useEffect(()=>{
        if(isEditingPalette&&(selectedPalette==-1)){
            const id = setTimeout(()=>dispatchTasksAction({ type: 'task/add', payload: { id: GLOBAL_TASK_ID, chain: [
                { id: GLOBAL_TASK_ID, action: TaskTypes.generateBSPT, progress: 0, props: { tiles: [], k: 0, colorModel, tileModel, paletteModel, colorPalette } }
            ] } }), 3000);
            return ()=>clearTimeout(id);
        }
    },
    [colorPalette]);
    const editPalette = ()=>{
        setIsEditingPalette(true);
        setMenuOptions({ ...menuOptions, colorPalette: { ...colorPalette } });
    };
    return <Tabs tapsPosition='left' width={width} height={height}>
        <Tab label={<div className='p-1'><GrArchive /></div>} tip='compress'>
            <div className=' h-[calc(100vh-2rem)] px-2 flex flex-col place-content-stretch'>
                <label className='flex flex-col'>
                    <span
                        className="block text-sm font-medium leading-6"
                    >
                        tile dimensions
                    </span>
                    <input
                        id="dimensions"
                        type="number"
                        value={tileDimensions}
                        onChange={(e) => setMenuOptions({ ...menuOptions, tileDimensions: parseInt(e.target.value) })}
                        className='bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2' />
                </label>
                <label>
                    <div
                        className="block text-sm font-medium leading-6"
                    >
                        target tile count
                    </div>
                    <div
                        className="block text-sm font-medium leading-6"
                    >
                        (
                        <span>
                            {Math.min(k, maxK)}
                        </span>
                        /
                        <span>
                            {maxK}
                        </span>
                        )
                    </div>
                    <div className='flex text-primary-100'>
                        <input
                            id="k"
                            type="range"
                            value={Math.min(k, maxK)}
                            min='1'
                            max={maxK}
                            onChange={(e) => setMenuOptions({ ...menuOptions, k: parseInt(e.target.value) })}
                            className='block bg-primary-50 w-full rounded-md border-0 py-1.5 text-primary-50 shadow-sm ring-1 ring-inset ring-primary-200 placeholder:text-primary-200 focus:ring-2 focus:ring-inset focus:ring-primary-300 sm:text-sm sm:leading-6 accent-primary-300 ' />
                    </div>
                </label>
                <label>
                    palette model
                    <select
                        className='bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2'
                        value={colorModel}
                        onChange={e => setMenuOptions({ ...menuOptions, paletteModel: e.target.value as never })}
                    >
                        {Object.values(PaletteModel)
                            .filter(v => typeof v === 'number')
                            .map((key) => <option key={key} value={key}>{ColorModel[key as PaletteModel]}</option>
                            )}
                    </select>
                </label>
                <span
                    className="block text-sm font-medium leading-6"
                >
                </span>
                <label>
                    <span
                        className="block text-sm font-medium leading-6"
                    >
                        color model
                    </span>
                    <select
                        className='bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2'
                        value={selectedPalette}
                        onChange={e => setMenuOptions({ ...menuOptions, selectedPalette: parseInt(e.target.value) })}
                        disabled={isEditingPalette}
                    >
                        <option value={-1}>current colors</option>
                        {savedPalettes.map((palette, i) => <option key={`palette-${i}`} value={i}>{palette.name}</option>)}
                    </select>
                </label>
                <div className='flex'>
                    <label className='flex-1'>
                        Palette
                    </label>
                    <button
                        onClick={() => setConfigOptions({ ...ConfigOptions, savedPalettes: savedPalettes.filter((x, i) => (i != selectedPalette)) })}
                        className='bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1'
                        title='delete palette'
                        disabled={selectedPalette==-1}
                    >
                        <GrTrash />
                    </button>
                    <button
                        onMouseUp={savePalette} // onMouseUp prevents chain triggering after rerender
                        className='bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1'
                        title='save palette'
                        disabled={!bspt}
                    >
                        <GrSave />
                    </button>
                    {isEditingPalette?
                        <button
                            onMouseUp={()=>setIsEditingPalette(false)} // onMouseUp prevents chain triggering after rerender
                            className='bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1'
                            title='close'
                            disabled={!bspt}
                        >
                            <GrClose />
                        </button>:
                        <button
                            onMouseUp={editPalette} // onMouseUp prevents chain triggering after rerender
                            className='bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1'
                            title='import palette'
                        >
                            <GrEdit />
                        </button>}
                </div>
                {colorPalette.map((palette, i)=><ColorPaletteMenu
                    key={`color-palette-${i}`}
                    colorPalette={palette}
                    onChangeColorPalette={(p)=>{
                        setMenuOptions({
                            ...menuOptions,
                            colorPalette: colorPalette.map((palette, j)=>((i==j)?p:palette))
                        }); }}
                    isEditingPalette={isEditingPalette} ></ColorPaletteMenu>)}
                <button
                    onClick={compress}
                    className="rounded-md bg-primary-300 disabled:bg-primary-400 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 mt-3 mb-1"
                    disabled={(!map)||(usePalette&&!bspt)||(Object.keys(tasks).length>0)}
                >
                    compress
                </button>
                <button
                    onClick={compressAll}
                    className="rounded-md bg-primary-300 disabled:bg-primary-400 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 mt-1 mb-3"
                    disabled={(!map)||(usePalette&&!bspt)||(Object.keys(tasks).length>0)}
                >
                    compress all <GrDownload className='inline-block align-top' />
                </button>
            </div>
        </Tab>
        <Tab label={<div className='p-1'><GrInProgress className={`${(Object.keys(tasks).length>0)&&'animate-spin text-primary-300'}`} /></div>} tip='model'>
            <div className=' h-[calc(100vh-2rem)] px-2 flex flex-col place-content-stretch'>
                <label>
                    <span
                        className="block text-sm font-medium leading-6"
                    >
                        color model
                    </span>
                    <select
                        className='bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2'
                        value={colorModel}
                        onChange={e => setMenuOptions({ ...menuOptions, colorModel: e.target.value as never })}
                    >
                        {Object.values(ColorModel)
                            .filter(v => typeof v === 'number')
                            .map((key) => <option key={key} value={key}>{ColorModel[key as ColorModel]}</option>
                            )}
                    </select>
                </label>
                <label>
                    <span
                        className="block text-sm font-medium leading-6"
                    >
                        tile comparison model
                    </span>
                    <select
                        className='bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2'
                        value={tileModel}
                        onChange={e => setMenuOptions({ ...menuOptions, tileModel: e.target.value as never })}
                    >
                        {Object.values(TileModel)
                            .filter(v => typeof v === 'number')
                            .map((key) => <option key={key} value={key}>{TileModel[key as TileModel]}</option>
                            )}
                    </select>
                </label>
                {/* <label>
                    <input
                        type="checkbox"
                        checked={usePixelData}
                        onChange={(e) => setMenuOptions({ ...menuOptions, usePixelData: e.target.checked })}
                        className='rounded-md border-0 mx-1.5 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset focus:ring-primary-300 sm:text-sm sm:leading-6 accent-primary-300' />
                    accurate pixel data
                </label> */}
                <hr className='mt-2' />
                <label>
                    <span
                        className="block text-sm font-medium leading-6"
                    >
                        process list
                    </span>
                </label>
                <div
                    className='flex-1 overflow-y-auto'
                >
                    {tasks[GLOBAL_TASK_ID]&&<div>
                        <div>global tasks</div>
                        {tasks[GLOBAL_TASK_ID]?.map(({ action, progress, id }, j) => <progress key={`${id}-${j}`} id="bar" value={progress}>{action}</progress>)}
                    </div>}
                    {files.map(({ file, id }, i) => tasks[id]&&<div key={`chain-${i}`}>
                        <div>{file.name}</div>
                        {tasks[id]?.map(({ action, progress, id }, j) => <progress key={`${id}-${j}`} id="bar" value={progress}>{action}</progress>)}
                    </div>)}
                </div>
            </div>
        </Tab>
        <Tab label={<div className='p-1'><GrDocumentDownload /></div>} tip='save'>
            <div className=' h-[calc(100vh-2rem)] px-2 flex flex-col place-content-stretch'>
                <label>
                    <span
                        className="block text-sm font-medium leading-6"
                    >
                        format
                    </span>
                    <select
                        className='bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2'
                        value={exportingFormat}
                        onChange={e => setConfigOptions({ ...ConfigOptions, exportingFormat: e.target.value as never })}
                    >
                        {Object.values(ExportFormat)
                            .filter(v => typeof v === 'number')
                            .map((key) => <option key={key} value={key}>{ExportFormat[key as ExportFormat]}</option>
                            )}
                    </select>
                </label>
                <button
                    onClick={download}
                    className="rounded-md bg-primary-300 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-490 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 my-1 mt-3"
                >
                    download
                </button>
                <button
                    onClick={downloadAll}
                    className="rounded-md bg-primary-300 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-490 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 my-1 mb-3"
                >
                    download all
                </button>
            </div>
        </Tab>
        <Tab label={<div className='p-1'><GrConfigure /></div>} tip='config'>
            <div className=' h-[calc(100vh-2rem)] px-2 flex flex-col place-content-stretch'>
                <div className='flex'>
                    <span
                        className="flex-1 text-sm font-medium leading-6"
                    >
                        Presets
                    </span>
                    <button
                        onClick={() => setConfigOptions({ ...ConfigOptions, presets: presets.filter((x, i) => (i != selectedPalette)) })}
                        className='bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1'
                        title='delete preset'
                        disabled={selectedPreset==-1}
                    >
                        <GrTrash />
                    </button>
                    {(selectedPreset==-1)?<button
                        onMouseUp={savePreset} // onMouseUp prevents chain triggering after rerender
                        className='bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1'
                        title='save palette'
                        disabled={(!bspt||isEditingPalette)}
                    >
                        <GrSave />
                    </button>:<button
                        onMouseUp={applyPreset} // onMouseUp prevents chain triggering after rerender
                        className='bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1'
                        title='apply preset'
                    >
                        <GrInstallOption />
                    </button>}
                </div>
                <select
                    className='bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2'
                    value={selectedPreset}
                    onChange={e => setSelectedPreset(parseInt(e.target.value))}
                >
                    <option value={-1}>- none -</option>
                    {presets.map((palette, i) => <option key={`palette-${i}`} value={i}>{palette.name}</option>)}
                </select>
                <div>

                </div>
                <hr />
            </div>
        </Tab>
    </Tabs>;
};

