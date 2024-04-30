import { Dispatch, SetStateAction } from 'react';

export type StatePair<T = unknown> = [T, Dispatch<SetStateAction<T>>];