import { createContext } from 'react';

export type MenuWidth = {
    width: number;
    setWidth: (width: number) => void;
};

export const MenuWidthContext = createContext<MenuWidth>({
    width: 240,
    setWidth: () => {}
});
