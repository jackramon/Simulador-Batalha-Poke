let seed = 0;

export function setSeed(newSeed: number) {
    seed = newSeed;
}

export function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

const originalRandom = Math.random;

export function enableDeterministicRandom(initialSeed: number) {
    setSeed(initialSeed);
    Math.random = random;
}

export function disableDeterministicRandom() {
    Math.random = originalRandom;
}
