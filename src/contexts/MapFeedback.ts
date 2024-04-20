import { createContext } from 'react';
import { StatePair } from '~/types/StatePair';
import { MapState } from './FilesStates';

export type MapFeedback = {
    maxK: number;
    map?: MapState;
};

export const MapFeedbackContext = createContext<StatePair<MapFeedback>>([
    {
        maxK: -1,
    },
    ()=>undefined]
);