'use client';

import { useEffect, useRef, useState } from 'react';
import { getGameById } from '../lib/games/registry';

function GameModalContent({ gameId, onClose, onAddCoins }) {
  const containerRef = useRef(null);
  const [fps, setFps] = useState(60);
  const [inputLag, setInputLag] = useState('< 16ms');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const activeGameRef = useRef(null);

  const gameMeta = getGameById(gameId) || {
    id: 'geometry_dash',
    title: 'Geometry Dash Neon',
    enginePath: '/games/game_geometry_dash.js',
    engineClass: 'GeometryDashGame'
  };

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.getAttribute('data-loaded') === 'true') {
          resolve(true);
          return;
        }
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => {
        s.setAttribute('data-loaded', 'true');
        resolve(true);
      };
      s.onerror = () => {
        console.warn('Script failed to load:', src);
        resolve(false);
      };
      document.body.appendChild(s);
    });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const initGame = async () => {
      try {
        // Load Audio Engine
        await loadScript('/audio.js');
        if (window.SoundController && !window.sound) {
          window.sound = new window.SoundController();
        }

        // Load Game Engine Script
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
        canvas.style.boxShadow = '0 0 24px rgba(0, 243, 255, 0.25)';
        container.appendChild(canvas);

        const GameClass = window[gameMeta.engineClass] || window.GeometryDashGame;
        if (GameClass && typeof GameClass === 'function') {
          const instance = new GameClass(
            canvas,
            () => {
              // Game Over
            },
            () => {
              // Victory
              if (onAddCoins) onAddCoins(50);
            },
            (coins) => {
              // Collect coins
              if (onAddCoins) onAddCoins(coins || 1);
            }
          );
          if (instance && typeof instance.start === 'function') {
            instance.start();
          }
          activeGameRef.current = instance;
        } else {
          setErrorMsg('Ігровий рушій завантажується...');
        }
        setLoading(false);
      } catch (err) {
        console.error('Game initialization error:', err);
        if (isMounted) {
          setErrorMsg('Помилка запуску гри. Спробуйте оновити сторінку.');
          setLoading(false);
        }
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
      setInputLag(currentFps >= 58 ? '~16.6ms (60 FPS)' : '~33ms');
      frameCount = 0;
      lastTime = now;
    }, 1000);

    const countFrames = () => {
      frameCount++;
      if (isMounted) requestAnimationFrame(countFrames);
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
  }, [gameId]);

  const handleRestart = () => {
    if (activeGameRef.current) {
      if (typeof activeGameRef.current.restart === 'function') {
        activeGameRef.current.restart();
      } else if (typeof activeGameRef.current.stop === 'function' && typeof activeGameRef.current.start === 'function') {
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

  return (
    <div className="game-modal active">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-box">
            <span className="modal-live-dot"></span>
            <h3>{gameMeta.title || 'Ігровий сеанс'}</h3>
          </div>

          <div className="modal-benchmark-tag" title="SCRUM-13: Моніторинг швидкодії">
            <span>⚡ {fps} FPS</span> | <span>{inputLag}</span>
          </div>

          <div className="modal-controls-hint">
            Керування: <b>Пробіл</b> / <b>Стрілка вгору</b> / <b>Клік / Тап</b>
          </div>

          <div className="modal-buttons">
            <button className="modal-btn" onClick={handleRestart} title="Перезапустити раунд">
              🔄 Заново
            </button>
            <button className="modal-btn" onClick={handleToggleFullscreen} title="Повноекранний режим">
              ⛶ Повний екран
            </button>
            <button className="modal-btn close-btn" onClick={onClose} title="Закрити (Escape)">
              ✖ Закрити
            </button>
          </div>
        </div>

        <div id="game-container" className="game-container" ref={containerRef}>
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 text-cyan-400">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-semibold tracking-wider">Завантаження ігрового модуля...</p>
            </div>
          )}
          {errorMsg && (
            <div className="flex flex-col items-center justify-center p-12 text-rose-400">
              <p className="mb-4 font-semibold">{errorMsg}</p>
              <button className="modal-btn" onClick={() => window.location.reload()}>
                Оновити сайт
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GameModal({ isOpen, gameId, onClose, onAddCoins }) {
  if (!isOpen) return null;
  return <GameModalContent gameId={gameId} onClose={onClose} onAddCoins={onAddCoins} />;
}
