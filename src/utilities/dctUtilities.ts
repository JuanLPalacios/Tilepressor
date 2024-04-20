import { SerializableTile } from '../types/SerializableTile';
import { euclideanDistance } from './tileUtilities';

export function dctDifferenceDistance(a: SerializableTile, b: SerializableTile): number {
    let sum = 0;
    const m = Math.sqrt(a.data.length / 4);
    if (!DCT_DISTANCE_QUANTIFIER[m]) DCT_DISTANCE_QUANTIFIER[m] = dctQuantifier(m);
    for (let i = 0; i < a.data.length; i += 4) {
        sum += euclideanDistance(a.data.slice(i, i + 4), b.data.slice(i, i + 4)) / DCT_DISTANCE_QUANTIFIER[m][i / 4];
    }
    return sum;
}

export function dctPermutedDifferenceDistance(a: SerializableTile, b: SerializableTile): number {
    return dctDifferenceDistance(a, b) * (a.instances.length + b.instances.length);
}const DCTCoefficient = (x: number) => (x == 0) ? 1 : Math.sqrt(2);

export function pixels2dct(data: number[]): number[] {
    const newData = Array.from(data).fill(0);
    const { PI } = Math;
    const m = Math.sqrt(data.length / 4);
    for (let t = 0; t < newData.length; t += 4) {
        const i = (t / 4) % m, j = Math.floor(t / 4 / m);
        for (let k = 0; k < 4; k++) {
            let sum = 0;
            for (let p = 0; p < data.length; p += 4) {
                const x = (p / 4) % m;
                const y = Math.floor(p / 4 / m);
                sum += data[p + k] *
                    Math.cos((2 * x + 1) * i * PI / (2 * m)) *
                    Math.cos((2 * y + 1) * j * PI / (2 * m));
            }
            newData[t + k] = DCTCoefficient(i) * DCTCoefficient(j) * sum / m;
        }
    }

    return newData;
}
export function dct2pixels(data: number[]): number[] {
    const newData = Array.from(data).fill(0);
    const { PI } = Math;
    const m = Math.sqrt(data.length / 4);
    for (let t = 0; t < newData.length; t += 4) {
        const i = (t / 4) % m, j = Math.floor(t / 4 / m);
        for (let k = 0; k < 4; k++) {
            let sum = 0;
            for (let p = 0; p < data.length; p += 4) {
                const x = (p / 4) % m;
                const y = Math.floor(p / 4 / m);
                sum += data[p + k] *
                    Math.cos((2 * x) * i * PI / (2 * m)) *
                    Math.cos((2 * y) * j * PI / (2 * m));
            }
            newData[t + k] = sum / m;
        }
    }
    return newData;
}

export function dctQuantifier(m: number): number[] {
    const len = m * m;
    let a = [0];
    while (a.length < len) {
        a.push(...a);
    }
    a = a.slice(0, len);
    for (let t = 0; t < len; t++) {
        const i = (t) % m;
        const j = Math.floor(t / m);
        a[j * m + i] = (Math.max(i, j) + 1) ** 2;
    }
    return a;
}

export const DCT_DISTANCE_QUANTIFIER: number[][] = [];

