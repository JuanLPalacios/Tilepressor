import { Color } from '../types/Color';

export function colorDifferenceCh(a: number, b: number, dA: number): number {
    const black = (a - b) / 255, white = black + dA;
    return Math.max(black * black, white * white);
}

export function addColor(a: Color, b: Color): Color {
    if (!a) return b;
    if (!b) return a;
    return <Color>a.map((x, i) => Math.round((x + b[i]) / 2));
}

