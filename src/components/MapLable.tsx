import { GrClose, GrArchive, GrDisc } from 'react-icons/gr';
import { MouseEvent } from 'react';
import { MapState } from '../contexts/FilesStates';

export const MapLabel = ({ map, onCloseMap }: { map: MapState; onCloseMap: (map: MapState) => void; }) => {
    const { changed, newTiles } = map;
    const closeMap = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
        e.stopPropagation();
        onCloseMap(map);
    };
    return <div
        className='relative pr-6 truncate max-w-40'
    >
        <div
            className='absolute right-0 top-0 p-1 rounded hover:bg-primary-200'
            onClick={e => closeMap(e)}
        >
            <div
                className='relative group'
            >
                <div
                    className='absolute opacity-0 group-hover:opacity-100 bg-primary-200'
                >
                    <GrClose />
                </div>
                <div
                    className={changed?'':'opacity-0'}
                >
                    {newTiles?<GrArchive />:<GrDisc />}

                </div>
            </div>
        </div>
        {map.file.name}
    </div>;
};
