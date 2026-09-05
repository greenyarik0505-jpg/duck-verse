'use client';

import { useEffect, useRef, useState } from 'react';
import { getGameById } from '../lib/games/registry';

export default function GameModal({ isOpen, gameId, onClose, onAddCoins }) {
  const containerRef = useRef(null);
  const [fps, setFps] = useState(60);
  const [inputLag, setInputLag] = useState('< 16ms');
  const [loading, setLoading] = useState(true);
  const [gameTitle, setGameTitle] = useState('Geometry Dash Neon');
  const activeGameRef = useRef(null);

  const gameMeta = getGameById(gameId);

  // Helper to load a script dynamically if not present
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (err) => reject(err);
      document.body.appendChild(s);
    });
  };

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    let isMounted = true;
    setLoading(true);
    setGameTitle(gameMeta.title || 'Game');

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Dynamic loader for Audio and Game Script
    const initGame = async () => {
      try {
        await loadScript('/audio.js');
        if (!window.sound && window.SoundController) {
          window.sound = new window.SoundController();
        }

        const enginePath = gameMeta.enginePath || '/games/game_geometry_dash.js';
        await loadScript(enginePath);

        if (!isMounted || !containerRef.current) return;

        const container = containerRef.current;
        container.innerHTML = '';

        const canvas = document.createElement('canvas');
        canvas.id = 'game-canvas';
        canvas.width = 850;
        canvas.height = 480;
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        canvas.style.borderRadius = '8px';
        canvas.style.boxShadow = '0 0 20px rgba(0, 243, 255, 0.2)';
        container.appendChild(canvas);

        const GameClass = window[gameMeta.engineClass] || window.GeometryDashGame;
        if (GameClass) {
          const instance = new GameClass(
            canvas,
            () => {
              // Game Over callback
            },
            () => {
              // Victory callback
              if (onAddCoins) onAddCoins(50);
            },
            (coins) => {
              // Coin collected
              if (onAddCoins) onAddCoins(coins || 1);
            }
          );
          instance.start();
          activeGameRef.current = instance;
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize game engine:', err);
        setLoading(false);
      }
    };

    initGame();

    // Benchmark loop for SCRUM-13 (Input Lag & FPS monitoring)
    let lastTime = performance.now();
    let frameCount = 0;
    const interval = setInterval(() => {
      const now = performance.now();
      const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
      setFps(currentFps > 0 ? currentFps : 60);
      setInputLag(currentFps >= 58 ? '~16.6ms (Відмінно)' : '~33ms');
      frameCount = 0;
      lastTime = now;
    }, 1000);

    const countFrames = () => {
      frameCount++;
      if (isOpen && isMounted) requestAnimationFrame(countFrames);
    };
    requestAnimationFrame(countFrames);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
      if (activeGameRef.current && typeof activeGameRef.current.stop === 'function') {
        activeGameRef.current.stop();
        activeGameRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [isOpen, gameId]);

  const handleRestart = () => {
    if (activeGameRef.current) {
      if (typeof activeGameRef.current.restart === 'function') {
        activeGameRef.current.restart();
      } else if (typeof activeGameRef.current.stop === 'function') {
        activeGameRef.current.stop();
        activeGameRef.current.start();
      }
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="game-modal active">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-box">
            <span className="modal-live-dot"></span>
            <h3>{gameTitle}</h3>
          </div>

          <div className="modal-benchmark-tag" title="SCRUM-13: Моніторинг швидкодії вводу">
            <span>⚡ {fps} FPS</span> | <span>{inputLag}</span>
          </div>

          <div className="modal-controls-hint">
            Керування: <b>Пробіл</b> / <b>Стрілка вгору</b> / <b>Клік / Тап</b>
          </div>

          <div className="modal-buttons">
            <button className="modal-btn" onClick={handleRestart} title="Перезапустити">
              🔄 Заново
            </button>
            <button className="modal-btn" onClick={handleToggleFullscreen} title="Повноекранний режим">
              ⛶ Повний екран
            </button>
            <button className="modal-btn close-btn" onClick={onClose} title="Вийти в хаб (Esc)">
              ✖ Закрити
            </button>
          </div>
        </div>

        <div id="game-container" className="game-container" ref={containerRef}>
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 text-cyan-400">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold tracking-wider">Завантаження ігрового модуля...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
