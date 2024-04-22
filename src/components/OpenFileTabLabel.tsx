import { GrAdd } from 'react-icons/gr';

export const OpenFileTabLabel = ({ fileSet }: { fileSet: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => {
    return <label className="relative flex flex-col items-center justify-center rounded-lg">
        <input id="tab file" type="file" className="absolute opacity-0 top-0 h-[3.5rem] w-full mt-[-2rem]" multiple onClick={e => e.stopPropagation()} onChange={fileSet} />
        <GrAdd />
    </label>;
};
