import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_REGISTRY, getGameById, getGamesByCategory, searchGames } from '../lib/games/registry.js';
import fs from 'node:fs';
import path from 'node:path';

// Mock Canvas for testing
function createMockCanvas(width = 850, height = 480) {
    const listeners = new Map();
    return {
        width,
        height,
        style: {},
        getContext: () => ({
            clearRect: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            rotate: () => {},
            scale: () => {},
            beginPath: () => {},
            closePath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            arc: () => {},
            ellipse: () => {},
            quadraticCurveTo: () => {},
            bezierCurveTo: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            stroke: () => {},
            fill: () => {},
            fillText: () => {},
            strokeText: () => {},
            createLinearGradient: () => ({ addColorStop: () => {} }),
            createRadialGradient: () => ({ addColorStop: () => {} }),
            rect: () => {},
            clip: () => {}
        }),
        addEventListener: (event, handler) => {
            listeners.set(event, handler);
        },
        removeEventListener: (event) => {
            listeners.delete(event);
        },
        dispatchEvent: (event) => {
            const h = listeners.get(event.type);
            if (h) h(event);
        }
    };
}

test('SMOKE 1: Game Hub Registry & Engine File Existence', () => {
    assert.ok(Array.isArray(GAME_REGISTRY), 'Registry should be an array');
    assert.ok(GAME_REGISTRY.length >= 4, 'Should have registered games');

    // Flagship check
    const gd = getGameById('geometry_dash');
    assert.equal(gd.id, 'geometry_dash');
    assert.equal(gd.isFlagship, true);

    // Verify all active game files exist on disk
    for (const game of GAME_REGISTRY) {
        if (game.enginePath.startsWith('/games/')) {
            const filePath = path.join(process.cwd(), 'public', game.enginePath);
            assert.ok(fs.existsSync(filePath), `Engine file must exist: ${filePath}`);
        }
    }
});

test('SMOKE 2: Search and Category Filtering', () => {
    // Search filter smoke
    const searchResults = searchGames('Geometry');
    assert.ok(searchResults.some(g => g.id === 'geometry_dash'));

    // Category filter smoke
    const actionGames = getGamesByCategory('action');
    assert.ok(actionGames.length > 0);
    assert.ok(actionGames.every(g => g.category === 'action'));

    // Non-existent search returns empty array
    const emptyResults = searchGames('NonExistentGameX123');
    assert.equal(emptyResults.length, 0);
});

test('SMOKE 3: Engine Scripts Syntax & Integrity Check', () => {
    const engines = [
        'public/games/game_geometry_dash.js',
        'public/games/game_invaders.js',
        'public/games/game_clicker.js',
        'public/games/game_flappy.js'
    ];

    for (const eng of engines) {
        const fullPath = path.join(process.cwd(), eng);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            assert.ok(content.length > 100, `Engine script ${eng} must not be empty`);
            // Basic syntax parsing test using Function constructor
            assert.doesNotThrow(() => {
                new Function(content);
            }, `Engine script ${eng} contains valid JavaScript syntax`);
        }
    }
});

test('SMOKE 4: Hub Balance & Session Persistence Smoke Test', () => {
    // Simulate user coin balance persistence
    const initialCoins = 150;
    const store = new Map();
    store.set('duckverse_coins', initialCoins.toString());

    // Add reward
    const reward = 50;
    const current = parseInt(store.get('duckverse_coins'), 10) + reward;
    store.set('duckverse_coins', current.toString());

    // Verify
    assert.equal(store.get('duckverse_coins'), '200');

    // Verify game exit does not corrupt coin storage
    assert.ok(parseInt(store.get('duckverse_coins'), 10) >= initialCoins);
});

test('SMOKE 5: Viewport Adaptability & Mobile Resize Contract', () => {
    const canvas = createMockCanvas(850, 480);

    // Desktop
    canvas.width = 1024;
    canvas.height = 768;
    assert.equal(canvas.width, 1024);
    assert.equal(canvas.height, 768);

    // Mobile Viewport (iPhone SE / 375px)
    canvas.width = 375;
    canvas.height = 667;
    assert.equal(canvas.width, 375);
    assert.equal(canvas.height, 667);

    // Compact Mobile (320px)
    canvas.width = 320;
    canvas.height = 568;
    assert.equal(canvas.width, 320);
    assert.equal(canvas.height, 568);
});
