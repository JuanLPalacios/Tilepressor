type GBSAvatar = {
    id: string
    name: string
    width: number
    height: number
    filename: string
}

type GBSBackground = {
    id: string
    name: string
    filename: string
    width: number
    height: number
    imageHeight: number
    imageWidth: number
    symbol: string
    tileColors: number[]
}

type GBSPaletteColors = [string, string, string, string]

type GBSPalette = {
    id: string
    name: string
    colors: GBSPaletteColors
    defaultColors?: GBSPaletteColors
    defaultName?: string
}

type GBSScript = {
    id: string
}

type GBSTrigger = {
    id: string
}

type GBSState = {
    id: string
}

type GBSActor = {
    animSpeed: number
    animate: boolean
    collisionGroup: string
    direction: string
    hit1Script: GBSScript[]
    hit2Script: GBSScript[]
    hit3Script: GBSScript[]
    id: string
    moveSpeed: number
    name: string
    script: GBSScript[]
    spriteSheetId: string
    spriteType: string
    startScript: GBSScript[]
    symbol: string
    updateScript: GBSScript[]
    x: number
    y: number
}

type GBSScene = {
    actors: GBSActor[]
    backgroundId: string
    collisions: number[]
    height: number
    id: string
    name: string
    paletteIds: string[]
    playerHit1Script: GBSScript[]
    playerHit2Script: GBSScript[]
    playerHit3Script: GBSScript[]
    script: GBSScript[]
    symbol: string
    tileColors: number[]
    triggers: GBSTrigger[]
    type: 'PLATFORM'
    width: number
    x: number
    y: number
}

type GBSSpriteSheet = {
    animSpeed: number
    boundsHeight: number
    boundsWidth: number
    boundsX: number
    boundsY: number
    canvasHeight: number
    canvasWidth: number
    checksum: string
    filename: string
    height: number
    id: string
    name: string
    numFrames: number
    numTiles: number
    states: GBSState
    symbol: string
    type: string
    width: number
}

export type GBSProj = {
    author: string
    avatars: GBSAvatar[]
    backgrounds: GBSBackground[]
    palettes: GBSPalette[]
    scenes: GBSScene[]
    spriteSheets: GBSSpriteSheet[]
}
