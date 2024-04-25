import { Tabs } from './components/Tabs';
import { useContext, useState } from 'react';
import { Tab } from './components/Tab';
import { Menu } from './components/Menu';
import { MapView } from './components/MapView';
import { FilesContext, MapState } from './contexts/FilesStates';
import { MenuOptionsContext } from './contexts/MenuOptions';
import { SizeContext } from './contexts/Size';
import { MapLabel } from './components/MapLabel';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { OpenFileTab } from './components/OpenFileTab';
import { OpenFileTabLabel } from './components/OpenFileTabLabel';
import { openFile } from './utilities/fileFormatUtilities';

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
    const { height, width } = useContext(SizeContext);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [maps, dispatchFilesAction] = useContext(FilesContext);
    const closeMap = ({ id }: MapState) => {
        dispatchFilesAction({ type: 'file/close', payload: id });
    };
    const fileSet = (e:React.ChangeEvent<HTMLInputElement>) => {
        const filePicker = e.target;
        if(!filePicker.files)return;
        setActiveTab(maps.length);
        for (let i = 0; i < filePicker.files.length; i++) {
            const file = filePicker.files[i];
            openFile(file, dispatchFilesAction, tileDimensions);
        }
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
                        label={<OpenFileTabLabel fileSet={fileSet}/>}
                        tip='open file'
                    >
                        {<OpenFileTab fileSet={fileSet}/>}
                    </Tab>
                </Tabs>
            </div>
            <div className=''>
                <Menu width={240} height={height} />
            </div>
        </div>
    );
};

