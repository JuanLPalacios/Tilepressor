import { TaskTypes } from '../enums/TaskType';
import { ColorModel } from '../enums/ColorModel';
import { TileModel } from '../enums/TileModel';
import { TaskBlock } from '../components/TaskChainEditor';
import { createCompressChain, colorLab, CDT, createFilterChain } from './tasksUtilities';

export interface BuildContext {
    colorModel: ColorModel;
    tileModel: TileModel;
    usePalette: boolean;
    usePaletteFilter: boolean;
    usePixelData: boolean;
}

/**
 * Builds a task chain from visual blocks with custom parameters
 */
export function buildTaskChainFromBlocks(
    blocks: TaskBlock[],
    context: BuildContext
): { action: TaskTypes; progress: number }[] {
    let chain: { action: TaskTypes; progress: number }[] = [];

    for (const block of blocks) {
        if (!block.enabled) continue;

        switch (block.type) {
        case 'compress': {
            const params = (block.params as Record<string, unknown>) || {};
            const useClusteredPalettes = (params.useClusteredPalettes as boolean) ?? context.usePaletteFilter;
            const compressChain = createCompressChain(useClusteredPalettes);
            chain = [...chain, ...compressChain];
            break;
        }

        case 'colorLab': {
            const params = (block.params as Record<string, unknown>) || {};
            const colorModel = (params.colorModel as ColorModel) ?? context.colorModel;
            const usePixelData = (params.usePixelData as boolean) ?? context.usePixelData;
            const childChain = block.children
                ? buildTaskChainFromBlocks(block.children, context)
                : [];
            chain = [...chain, ...colorLab(childChain, colorModel, usePixelData)];
            break;
        }

        case 'cdt': {
            const params = (block.params as Record<string, unknown>) || {};
            const tileModel = (params.tileModel as TileModel) ?? context.tileModel;
            const usePixelData = (params.usePixelData as boolean) ?? context.usePixelData;
            const childChain = block.children
                ? buildTaskChainFromBlocks(block.children, context)
                : [];
            chain = [...chain, ...CDT(childChain, tileModel, usePixelData)];
            break;
        }

        case 'filter': {
            const params = (block.params as Record<string, unknown>) || {};
            const usePalette = (params.usePalette as boolean) ?? context.usePalette;
            const useClusteredPalettes = (params.useClusteredPalettes as boolean) ?? context.usePaletteFilter;
            const filterTask = (params.filterTask as TaskTypes) ?? (context.usePaletteFilter
                ? TaskTypes.applyPaletteFilter
                : TaskTypes.applyFilter);
            const childChain = block.children
                ? buildTaskChainFromBlocks(block.children, context)
                : [];
            chain = [
                ...chain,
                ...createFilterChain(childChain, usePalette, useClusteredPalettes, filterTask)
            ];
            break;
        }

        case 'custom': {
            if (block.taskType !== undefined) {
                chain.push({ action: block.taskType, progress: 0 });
            }
            break;
        }
        }
    }

    return chain;
}

/**
 * Converts current menu options to default blocks
 */
export function menuOptionsToBlocks(
    colorModel: ColorModel,
    tileModel: TileModel,
    usePalette: boolean,
    usePaletteFilter: boolean
): TaskBlock[] {
    const blocks: TaskBlock[] = [];

    // Create the nested structure similar to current implementation
    const generateId = () => `block_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;

    // Start with filter wrapper if palette is used
    if (usePalette || usePaletteFilter) {
        const filterBlock: TaskBlock = {
            id: generateId(),
            type: 'filter',
            label: usePaletteFilter ? 'Palette Filter' : 'Color Filter',
            enabled: true,
            children: [],
            params: {
                usePalette,
                useClusteredPalettes: usePaletteFilter,
                filterTask: usePaletteFilter ? TaskTypes.applyPaletteFilter : TaskTypes.applyFilter
            }
        };

        // Color transform wrapper
        if (colorModel !== ColorModel.RGB) {
            const colorBlock: TaskBlock = {
                id: generateId(),
                type: 'colorLab',
                label: 'Lab Color Space',
                enabled: true,
                children: [],
                params: {
                    colorModel,
                    usePixelData: false
                }
            };

            // DCT wrapper
            if (tileModel !== TileModel.Raster) {
                const dctBlock: TaskBlock = {
                    id: generateId(),
                    type: 'cdt',
                    label: 'DCT Transform',
                    enabled: true,
                    children: [],
                    params: {
                        tileModel,
                        usePixelData: false
                    }
                };

                // Compress at the core
                const compressBlock: TaskBlock = {
                    id: generateId(),
                    type: 'compress',
                    label: 'K-Means Compression',
                    enabled: true,
                    children: [],
                    params: {
                        useClusteredPalettes: usePaletteFilter
                    }
                };

                dctBlock.children!.push(compressBlock);
                colorBlock.children!.push(dctBlock);
            } else {
                const compressBlock: TaskBlock = {
                    id: generateId(),
                    type: 'compress',
                    label: 'K-Means Compression',
                    enabled: true,
                    children: [],
                    params: {
                        useClusteredPalettes: usePaletteFilter
                    } as Record<string, unknown>
                };
                colorBlock.children!.push(compressBlock);
            }

            filterBlock.children!.push(colorBlock);
        } else {
            if (tileModel !== TileModel.Raster) {
                const dctBlock: TaskBlock = {
                    id: generateId(),
                    type: 'cdt',
                    label: 'DCT Transform',
                    enabled: true,
                    children: [],
                    params: {
                        tileModel,
                        usePixelData: false
                    }
                };

                const compressBlock: TaskBlock = {
                    id: generateId(),
                    type: 'compress',
                    label: 'K-Means Compression',
                    enabled: true,
                    children: [],
                    params: {
                        useClusteredPalettes: usePaletteFilter
                    } as Record<string, unknown>
                };

                dctBlock.children!.push(compressBlock);
                filterBlock.children!.push(dctBlock);
            } else {
                const compressBlock: TaskBlock = {
                    id: generateId(),
                    type: 'compress',
                    label: 'K-Means Compression',
                    enabled: true,
                    children: [],
                    params: {
                        useClusteredPalettes: usePaletteFilter
                    }
                };
                filterBlock.children!.push(compressBlock);
            }
        }

        blocks.push(filterBlock);
    } else {
        // No palette - simpler structure
        if (colorModel !== ColorModel.RGB) {
            const colorBlock: TaskBlock = {
                id: generateId(),
                type: 'colorLab',
                label: 'Lab Color Space',
                enabled: true,
                children: [],
                params: {
                    colorModel,
                    usePixelData: false
                }
            };

            if (tileModel !== TileModel.Raster) {
                const dctBlock: TaskBlock = {
                    id: generateId(),
                    type: 'cdt',
                    label: 'DCT Transform',
                    enabled: true,
                    children: [],
                    params: {
                        tileModel,
                        usePixelData: false
                    }
                };

                const compressBlock: TaskBlock = {
                    id: generateId(),
                    type: 'compress',
                    label: 'K-Means Compression',
                    enabled: true,
                    children: [],
                    params: {
                        useClusteredPalettes: usePaletteFilter
                    }
                };

                dctBlock.children!.push(compressBlock);
                colorBlock.children!.push(dctBlock);
            } else {
                const compressBlock: TaskBlock = {
                    id: generateId(),
                    type: 'compress',
                    label: 'K-Means Compression',
                    enabled: true,
                    children: [],
                    params: {
                        useClusteredPalettes: usePaletteFilter
                    }
                };
                colorBlock.children!.push(compressBlock);
            }

            blocks.push(colorBlock);
        } else {
            if (tileModel !== TileModel.Raster) {
                const dctBlock: TaskBlock = {
                    id: generateId(),
                    type: 'cdt',
                    label: 'DCT Transform',
                    enabled: true,
                    children: [],
                    params: {
                        tileModel,
                        usePixelData: false
                    }
                };

                const compressBlock: TaskBlock = {
                    id: generateId(),
                    type: 'compress',
                    label: 'K-Means Compression',
                    enabled: true,
                    children: [],
                    params: {
                        useClusteredPalettes: false
                    } as Record<string, unknown>
                };

                dctBlock.children!.push(compressBlock);
                blocks.push(dctBlock);
            } else {
                const compressBlock: TaskBlock = {
                    id: generateId(),
                    type: 'compress',
                    label: 'K-Means Compression',
                    enabled: true,
                    children: [],
                    params: {
                        useClusteredPalettes: false
                    } as Record<string, unknown>
                };
                blocks.push(compressBlock);
            }
        }
    }

    return blocks;
}
