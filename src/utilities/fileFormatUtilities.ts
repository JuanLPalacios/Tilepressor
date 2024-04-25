import { Dispatch } from 'react';
import { img2Tiles } from './tileUtilities';
import { FileAction } from '../contexts/FilesStates';
import { UUID } from './tasksUtilities';
import JSZip from 'jszip';
import { GBSProj } from '~/types/GBSProj';

export function openRaster(dispatchFilesAction: Dispatch<FileAction>, file: File, tileDimensions: number, urlData:string | ArrayBuffer | null) {
    const id = UUID();
    dispatchFilesAction({ type: 'file/open', payload: { id, chain: { id, changed: false, file, } } });
    const image = new Image();
    image.onload = () => {
        img2Tiles(urlData as string, tileDimensions).then(tiles => {
            dispatchFilesAction({ type: 'file/update', payload: { id, file: { tiles, image } } });
        });
    };
    image.src = urlData as string;
}
export function openGBStudioZIP(dispatchFilesAction: Dispatch<FileAction>, file: File, tileDimensions: number) {
    JSZip.loadAsync(file).then(function (zip) {
        openDir(zip, dispatchFilesAction, tileDimensions);
    });
}
function openDir(zip: JSZip, dispatchFilesAction: Dispatch<FileAction>, tileDimensions: number) {
    const filenames = Object.keys(zip.files);
    console.log(...filenames);
    zip.files[filenames.find(x=>x.endsWith('.gbsproj'))||''].async('string').then(JSON.parse)
        .then((project:GBSProj)=>{
            project.scenes.forEach(function (scene) {
                const fileName = `assets/backgrounds/${project.backgrounds.find(bg=>bg.id==scene.backgroundId)?.filename||''}`;
                const zipFile = zip.files[fileName];
                console.log(fileName);
                if (zipFile.dir){
                    openDir(zipFile as never, dispatchFilesAction, tileDimensions);
                }
                else{
                    console.log(fileName);
                    const file = new File([], fileName);
                    zipFile.async('arraybuffer')
                        .then(function(content) {
                            const buffer = new Uint8Array(content);
                            const blob = new Blob([buffer.buffer]);
                            const fileData = URL.createObjectURL(blob);
                            openFile(file, dispatchFilesAction, tileDimensions, fileData);
                        },
                        function(e) {
                            console.log('Error reading ' + file.name + ' : ' + e.message);
                        });
                }
            });
        });
}

export function openFile(file: File, dispatchFilesAction: Dispatch<FileAction>, tileDimensions: number, urlData?:string | ArrayBuffer | null) {
    if(urlData==undefined){
        const fr = new FileReader();
        fr.onload = () => {
            openFile(file, dispatchFilesAction, tileDimensions, fr.result);
        };
        fr.readAsDataURL(file);
        return;
    }
    //console.log(urlData);
    const extension = file.name.split('.').pop()
        ?.toLowerCase();
    switch (extension) {
    case 'zip':
        openGBStudioZIP(dispatchFilesAction, file, tileDimensions);
        break;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'bmp':
    case 'webp':
        openRaster(dispatchFilesAction, file, tileDimensions, urlData);
        break;
    default:
        break;
    }
}

