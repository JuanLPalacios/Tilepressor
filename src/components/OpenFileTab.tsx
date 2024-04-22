import { GrImage } from 'react-icons/gr';

export const OpenFileTab = ({ fileSet }: { fileSet: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => {
    return <label className="h-[calc(100vh_-_6.5rem)] relative mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-primary-400/25 px-6 py-10">
        <input id="file" type="file" className="absolute opacity-0 top-0 h-full w-full" multiple onChange={fileSet} />
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
    </label>;
};
