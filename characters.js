// Shared between extension.js (GNOME Shell) and prefs.js (GTK).
// Every layer is a 400x400 SVG; pivots are in canvas coordinates.
export const CANVAS = 400;

export const ORDER = ['llama', 'gatito', 'cozy'];

export const CHARACTERS = {
    llama: {
        name: 'Dalai Llama',
        colors: ['#f6d365', '#fda085'],
        particle: 'sparkle.svg',
        layers: [
            {file: 'body.svg', breathe: true},
            {file: 'arm-left.svg', pivot: [142, 264], from: 12, to: 160},
            {file: 'arm-right.svg', pivot: [258, 264], from: -12, to: -160},
        ],
    },
    gatito: {
        name: 'Gatito',
        colors: ['#fbc2eb', '#a6c1ee'],
        particle: 'heart.svg',
        layers: [
            {file: 'tail.svg', pivot: [250, 365], from: -10, to: 12},
            {file: 'body.svg', breathe: true},
            {file: 'arm-left.svg', pivot: [150, 268], from: 8, to: 140},
            {file: 'arm-right.svg', pivot: [250, 268], from: -8, to: -140},
        ],
    },
    cozy: {
        name: 'Cozy Girl',
        colors: ['#a1c4fd', '#c2e9fb'],
        particle: 'flower.svg',
        layers: [
            {file: 'body.svg', breathe: true},
            {file: 'arm-left.svg', pivot: [135, 265], from: 10, to: 160},
            {file: 'arm-right.svg', pivot: [265, 265], from: -10, to: -160},
        ],
    },
};
