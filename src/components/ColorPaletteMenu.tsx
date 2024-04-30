import { ColorPalette } from '../contexts/MenuOptions';
import { GrClose, GrAdd } from 'react-icons/gr';

export const ColorPaletteMenu = ({ colorPalette, onChangeColorPalette, isEditingPalette }: { colorPalette: ColorPalette; onChangeColorPalette: (colorPalette: ColorPalette) => void; isEditingPalette:boolean }) => {
    return <div className='flex-1 flex flex-col'>
        <div className='flex-1 overflow-auto min-h-6 h-[calc(100vh-35rem)]'>
            <div className={`flex flex-wrap ${isEditingPalette && 'gap-2 p-1'}`}>
                {colorPalette.colors.map((color, i) => <div
                    key={`color-${i}`}
                    className={`flex relative group ${isEditingPalette ? 'w-4 h-4' : 'w-6 h-6'}`}
                    style={{ backgroundImage: 'linear-gradient(to right, black 50%, white 50%), linear-gradient(to bottom, black 50%, white 50%)', backgroundSize: '8px 8px', backgroundBlendMode: 'difference, normal' }}
                >
                    {isEditingPalette && <button
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        onClick={() => onChangeColorPalette({ ...colorPalette, colors: colorPalette.colors.filter((x, j) => i != j) })}
                        className='absolute bg-primary-100 bg-primary-50 w-4 h-4 top-[-10px] right-[-10px] z-10 invisible group-hover:visible flex star border-2 border-primary-200 justify-center'
                    ><GrClose /></button>}
                    <div className='absolute w-full h-full' style={{ height: '100%', background: `rgb(${color.slice(0, 3).toString()})`, opacity: color[3] / 255 }}></div>
                    <input
                        type="color"
                        value={`#${color
                            .slice(0, 3)
                            .map(x => `0${x.toString(16)}`.slice(-2))
                            .join('')}`}
                        onChange={(e) => onChangeColorPalette({ ...colorPalette, colors: colorPalette.colors.map((x, j) => (i == j) ? [...e.target.value.match(/[a-f0-9]{2}/gi)?.map((v) => parseInt(v, 16)) || [], 255] as never : x) })}
                        className='opacity-0'
                        disabled={!isEditingPalette} />
                </div>)}
                {isEditingPalette && <button
                    onClick={() => { onChangeColorPalette({ ...colorPalette, colors: [...colorPalette.colors, [0, 0, 0, 255]] }); }}
                    disabled={(colorPalette.colors.length >= 255)}
                    className='bg-primary-50 disabled:text-primary-200 flex relative w-6 h-6 border-2 border-primary-200 text-center justify-center'
                ><GrAdd /></button>}
            </div>
        </div>
    </div>;
};
