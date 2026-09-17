import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const code = fs.readFileSync(path.join(process.cwd(), 'public/games/game_flappy.js'), 'utf-8');
const sandbox = { window: {}, module: { exports: {} }, console, Math, Date, requestAnimationFrame: () => {}, cancelAnimationFrame: () => {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const FlappyDuckGame = sandbox.module.exports || sandbox.window.FlappyDuckGame;

test('FlappyDuckGame initializes with classic settings and zero score', () => {
    let gameOverCalled = false;
    let coinsAdded = 0;

    const fakeCanvas = {
        width: 800,
        height: 600,
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
            fillRect: () => {},
            strokeRect: () => {},
            stroke: () => {},
            fill: () => {},
            fillText: () => {},
            strokeText: () => {},
            createLinearGradient: () => ({ addColorStop: () => {} }),
            rect: () => {},
            clip: () => {}
        }),
        addEventListener: () => {},
        removeEventListener: () => {}
    };

    const game = new FlappyDuckGame(
        fakeCanvas,
        () => { gameOverCalled = true; },
        (c) => { coinsAdded += c; }
    );

    assert.equal(game.state, 'ready');
    assert.equal(game.score, 0);
    assert.equal(game.collectedCoins, 0);
    assert.equal(game.duck.gravity, 0.38);
    assert.equal(game.duck.jumpStrength, -6.8);

    // Test resize
    game.resize(900, 500);
    assert.equal(game.canvas.width, 900);
    assert.equal(game.canvas.height, 500);

    // Test flap physics in playing state
    game.state = 'playing';
    game.running = true;
    game.duck.vy = 5;
    game.flap();
    assert.equal(game.duck.vy, -6.8);

    // Test spawn pipe
    game.pipes = [];
    game.spawnPipe();
    assert.equal(game.pipes.length, 1);
    assert.equal(game.pipes[0].width, 62);
    assert.equal(game.pipes[0].passed, false);
});
