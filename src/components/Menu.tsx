import { Tabs } from './Tabs';
import { ExportFormat } from '../enums/ExportFormat';
import { Tab } from './Tab';
import { TileModel } from '../enums/TileModel';
import { ColorModel } from '../enums/ColorModel';
import { useContext, useEffect, useState, useRef, useCallback } from 'react';
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
import { GrArchive, GrInProgress, GrDocumentDownload, GrConfigure, GrSave, GrTrash, GrDownload, GrInstallOption  } from 'react-icons/gr';
import { ConfigOptionsContext } from '../contexts/ConfigOptions';
import { TaskChainEditor } from './TaskChainEditor';
import { buildTaskChainFromBlocks, menuOptionsToBlocks } from '../utilities/taskChainBuilder';
import { Palette } from './Palette';
import { MenuWidthContext } from '../contexts/MenuWidth';

export const Menu = ({ width=100, height=100 }:Partial<Size>) => {
    const { width: contextMenuWidth, setWidth: setContextMenuWidth } = useContext(MenuWidthContext);
    const menuWidth = contextMenuWidth || width;
    const menuRef = useRef<HTMLDivElement>(null);
    const globalTaskMapRef = useRef<string|number|undefined>(undefined);
    const [isDragging, setIsDragging] = useState(false);
    const useMenuOptions = useContext(MenuOptionsContext);
    const useConfigOptions = useContext(ConfigOptionsContext);
    const useMapFeedback = useContext(MapFeedbackContext);
    const useFiles = useContext(FilesContext);
    const useTasks = useContext(TasksContext);
    const [tasks, dispatchTasksAction] = useTasks;
    const [files, dispatchFilesAction] = useFiles;
    const [waitingToDownload, setWaitingToDownload] = useState<boolean>(false);
    const [selectedPreset, setSelectedPreset] = useState<number>(-1);
    const [useAdvancedChain, setUseAdvancedChain] = useState<boolean>(false);
    const [menuOptions, setMenuOptions] = useMenuOptions;
    const [mapFeedback] = useMapFeedback;
    const [ConfigOptions, setConfigOptions] = useConfigOptions;
    const { exportingFormat, presets, savedPalettes } = ConfigOptions;
    const { colorModel, colorPalette, k, selectedPalette, tileDimensions, tileModel, usePalette, usePixelData, paletteCount, paletteSize, usePaletteFilter, palettes } = menuOptions;
    const { colors, bspt } = colorPalette;
    const { maxK, map } = mapFeedback;

    // Handle drag for resizing menu
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!menuRef.current) return;
            const container = menuRef.current.parentElement;
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const newWidth = containerRect.right - e.clientX;

            // Constrain width between 150px and 80% of container
            const minWidth = 150;
            const maxWidth = Math.floor(window.screen.width * 0.8);
            const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));

            setContextMenuWidth(constrainedWidth);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, setContextMenuWidth]);

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
    const downloadAll = useCallback(async () => {
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
    }, [files, dispatchFilesAction]);
    const savePreset = () =>{
        const name = prompt('Preset name:')||'new preset';
        //setSelectedPreset(presets.length);
        setConfigOptions({ ...ConfigOptions, presets: [...presets, { name, options: menuOptions }] });
    };
    const compress = () => {
        if (map&&window.Worker && map.tiles) {
            const { id, tiles } = map;
            let chain: Task[];

            if (useAdvancedChain && menuOptions.taskBlocks) {
                // Use custom task chain from visual editor
                const taskChain = buildTaskChainFromBlocks(menuOptions.taskBlocks, {
                    colorModel,
                    tileModel,
                    usePalette,
                    usePaletteFilter,
                    usePixelData
                });
                chain = addId(taskChain, id);
            } else {
                // Use legacy chain builder
                const useClusteredPalettes = usePaletteFilter;
                const filterTask = usePaletteFilter ? TaskTypes.applyPaletteFilter : TaskTypes.applyFilter;
                const enforcePalette = usePalette || usePaletteFilter;
                chain = addId(createFilterChain(colorLab(CDT(createCompressChain(useClusteredPalettes), tileModel, usePixelData), colorModel, usePixelData), enforcePalette, useClusteredPalettes, filterTask), id);
            }

            console.log('dispatch chain (single):', chain.map(task => TaskTypes[task.action]));
            const nextTask = chain[0];
            const props = { tiles: serializeTiles(tiles), colorModel, tileModel, k, bspt, colors, paletteCount, paletteSize };
            nextTask.props = props;
            dispatchTasksAction({ type: 'task/add', payload: { id, chain } });
        }
    };
    const compressAll = () => {
        if (map&&window.Worker && map.tiles) {
            for (let i = 0; i < files.length; i++) {
                const { id, tiles } = files[i];
                if(tiles){
                    let chain: Task[];

                    if (useAdvancedChain && menuOptions.taskBlocks) {
                        // Use custom task chain from visual editor
                        const taskChain = buildTaskChainFromBlocks(menuOptions.taskBlocks, {
                            colorModel,
                            tileModel,
                            usePalette,
                            usePaletteFilter,
                            usePixelData
                        });
                        chain = addId(taskChain, id);
                    } else {
                        // Use legacy chain builder
                        const useClusteredPalettes = usePaletteFilter;
                        const filterTask = usePaletteFilter ? TaskTypes.applyPaletteFilter : TaskTypes.applyFilter;
                        const enforcePalette = usePalette || usePaletteFilter;
                        chain = addId(createFilterChain(colorLab(CDT(createCompressChain(useClusteredPalettes), tileModel, usePixelData), colorModel, usePixelData), enforcePalette, useClusteredPalettes, filterTask), id);
                    }

                    console.log('dispatch chain (all):', id, chain.map(task => TaskTypes[task.action]));
                    const nextTask = chain[0];
                    const props = { tiles: serializeTiles(tiles), colorModel, tileModel, k, bspt, colors, paletteCount, paletteSize };
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
    }, [waitingToDownload, tasks, downloadAll]);
    useEffect(() => {
        if(selectedPalette==-1 && !usePaletteFilter){
            if(map && globalTaskMapRef.current !== map.id){
                globalTaskMapRef.current = map.id;
                const { tiles } = map;
                if(tiles){
                    const serializedTiles = serializeTiles(tiles);
                    dispatchTasksAction({ type: 'task/add', payload: { id: GLOBAL_TASK_ID, chain: [
                        { id: GLOBAL_TASK_ID, action: TaskTypes.getColors, progress: 0, props: { tiles: serializedTiles, k: 0, colorModel, tileModel, colors: [] } },
                        { id: GLOBAL_TASK_ID, action: TaskTypes.generateBSPT, progress: 0, props: { tiles: serializedTiles, k: 0, colorModel, tileModel, colors: [] } }
                    ] } });
                }
            }
        }
        else {
            globalTaskMapRef.current = undefined;
            if (selectedPalette >= 0) {
                setMenuOptions({ ...menuOptions, colorPalette: { ...savedPalettes[selectedPalette] } });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPalette, map, usePaletteFilter, colorModel, tileModel]);
    const applyPreset =() => {
        if(selectedPreset!=-1){
            setSelectedPreset(-1);
            setMenuOptions({ ...presets[selectedPreset].options });
        }
    };

    return (
        <div ref={menuRef} className="relative flex" style={{ width: `${menuWidth}px`, height: `${height}px` }}>
            <Tabs tapsPosition='left' width={menuWidth} height={height}>
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
                            <input
                                type="checkbox"
                                checked={usePalette}
                                onChange={(e) => setMenuOptions({ ...menuOptions, usePalette: e.target.checked })}
                                className='rounded-md border-0 mx-1.5 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset focus:ring-primary-300 sm:text-sm sm:leading-6 accent-primary-300' />
                    Enforce palette
                        </label>
                        <span
                            className="block text-sm font-medium leading-6"
                        >
                        </span>
                        {usePalette && !usePaletteFilter && <>
                            <div className='flex flex-col gap-2 mb-2 overflow-auto min-h-6 h-[calc(100vh-20rem)]'>

                                {(palettes && palettes.length ? palettes : [colorPalette.colors]).map((paletteColors, index) => (
                                    <div key={`palette-${index}`} className='mb-2 relative'>
                                        {palettes && palettes.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    const nextPalettes = palettes.filter((_, i) => i !== index);
                                                    setMenuOptions({ ...menuOptions, palettes: nextPalettes });
                                                }}
                                                className='absolute top-0 right-0 bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-[0.1rem] leading-[0.9rem]'
                                                title='remove palette'
                                            >
                                                -
                                            </button>
                                        )}
                                        <Palette
                                            colorPalette={{ colors: paletteColors }}
                                            setColorPalette={(newPalette) => {
                                                if (palettes && palettes.length) {
                                                    const nextPalettes = palettes.map((colors, i) => (i === index ? newPalette.colors : colors));
                                                    setMenuOptions({ ...menuOptions, palettes: nextPalettes });
                                                } else {
                                                    setMenuOptions({ ...menuOptions, colorPalette: newPalette });
                                                }
                                            }}
                                            disabled={!bspt}
                                        />
                                    </div>
                                ))}
                                <div className='flex justify-stretch gap-2 mb-2'>
                                    <button
                                        onClick={() => {
                                            const nextPalettes = palettes && palettes.length ? [...palettes, []] : [colorPalette.colors, []];
                                            setMenuOptions({ ...menuOptions, palettes: nextPalettes });
                                        }}
                                        className='bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1 flex-grow'
                                        title='add palette'
                                    >
                                    +
                                    </button>
                                </div>
                            </div>
                        </>}
                        {usePalette && usePaletteFilter && <>
                            <label className='flex flex-col'>
                                <span
                                    className="block text-sm font-medium leading-6"
                                >
                            palette count (M)
                                </span>
                                <input
                                    id="palette-count"
                                    type="number"
                                    min={1}
                                    max={maxK}
                                    value={paletteCount}
                                    onChange={(e) => {
                                        const next = parseInt(e.target.value);
                                        setMenuOptions({ ...menuOptions, paletteCount: Number.isNaN(next) ? 1 : Math.max(1, next) });
                                    }}
                                    className='bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2' />
                            </label>
                            <label className='flex flex-col'>
                                <span
                                    className="block text-sm font-medium leading-6"
                                >
                            colors per palette (N)
                                </span>
                                <input
                                    id="palette-size"
                                    type="number"
                                    min={1}
                                    max={256}
                                    value={paletteSize}
                                    onChange={(e) => {
                                        const next = parseInt(e.target.value);
                                        setMenuOptions({ ...menuOptions, paletteSize: Number.isNaN(next) ? 1 : Math.max(1, next) });
                                    }}
                                    className='bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2' />
                            </label>
                        </>}
                        <button
                            onClick={compress}
                            className="rounded-md bg-primary-300 disabled:bg-primary-400 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 mt-3 mb-1"
                            disabled={(!map)||((usePalette && !usePaletteFilter) && !bspt)||(Object.keys(tasks).length>0)}
                        >
                    compress
                        </button>
                        <button
                            onClick={compressAll}
                            className="rounded-md bg-primary-300 disabled:bg-primary-400 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 mt-1 mb-3"
                            disabled={(!map)||((usePalette && !usePaletteFilter) && !bspt)||(Object.keys(tasks).length>0)}
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
                        <label>
                            <span
                                className="block text-sm font-medium leading-6"
                            >
                        color filter mode
                            </span>
                            <select
                                className='bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2'
                                value={usePaletteFilter ? 'palette' : 'filter'}
                                onChange={e => {
                                    const nextUsePaletteFilter = e.target.value === 'palette';
                                    setMenuOptions({ ...menuOptions, usePaletteFilter: nextUsePaletteFilter, usePalette: true, selectedPalette: -1 });
                                }}
                            >
                                <option value='filter'>applyFilter (single palette)</option>
                                <option value='palette'>applyPaletteFilter (closest palette)</option>
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
                            <input
                                type="checkbox"
                                checked={useAdvancedChain}
                                onChange={(e) => {
                                    const next = e.target.checked;
                                    setUseAdvancedChain(next);
                                    if (next && !menuOptions.taskBlocks) {
                                        // Initialize with default blocks based on current settings
                                        setMenuOptions({
                                            ...menuOptions,
                                            taskBlocks: menuOptionsToBlocks(colorModel, tileModel, usePalette, usePaletteFilter)
                                        });
                                    }
                                }}
                                className='rounded-md border-0 mx-1.5 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset focus:ring-primary-300 sm:text-sm sm:leading-6 accent-primary-300'
                            />
                            <span className="text-sm font-medium">Advanced Chain Editor</span>
                        </label>
                        {useAdvancedChain && (
                            <>
                                <TaskChainEditor
                                    blocks={menuOptions.taskBlocks || []}
                                    onChange={(blocks) => setMenuOptions({ ...menuOptions, taskBlocks: blocks })}
                                />
                                <button
                                    onClick={() => {
                                        setMenuOptions({
                                            ...menuOptions,
                                            taskBlocks: menuOptionsToBlocks(colorModel, tileModel, usePalette, usePaletteFilter)
                                        });
                                    }}
                                    className="text-xs px-2 py-1 bg-primary-100 border border-primary-300 rounded mt-2"
                                >
                            Reset to Default Chain
                                </button>
                            </>
                        )}
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
                                disabled={!bspt}
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
            </Tabs>
            <div
                onMouseDown={() => setIsDragging(true)}
                className="absolute left-0 top-0 w-1 h-full bg-primary-200 hover:bg-primary-300 cursor-col-resize hover:shadow-lg transition-all"
                style={{ cursor: 'col-resize' }}
                title="Drag to resize menu"
            />
        </div>
    );
};
