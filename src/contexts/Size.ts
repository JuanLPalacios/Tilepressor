import { createContext } from 'react';

export type Size = {
    width: number;
    height: number;
};

export const SizeContext = createContext<Size>({ width: 0, height: 0 });