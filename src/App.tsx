import { Tabs } from './components/Tabs';
import { GrAdd, GrImage } from 'react-icons/gr';
import { useContext, useState } from 'react';
import { Tab } from './components/Tab';
import { img2Tiles } from './utilities/tileUtilities';
import { Menu } from './components/Menu';
import { MapView } from './components/MapView';
import { FilesContext, MapState } from './contexts/FilesStates';
import { MenuOptionsContext } from './contexts/MenuOptions';
import { SizeContext } from './contexts/Size';
import { UUID } from './utilities/tasksUtilities';
import { MapLabel } from './components/MapLable';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const App = () => {
    useRegisterSW({
        onRegistered: (r)=>{
            r &&
            setInterval(() => {
                r.update();
            }, 3600000);
        },
    });
    const [{ tileDimensions }] = useContext(MenuOptionsContext);
    const [maps, dispatchFilesAction] = useContext(FilesContext);
    const { height, width } = useContext(SizeContext);
    const [activeTab, setActiveTab] = useState<number>(0);
    const fileSet = (e:React.ChangeEvent<HTMLInputElement>) => {
        const filePicker = e.target;
        if(!filePicker.files)return;
        for (let i = 0; i < filePicker.files.length; i++) {
            const file = filePicker.files[i];
            const id = UUID();
            dispatchFilesAction({ type: 'file/open', payload: { id, chain: { id, changed: false, file, } } });
            setActiveTab(maps.length);
            const fr = new FileReader();
            fr.onload = () =>{
                const image = new Image();
                image.onload = () => {
                    img2Tiles(fr.result as string, tileDimensions).then(tiles=>{
                        dispatchFilesAction({ type: 'file/update', payload: { id, file: { tiles, image } } });
                    });
                };
                image.src = fr.result as string;
            };
            fr.readAsDataURL(file);
        }
    };
    const closeMap = ({ id }: MapState) => {
        dispatchFilesAction({ type: 'file/close', payload: id });
    };
    return (
        <div className="bg-primary-100 text-primary-400 flex overflow-hidden">
            <div>
                <Tabs active={activeTab} onActiveChange={_e=>setActiveTab(activeTab)} width={width -240} height={height}>
                    {maps.map((map)=>(<MapView
                        map={map}
                        key={`map-${map.id}`}
                        label={<MapLabel map={map} onCloseMap={closeMap}/>}
                    >
                    </MapView>))}
                    <Tab
                        label={<label className="relative flex flex-col items-center justify-center rounded-lg">
                            <input  id="tab file" type="file" className="absolute opacity-0 top-0 h-[3.5rem] w-full mt-[-2rem]" multiple onClick={e=>e.stopPropagation()} onChange={fileSet } />
                            <GrAdd />
                        </label>}
                        tip='open file'
                    >
                        <label className="h-[calc(100vh_-_6.5rem)] relative mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-primary-400/25 px-6 py-10">
                            <input  id="file" type="file" className="absolute opacity-0 top-0 h-full w-full" multiple onChange={fileSet } />
                            <GrImage className=' text-primary-300 w-20 h-20' />
                            <div className="text-center">
                                <div className="mt-4 flex ">
                                    <div
                                        className="relative cursor-pointer rounded-md bg-primary-100 font-semibold text-primary-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-300 focus-within:ring-offset-2"
                                    >
                                        <span> Click to open a file</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm leading-6 pl-1">or drag and drop</p>
                            <p className="text-xs leading-5">(PNG, JPG)</p>
                        </label>
                    </Tab>
                </Tabs>
            </div>
            <div className=''>
                <Menu width={240} height={height} />
            </div>
        </div>
    );
};