import { useContext, useEffect, useRef, useState } from 'react';
import { Tab } from './Tab';
import { Tabs } from './Tabs';
import { GrDownload, GrGrid } from 'react-icons/gr';
import { saveAs } from 'file-saver';
import { MapState } from '../contexts/FilesStates';
import { MenuOptionsContext } from '../contexts/MenuOptions';
import { MapFeedbackContext } from '../contexts/MapFeedback';
import { renderCompressed, renderOriginal, renderTileSet } from '../utilities/renderViews';
import { SizeContext } from '../contexts/Size';
import { ConfigOptionsContext } from '../contexts/ConfigOptions';

enum ActiveTab {
    original = 'Original',
    compressed = 'Compressed',
    tileSet = 'TileSet',
}

export const MapView = (props:{
    label:string|React.ReactNode,
    map:MapState
    children?: React.ReactNode
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const endRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const tileRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const { map, label } = props;
    const { tiles, newTiles, file, image } = map;
    const useMenuOptions = useContext(MenuOptionsContext);
    const useConfigOptions = useContext(ConfigOptionsContext);
    const useMapFeedback = useContext(MapFeedbackContext);
    const { height, width } = useContext(SizeContext);
    const [menuOptions] = useMenuOptions;
    const [ConfigOptions, setConfigOptions] = useConfigOptions;
    const [, setMapFeedback] = useMapFeedback;
    const { tileDimensions } = menuOptions;
    const { useGrid } = ConfigOptions;
    const [activeTab, setActiveTab] = useState<number>(0);
    const grid = {
        width: `${canvasRef.current?.width||0}px`,
        height: `${canvasRef.current?.height||0}px`,
        backgroundSize: `${tileDimensions}px ${tileDimensions}px`,
        backgroundImage: `
        linear-gradient(to right, grey 1px, transparent 1px),
        linear-gradient(to bottom, grey 1px, transparent 1px)`,
        position: 'absolute' as never,
    };
    const tileSetGrid = {
        width: `${tileRef.current?.width||0}px`,
        height: `${tileRef.current?.height||0}px`,
        backgroundSize: `${tileDimensions}px ${tileDimensions}px`,
        backgroundImage: `
        linear-gradient(to right, grey 1px, transparent 1px),
        linear-gradient(to bottom, grey 1px, transparent 1px)`,
        position: 'absolute' as never,
    };
    useEffect(() => {
        setMapFeedback({ maxK: tiles?.length||1, map });
    }, [tiles?.length, map]);
    useEffect(() => {
        if (image && canvasRef.current) {
            renderOriginal(canvasRef.current, image);
        }
    }, [image, canvasRef.current]);
    useEffect(() => {
        if (image && endRef.current&&newTiles) {
            renderCompressed(endRef.current, image, newTiles, tileDimensions);
        }
    }, [newTiles, endRef.current]);
    useEffect(() => {
        if (tiles && tileRef.current && newTiles) {
            renderTileSet(tileRef.current, newTiles, tileDimensions);
        }
    }, [newTiles, tileRef.current]);
    useEffect(()=>{
        if(newTiles)
            setActiveTab(1);
    }, [newTiles]);
    const download = async ()=>{
        switch (activeTab) {
        case 0:
            saveAs(await new Promise<Blob>(resolve => canvasRef.current?.toBlob(blob=>{ if(blob)resolve(blob); })), file.name);
            break;
        case 1:
            saveAs(await new Promise<Blob>(resolve => endRef.current?.toBlob(blob=>{ if(blob)resolve(blob); })), file.name);
            break;
        case 2:
            saveAs(await new Promise<Blob>(resolve => tileRef.current?.toBlob(blob=>{ if(blob)resolve(blob); })), file.name);
            break;

        default:
            break;
        }
    };
    const refF = (ref:HTMLDivElement)=>{
        if(canvasRef.current && ref){
            ref?.appendChild(canvasRef.current);
        }
    };
    const refR = (ref:HTMLDivElement)=>{
        if(endRef.current && ref){
            ref?.appendChild(endRef.current);
        }
    };
    const ref = (ref:HTMLDivElement)=>{
        if(tileRef.current && ref){
            ref?.appendChild(tileRef.current);
        }
    };
    return (
        <Tab label={label}>
            <div>
                <div
                    className='relative'
                >
                    <div
                        className='absolute z-10 top-12 right-7 p-2 flex gap-2 opacity-10 hover:opacity-100'
                    >
                        <button
                            title='download'
                            className='bg-primary-200 p-2 rounded-md'
                            onClick={download}
                        ><GrDownload /></button>
                        <button
                            title='toggle grid'
                            className='bg-primary-200 p-2 rounded-md'
                            onClick={()=>setConfigOptions({ ...ConfigOptions, useGrid: !useGrid })}
                        ><GrGrid className={''+((!useGrid)&&'opacity-20')} /></button>
                    </div>
                    <Tabs active={activeTab} onActiveChange={e=>setActiveTab(e.active)} width={width} height={height}>
                        <Tab label={ActiveTab.original}>
                            <div ref={refF} style={{ width: `${width-32}px`, height: `${height-74}px` }} className={`overflow-auto relative ${((canvasRef.current.parentElement?.scrollWidth||0)>canvasRef.current.offsetWidth)&&((canvasRef.current.parentElement?.scrollHeight||0)>canvasRef.current.offsetHeight)?' flex items-center justify-center':''}`}>
                                {useGrid&&<div style={grid}></div>}

                            </div>
                        </Tab>
                        <Tab label={ActiveTab.compressed} disabled={newTiles==undefined}>
                            <div ref={refR} style={{ width: `${width-32}px`, height: `${height-74}px` }} className={`overflow-auto relative ${((canvasRef.current.parentElement?.scrollWidth||0)>canvasRef.current.offsetWidth)&&((canvasRef.current.parentElement?.scrollHeight||0)>canvasRef.current.offsetHeight)?' flex items-center justify-center':''}`}>
                                {useGrid&&<div style={grid}></div>}

                            </div>
                        </Tab>
                        <Tab label={ActiveTab.tileSet} disabled={newTiles==undefined}>
                            <div ref={ref} style={{ width: `${width-32}px`, height: `${height-74}px` }} className={`overflow-auto relative ${((canvasRef.current.parentElement?.scrollWidth||0)>canvasRef.current.offsetWidth)&&((canvasRef.current.parentElement?.scrollHeight||0)>canvasRef.current.offsetHeight)?' flex items-center justify-center':''}`}>
                                {useGrid&&<div style={tileSetGrid}></div>}

                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </Tab>
    );
};

