import { TaskTypes } from '../enums/TaskType';
import { ColorModel } from '../enums/ColorModel';
import { TileModel } from '../enums/TileModel';
import { GrAdd, GrTrash, GrDrag } from 'react-icons/gr';
import { Palette } from './Palette';
import { Color } from '../types/Color';

export type BlockType =
    | 'compress'
    | 'colorLab'
    | 'cdt'
    | 'filter'
    | 'custom';

export interface TaskBlock {
    id: string;
    type: BlockType;
    label?: string;
    children?: TaskBlock[];
    taskType?: TaskTypes;
    enabled?: boolean;
    params?: Record<string, unknown>;
}

interface TaskChainEditorProps {
    blocks: TaskBlock[];
    onChange: (blocks: TaskBlock[]) => void;
    colorModel: ColorModel;
    tileModel: TileModel;
    usePalette: boolean;
    usePaletteFilter: boolean;
}

export const TaskChainEditor = ({
    blocks,
    onChange,
    colorModel,
    tileModel,
    usePalette,
    usePaletteFilter
}: TaskChainEditorProps) => {
    const generateId = () => `block_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;

    const addBlock = (type: BlockType, parentPath?: number[]) => {
        const newBlock: TaskBlock = {
            id: generateId(),
            type,
            label: getDefaultLabel(type),
            enabled: true,
            children: type === 'custom' ? undefined : []
        };

        if (parentPath) {
            const updated = [...blocks];
            const parent = getBlockByPath(updated, parentPath);
            if (parent && parent.children) {
                parent.children.push(newBlock);
            }
            onChange(updated);
        } else {
            onChange([...blocks, newBlock]);
        }
    };

    const removeBlock = (path: number[]) => {
        const updated = [...blocks];
        if (path.length === 1) {
            updated.splice(path[0], 1);
        } else {
            const parentPath = path.slice(0, -1);
            const parent = getBlockByPath(updated, parentPath);
            if (parent && parent.children) {
                parent.children.splice(path[path.length - 1], 1);
            }
        }
        onChange(updated);
    };

    const toggleBlock = (path: number[]) => {
        const updated = [...blocks];
        const block = getBlockByPath(updated, path);
        if (block) {
            block.enabled = !block.enabled;
        }
        onChange(updated);
    };

    const updateBlockLabel = (path: number[], label: string) => {
        const updated = [...blocks];
        const block = getBlockByPath(updated, path);
        if (block) {
            block.label = label;
        }
        onChange(updated);
    };

    const updateBlockTaskType = (path: number[], taskType: TaskTypes) => {
        const updated = [...blocks];
        const block = getBlockByPath(updated, path);
        if (block) {
            block.taskType = taskType;
        }
        onChange(updated);
    };

    const updateBlockParam = (path: number[], paramName: string, paramValue: unknown) => {
        const updated = [...blocks];
        const block = getBlockByPath(updated, path);
        if (block) {
            block.params = { ...block.params, [paramName]: paramValue };
        }
        onChange(updated);
    };

    const renderBlockParameters = (block: TaskBlock, path: number[]) => {
        const params = block.params || {};

        switch (block.type) {
        case 'filter': {
            const filterUsePalette = (params.usePalette as boolean) ?? usePalette;
            const filterUseClusteredPalettes = (params.useClusteredPalettes as boolean) ?? usePaletteFilter;
            const filterPalettes = (params.palettes as Color[][] | undefined);
            const filterPaletteCount = (params.paletteCount as number) ?? 2;
            const filterPaletteSize = (params.paletteSize as number) ?? 16;

            return (
                <div className="mt-2">
                    <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                        <label className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={filterUsePalette}
                                onChange={(e) => updateBlockParam(path, 'usePalette', e.target.checked)}
                                className="w-3 h-3"
                            />
                            Use Palette
                        </label>
                        <label className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={filterUseClusteredPalettes}
                                onChange={(e) => updateBlockParam(path, 'useClusteredPalettes', e.target.checked)}
                                className="w-3 h-3"
                            />
                            Clustered
                        </label>
                        <select
                            value={(params.filterTask as number) ?? TaskTypes.applyFilter}
                            onChange={(e) => updateBlockParam(path, 'filterTask', parseInt(e.target.value))}
                            className="text-xs px-1 py-0.5 border border-gray-300 rounded"
                        >
                            <option value={TaskTypes.applyFilter}>applyFilter</option>
                            <option value={TaskTypes.applyPaletteFilter}>applyPaletteFilter</option>
                        </select>
                    </div>

                    {filterUsePalette && filterUseClusteredPalettes && (
                        <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                            <label className="flex flex-col">
                                <span className="font-medium mb-1">Palette count (M)</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={256}
                                    value={filterPaletteCount}
                                    onChange={(e) => {
                                        const next = parseInt(e.target.value);
                                        updateBlockParam(path, 'paletteCount', Number.isNaN(next) ? 1 : Math.max(1, next));
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="font-medium mb-1">Colors per palette (N)</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={256}
                                    value={filterPaletteSize}
                                    onChange={(e) => {
                                        const next = parseInt(e.target.value);
                                        updateBlockParam(path, 'paletteSize', Number.isNaN(next) ? 1 : Math.max(1, next));
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded"
                                />
                            </label>
                        </div>
                    )}

                    {filterUsePalette && !filterUseClusteredPalettes && (
                        <div className="mt-2 border-t border-gray-200 pt-2">
                            <div className="text-xs font-medium mb-2">Palettes:</div>
                            <div className="flex flex-col gap-2">
                                {(filterPalettes && filterPalettes.length ? filterPalettes : [[]]).map((paletteColors, index) => (
                                    <div key={`palette-${index}`} className="relative">
                                        {filterPalettes && filterPalettes.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    const nextPalettes = filterPalettes.filter((_, i) => i !== index);
                                                    updateBlockParam(path, 'palettes', nextPalettes);
                                                }}
                                                className="absolute top-0 right-0 bg-gray-50 border border-gray-300 p-[0.1rem] leading-[0.9rem] text-xs z-10"
                                                title="remove palette"
                                            >
                                                -
                                            </button>
                                        )}
                                        <Palette
                                            colorPalette={{ colors: paletteColors }}
                                            setColorPalette={(newPalette) => {
                                                const palettes = filterPalettes && filterPalettes.length ? filterPalettes : [[]];
                                                const nextPalettes = palettes.map((colors, i) => (i === index ? newPalette.colors : colors));
                                                updateBlockParam(path, 'palettes', nextPalettes);
                                            }}
                                            disabled={false}
                                        />
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const palettes = filterPalettes && filterPalettes.length ? filterPalettes : [[]];
                                        const nextPalettes = [...palettes, []];
                                        updateBlockParam(path, 'palettes', nextPalettes);
                                    }}
                                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50 text-xs"
                                    title="add palette"
                                >
                                    + Add Palette
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        case 'colorLab':
            return (
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    <select
                        value={(params.colorModel as number) ?? colorModel}
                        onChange={(e) => updateBlockParam(path, 'colorModel', parseInt(e.target.value))}
                        className="text-xs px-1 py-0.5 border border-gray-300 rounded"
                    >
                        {Object.keys(ColorModel)
                            .filter(key => !isNaN(Number(key)))
                            .map((key) => (
                                <option key={key} value={key}>
                                    {ColorModel[parseInt(key)]}
                                </option>
                            ))}
                    </select>
                    <label className="flex items-center gap-1">
                        <input
                            type="checkbox"
                            checked={(params.usePixelData as boolean) ?? false}
                            onChange={(e) => updateBlockParam(path, 'usePixelData', e.target.checked)}
                            className="w-3 h-3"
                        />
                        Pixel Data
                    </label>
                </div>
            );

        case 'cdt':
            return (
                <div className="mt-2 text-xs">
                    <div className="grid grid-cols-2 gap-1 mb-2">
                        <select
                            value={(params.tileModel as number) ?? tileModel}
                            onChange={(e) => updateBlockParam(path, 'tileModel', parseInt(e.target.value))}
                            className="text-xs px-1 py-0.5 border border-gray-300 rounded"
                        >
                            {Object.keys(TileModel)
                                .filter(key => !isNaN(Number(key)))
                                .map((key) => (
                                    <option key={key} value={key}>
                                        {TileModel[parseInt(key)]}
                                    </option>
                                ))}
                        </select>
                        <label className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={(params.usePixelData as boolean) ?? false}
                                onChange={(e) => updateBlockParam(path, 'usePixelData', e.target.checked)}
                                className="w-3 h-3"
                            />
                            Pixel Data
                        </label>
                    </div>
                    <label className="flex items-center gap-1">
                        <input
                            type="checkbox"
                            checked={(params.allowXYFlipping as boolean) ?? false}
                            onChange={(e) => updateBlockParam(path, 'allowXYFlipping', e.target.checked)}
                            className="w-3 h-3"
                        />
                        Allow XY Flipping
                    </label>
                </div>
            );

        case 'compress': {
            const compressK = (params.k as number) ?? 32;
            const maxK = (params.maxK as number) ?? 256;

            return (
                <div className="mt-2 text-xs">
                    <label>
                        <div className="font-medium">target tile count</div>
                        <div className="font-medium">
                            (<span>{Math.min(compressK, maxK)}</span> / <span>{maxK}</span>)
                        </div>
                        <div className="flex">
                            <input
                                type="range"
                                value={Math.min(compressK, maxK)}
                                min={1}
                                max={maxK}
                                onChange={(e) => updateBlockParam(path, 'k', parseInt(e.target.value))}
                                className="w-full accent-gray-400"
                            />
                        </div>
                    </label>
                    <label className="flex items-center gap-1 mt-2">
                        <input
                            type="checkbox"
                            checked={(params.useClusteredPalettes as boolean) ?? false}
                            onChange={(e) => updateBlockParam(path, 'useClusteredPalettes', e.target.checked)}
                            className="w-3 h-3"
                        />
                        Clustered Palettes
                    </label>
                </div>
            );
        }

        default:
            return null;
        }
    };

    const getBlockByPath = (blocks: TaskBlock[], path: number[]): TaskBlock | null => {
        let current: TaskBlock[] = blocks;
        let block: TaskBlock | null = null;

        for (let i = 0; i < path.length; i++) {
            block = current[path[i]];
            if (!block) return null;
            if (i < path.length - 1 && block.children) {
                current = block.children;
            }
        }

        return block;
    };

    const getDefaultLabel = (type: BlockType): string => {
        switch (type) {
        case 'compress':
            return 'Compress';
        case 'colorLab':
            return 'Color Transform';
        case 'cdt':
            return 'DCT Transform';
        case 'filter':
            return 'Filter';
        case 'custom':
            return 'Custom Task';
        default:
            return 'Block';
        }
    };

    const getBlockColor = (type: BlockType): string => {
        switch (type) {
        case 'compress':
            return 'bg-blue-100 border-blue-300';
        case 'colorLab':
            return 'bg-purple-100 border-purple-300';
        case 'cdt':
            return 'bg-green-100 border-green-300';
        case 'filter':
            return 'bg-yellow-100 border-yellow-300';
        case 'custom':
            return 'bg-gray-100 border-gray-300';
        default:
            return 'bg-white border-gray-300';
        }
    };

    const renderBlock = (block: TaskBlock, path: number[], depth: number = 0) => {
        const indent = depth * 16;
        const hasChildren = block.children && block.children.length > 0;
        const canHaveChildren = block.type !== 'custom';

        return (
            <div
                key={block.id}
                className='mb-2'
                style={{ marginLeft: `${indent}px` }}
            >
                <div
                    className={`p-2 rounded border-2 ${getBlockColor(block.type)} ${!block.enabled ? 'opacity-50' : ''} relative`}
                >
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toggleBlock(path)}
                            className="text-xs font-mono w-4 h-4 flex items-center justify-center border border-gray-400 rounded"
                        >
                            {block.enabled ? '✓' : '✗'}
                        </button>

                        <GrDrag className="cursor-move text-gray-400" />

                        <select
                            value={block.type}
                            onChange={(e) => {
                                const updated = [...blocks];
                                const b = getBlockByPath(updated, path);
                                if (b) {
                                    b.type = e.target.value as BlockType;
                                    if (b.type === 'custom') {
                                        b.children = undefined;
                                    } else if (!b.children) {
                                        b.children = [];
                                    }
                                }
                                onChange(updated);
                            }}
                            className="text-xs px-1 py-0.5 border border-gray-300 rounded"
                        >
                            <option value="compress">Compress</option>
                            <option value="colorLab">Color Transform</option>
                            <option value="cdt">DCT Transform</option>
                            <option value="filter">Filter</option>
                            <option value="custom">Custom Task</option>
                        </select>

                        <input
                            type="text"
                            value={block.label || ''}
                            onChange={(e) => updateBlockLabel(path, e.target.value)}
                            className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded"
                            placeholder="Label"
                        />

                        {block.type === 'custom' && (
                            <select
                                value={block.taskType ?? ''}
                                onChange={(e) => updateBlockTaskType(path, parseInt(e.target.value) as TaskTypes)}
                                className="text-xs px-1 py-0.5 border border-gray-300 rounded"
                            >
                                <option value="">Select Task</option>
                                {Object.keys(TaskTypes)
                                    .filter(key => !isNaN(Number(key)))
                                    .map((key) => (
                                        <option key={key} value={key}>
                                            {TaskTypes[parseInt(key)]}
                                        </option>
                                    ))}
                            </select>
                        )}

                        <button
                            onClick={() => removeBlock(path)}
                            className="p-1 border border-red-400 rounded hover:bg-red-100"
                            title="Remove block"
                        >
                            <GrTrash />
                        </button>
                    </div>

                    {renderBlockParameters(block, path)}

                    {block.type === 'compress' && (
                        <div className="mt-2 text-xs text-gray-600">
                            → kMeansPlusPlus {usePaletteFilter && '→ clusterPalettes'}
                        </div>
                    )}

                    {block.type === 'colorLab' && colorModel !== ColorModel.RGB && <>
                        <div className="mt-2 text-xs text-gray-600">
                            → rgb2lab
                        </div>
                        {hasChildren && (
                            <div className="mt-1">
                                {block.children!.map((child, index) =>
                                    renderBlock(child, [...path, index], depth + 1)
                                )}
                            </div>
                        )}
                        {canHaveChildren && (
                            <button
                                onClick={() => addBlock('custom', path)}
                                className="w-full mt-3 p-3 border-2 border-dashed border-gray-400 rounded hover:bg-gray-100 hover:border-gray-500 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 transition-colors"
                                title="Add child block"
                                style={{ marginLeft: `${indent+16}px` }}
                            >
                                <GrAdd /> Add Child Block
                            </button>
                        )}
                        <div className="mt-2 text-xs text-gray-600">
                            → lab2rgb
                        </div>
                    </>}

                    {block.type === 'cdt' && tileModel !== TileModel.Raster && <>
                        <div className="mt-2 text-xs text-gray-600">
                            → pixels2dct
                        </div>
                        {hasChildren && (
                            <div className="mt-1">
                                {block.children!.map((child, index) =>
                                    renderBlock(child, [...path, index], depth + 1)
                                )}
                            </div>
                        )}
                        {canHaveChildren && (
                            <button
                                onClick={() => addBlock('custom', path)}
                                className="w-full mt-3 p-3 border-2 border-dashed border-gray-400 rounded hover:bg-gray-100 hover:border-gray-500 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 transition-colors"
                                title="Add child block"
                                style={{ marginLeft: `${indent+16}px` }}
                            >
                                <GrAdd /> Add Child Block
                            </button>
                        )}
                        <div className="mt-2 text-xs text-gray-600">
                            → cdt2pixels
                        </div>
                    </>}

                    {block.type === 'filter' && (
                        <div className="mt-2 text-xs text-gray-600">
                            {usePalette ? (usePaletteFilter ? '→ applyPaletteFilter' : '→ generateBSPT → applyFilter') : '→ no filter'}
                        </div>
                    )}

                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 p-2 border border-primary-200 rounded">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Task Chain</span>
                <div className="flex gap-1">
                    <button
                        onClick={() => addBlock('compress')}
                        className="text-xs px-2 py-1 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200"
                    >
                        + Compress
                    </button>
                    <button
                        onClick={() => addBlock('colorLab')}
                        className="text-xs px-2 py-1 bg-purple-100 border border-purple-300 rounded hover:bg-purple-200"
                    >
                        + Color
                    </button>
                    <button
                        onClick={() => addBlock('cdt')}
                        className="text-xs px-2 py-1 bg-green-100 border border-green-300 rounded hover:bg-green-200"
                    >
                        + DCT
                    </button>
                    <button
                        onClick={() => addBlock('filter')}
                        className="text-xs px-2 py-1 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200"
                    >
                        + Filter
                    </button>
                    <button
                        onClick={() => addBlock('custom')}
                        className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                    >
                        + Custom
                    </button>
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {blocks.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        No blocks. Add blocks to build your task chain.
                    </div>
                ) : (
                    blocks.map((block, index) => renderBlock(block, [index]))
                )}
            </div>
        </div>
    );
};
