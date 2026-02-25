import { useState, useContext, useEffect } from 'react';
import { GrClose, GrAdd, GrSave, GrEdit, GrTrash } from 'react-icons/gr';
import { ColorPalette } from '../contexts/MenuOptions';
import { Color } from '../types/Color';
import { ConfigOptionsContext } from '../contexts/ConfigOptions';

interface PaletteProps {
    colorPalette: ColorPalette;
    setColorPalette: (colorPalette: ColorPalette) => void;
    disabled?: boolean;
    maxPaletteColors?: number;
}

export const Palette = ({
    colorPalette,
    setColorPalette,
    disabled = false,
    maxPaletteColors = 255
}: PaletteProps) => {
    const [isEditingPalette, setIsEditingPalette] = useState<boolean>(false);
    const [ConfigOptions, setConfigOptions] = useContext(ConfigOptionsContext);
    const { savedPalettes } = ConfigOptions;
    const [selectedPalette, setSelectedPalette] = useState<number>(-1);

    useEffect(() => {
        if (selectedPalette >= savedPalettes.length) {
            setSelectedPalette(-1);
        }
    }, [savedPalettes.length, selectedPalette]);

    const savePalette = () => {
        const name = prompt('Palette name:') || 'new palette';
        setConfigOptions({ ...ConfigOptions, savedPalettes: [...savedPalettes, { ...colorPalette, name }] });
        setSelectedPalette(savedPalettes.length);
        setIsEditingPalette(false);
    };

    const editPalette = () => {
        setIsEditingPalette(true);
        setColorPalette({ ...colorPalette });
    };

    return (
        <>
            <label>
                <span className="block text-sm font-medium leading-6">palette</span>
                <select
                    className="bg-primary-50 rounded-md border-0 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-inset sm:text-sm disabled:text-primary-200 px-2"
                    value={selectedPalette}
                    onChange={(e) => {
                        const next = parseInt(e.target.value);
                        setSelectedPalette(next);
                        if (next >= 0) {
                            const nextPalette = savedPalettes[next];
                            if (nextPalette) setColorPalette({ ...nextPalette });
                        }
                    }}
                    disabled={isEditingPalette}
                >
                    <option value={-1}>current colors</option>
                    {savedPalettes.map((palette, i) => (
                        <option key={`palette-${i}`} value={i}>
                            {palette.name}
                        </option>
                    ))}
                </select>
            </label>
            <div className="flex">
                <label className="flex-1">Palette</label>
                <button
                    onClick={() =>
                        setConfigOptions({ ...ConfigOptions, savedPalettes: savedPalettes.filter((_, i) => i !== selectedPalette) })
                    }
                    className="bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1"
                    title="delete palette"
                    disabled={selectedPalette === -1}
                >
                    <GrTrash />
                </button>
                <button
                    onMouseUp={savePalette}
                    className="bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1"
                    title="save palette"
                    disabled={disabled}
                >
                    <GrSave />
                </button>
                {isEditingPalette ? (
                    <button
                        onMouseUp={() => setIsEditingPalette(false)}
                        className="bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1"
                        title="close"
                        disabled={disabled}
                    >
                        <GrClose />
                    </button>
                ) : (
                    <button
                        onMouseUp={editPalette}
                        className="bg-primary-50 disabled:text-primary-200 border-2 border-primary-200 p-1"
                        title="import palette"
                    >
                        <GrEdit />
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-auto">
                <div
                    className={`flex flex-wrap ${
                        isEditingPalette && 'gap-2 p-1'
                    }`}
                >
                    {colorPalette.colors.map((color: Color, i: number) => (
                        <div
                            key={`color-${i}`}
                            className={`flex relative group ${
                                isEditingPalette ? 'w-4 h-4' : 'w-6 h-6'
                            }`}
                            style={{
                                backgroundImage:
                                    'linear-gradient(to right, black 50%, white 50%), linear-gradient(to bottom, black 50%, white 50%)',
                                backgroundSize: '8px 8px',
                                backgroundBlendMode: 'difference, normal'
                            }}
                        >
                            {isEditingPalette && (
                                <button
                                    onClick={() =>
                                        setColorPalette({
                                            ...colorPalette,
                                            colors: colorPalette.colors.filter(
                                                (_: Color, j: number) => i !== j
                                            )
                                        })
                                    }
                                    className="absolute bg-primary-100 bg-primary-50 w-4 h-4 top-[-10px] right-[-10px] z-10 invisible group-hover:visible flex star border-2 border-primary-200 justify-center"
                                >
                                    <GrClose />
                                </button>
                            )}
                            <div
                                className="absolute w-full h-full"
                                style={{
                                    height: '100%',
                                    background: `rgb(${color
                                        .slice(0, 3)
                                        .toString()})`,
                                    opacity: color[3] / 255
                                }}
                            ></div>
                            <input
                                type="color"
                                value={`#${color
                                    .slice(0, 3)
                                    .map((x: number) => `0${x.toString(16)}`.slice(-2))
                                    .join('')}`}
                                onChange={(e) =>
                                    setColorPalette({
                                        ...colorPalette,
                                        colors: colorPalette.colors.map(
                                            (x: Color, j: number) =>
                                                i === j
                                                    ? ([
                                                        ...(e.target.value
                                                            .match(
                                                                /[a-f0-9]{2}/gi
                                                            )
                                                            ?.map((v: string) =>
                                                                parseInt(v, 16)
                                                            ) || []),
                                                        255
                                                    ] as Color)
                                                    : x
                                        )
                                    })
                                }
                                className="opacity-0"
                                disabled={!isEditingPalette}
                            />
                        </div>
                    ))}
                    {isEditingPalette && (
                        <button
                            onClick={() => {
                                setColorPalette({
                                    ...colorPalette,
                                    colors: [...colorPalette.colors, [0, 0, 0, 255]]
                                });
                            }}
                            disabled={colorPalette.colors.length >= maxPaletteColors}
                            className="bg-primary-50 disabled:text-primary-200 flex relative w-6 h-6 border-2 border-primary-200 text-center justify-center"
                        >
                            <GrAdd />
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};
