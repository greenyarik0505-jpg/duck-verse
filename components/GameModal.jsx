'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getGameById } from '../lib/games/registry';

function GameModalContent({ gameId, onClose, onAddCoins }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const activeGameRef = useRef(null);

  const [fps, setFps] = useState(60);
  const [inputLag, setInputLag] = useState('< 16ms');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [progress, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [bestScore, setBestScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    const savedMuted = localStorage.getItem('duckverse_muted') === 'true';
    setSoundEnabled(!savedMuted);
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('duckverse_muted', (!next).toString());
      if (window.sound) {
        if (typeof window.sound.toggleMute === 'function') {
          window.sound.toggleMute();
        } else {
          window.sound.muted = !next;
        }
      }
      if (activeGameRef.current) {
        if (!next) {
          activeGameRef.current.stopMusic?.();
        } else if (activeGameRef.current.running) {
          activeGameRef.current.startMusic?.();
        }
      }
      return next;
    });
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle error:', err);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  const handleClose = useCallback(() => {
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen?.().catch(() => {});
      } catch {}
    }
    onClose();
  }, [onClose]);

  const handleRestart = useCallback(() => {
    if (activeGameRef.current) {
      const g = activeGameRef.current;
      if (typeof g.restart === 'function') {
        g.restart();
      } else if (typeof g.stop === 'function' && typeof g.start === 'function') {
        g.stop();
        g.start();
      }
      g.attempts = (g.attempts || 1) + 1;
      localStorage.setItem('duckverse_gd_attempts', g.attempts.toString());
      setAttempts(g.attempts);
      setProgress(0);
    }
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'r' || e.key === 'R' || e.code === 'KeyR') {
        e.preventDefault();
        handleRestart();
        return;
      }

      if (e.key === 'f' || e.key === 'F' || e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
        return;
      }

      if (e.key === 'm' || e.key === 'M' || e.code === 'KeyM') {
        e.preventDefault();
        handleToggleSound();
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose, handleRestart, handleToggleFullscreen, handleToggleSound]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    const initGame = async () => {
      try {
        await loadScript('/audio.js');
        if (window.SoundController && !window.sound) {
          window.sound = new window.SoundController();
        }

        const enginePath = gameMeta.enginePath || '/games/game_geometry_dash.js';
        await loadScript(enginePath);

        if (!isMounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const GameClass = window[gameMeta.engineClass] || window.GeometryDashGame;
        if (GameClass && typeof GameClass === 'function') {
          const instance = new GameClass(
            canvas,
            () => {
              const curAttempts = parseInt(localStorage.getItem('duckverse_gd_attempts') || '1', 10) || 1;
              const curBest = parseInt(localStorage.getItem('duckverse_gd_best') || '0', 10) || 0;
              setAttempts(curAttempts);
              setBestScore(curBest);
            },
            () => {
              if (onAddCoins) onAddCoins(50);
              setBestScore(100);
            },
            (coins) => {
              if (onAddCoins) onAddCoins(coins || 1);
            }
          );

          activeGameRef.current = instance;

          if (containerRef.current && typeof instance.resize === 'function') {
            const { clientWidth, clientHeight } = containerRef.current;
            if (clientWidth > 0 && clientHeight > 0) {
              instance.resize(clientWidth, clientHeight, true);
            }
          }

          if (instance && typeof instance.start === 'function') {
            instance.start();
          }
        } else {
          setErrorMsg('Ігровий рушій не знайдено.');
        }
        setLoading(false);
      } catch (err) {
        console.error('Game initialization error:', err);
        if (isMounted) {
          setErrorMsg('Помилка запуску гри.');
          setLoading(false);
        }
      }
    };

    initGame();

    let lastTime = performance.now();
    let frameCount = 0;
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      if (delta > 0) {
        const currentFps = Math.round((frameCount * 1000) / delta);
        const validFps = currentFps > 0 ? currentFps : 60;
        setFps(validFps);
        setInputLag(validFps >= 55 ? '< 16ms' : '~33ms');
      }
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
      clearInterval(interval);
      if (activeGameRef.current && typeof activeGameRef.current.stop === 'function') {
        activeGameRef.current.stop();
        activeGameRef.current = null;
      }
    };
  }, [gameId, gameMeta.engineClass, gameMeta.enginePath, onAddCoins]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContainerResize = (entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && activeGameRef.current) {
          if (typeof activeGameRef.current.resize === 'function') {
            activeGameRef.current.resize(width, height, true);
          }
        }
      }
    };

    const observer = new ResizeObserver(handleContainerResize);
    observer.observe(container);

    const handleWindowResize = () => {
      if (containerRef.current && activeGameRef.current?.resize) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          activeGameRef.current.resize(clientWidth, clientHeight, true);
        }
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    const initAttempts = parseInt(localStorage.getItem('duckverse_gd_attempts') || '1', 10) || 1;
    const initBest = parseInt(localStorage.getItem('duckverse_gd_best') || '0', 10) || 0;
    setAttempts(initAttempts);
    setBestScore(initBest);

    let lastP = 0;
    let lastA = initAttempts;
    let lastB = initBest;

    const syncInterval = setInterval(() => {
      const g = activeGameRef.current;
      if (g) {
        const curX = g.player?.x || 0;
        const len = g.levelLength || 17280;
        const p = Math.min(100, Math.max(0, Math.floor((curX / len) * 100)));
        if (p !== lastP) {
          lastP = p;
          setProgress(p);
        }
        const a = g.attempts !== undefined ? g.attempts : (parseInt(localStorage.getItem('duckverse_gd_attempts') || '1', 10) || 1);
        if (a !== lastA) {
          lastA = a;
          setAttempts(a);
        }
        const b = g.bestPercent !== undefined ? g.bestPercent : (parseInt(localStorage.getItem('duckverse_gd_best') || '0', 10) || 0);
        if (b !== lastB) {
          lastB = b;
          setBestScore(b);
        }
      }
    }, 50);

    return () => clearInterval(syncInterval);
  }, []);

  const handleContainerPointerDown = (e) => {
    if (e.target !== canvasRef.current && activeGameRef.current?.tryJump) {
      activeGameRef.current.tryJump();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030713] flex flex-col w-screen h-screen overflow-hidden select-none gaming-view-fullscreen">
      <header className="gaming-hud-header">
        <div className="gaming-hud-brand">
          <span className="gaming-live-dot" title="Ігровий рушій активний"></span>
          <h2 className="gaming-brand-text">
            <span>⚡ DUCKVERSE</span>
            <span className="gaming-brand-sep">|</span>
            <span className="gaming-brand-title">GEOMETRY DASH NEON</span>
          </h2>
        </div>

        <div className="gaming-hud-center">
          <span className="gaming-stat-badge" title="Кількість спроб">
            🔥 Спроба {attempts}
          </span>
          <span className="gaming-stat-badge gaming-stat-best" title="Найкращий результат">
            🏆 Рекорд {bestScore}%
          </span>

          <div className="gaming-progress-box" title={`Поточний прогрес: ${progress}%`}>
            <div className="gaming-progress-track">
              <div
                className="gaming-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="gaming-progress-percent">{progress}%</span>
          </div>
        </div>

        <div className="gaming-hud-right">
          <div className="gaming-fps-tag" title="SCRUM-13: Моніторинг швидкодії">
            <span>⚡ {fps} FPS | {inputLag}</span>
          </div>

          <button
            type="button"
            className="gaming-btn"
            onClick={handleRestart}
            title="Перезапустити раунд (Клавіша R)"
          >
            <span>🔄 [R] Заново</span>
          </button>

          <button
            type="button"
            className={`gaming-btn ${!soundEnabled ? 'gaming-btn-muted' : ''}`}
            onClick={handleToggleSound}
            title={soundEnabled ? 'Вимкнути звук (Клавіша M)' : 'Увімкнути звук (Клавіша M)'}
          >
            <span>{soundEnabled ? '🔊 [M]' : '🔇 [M]'}</span>
          </button>

          <button
            type="button"
            className="gaming-btn"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Вийти з повного екрана (Клавіша F)' : 'Повноекранний режим (Клавіша F)'}
          >
            <span>⛶ [F]</span>
          </button>

          <button
            type="button"
            className="gaming-btn gaming-btn-exit"
            onClick={handleClose}
            title="Повернутися до хабу (Клавіша Escape)"
          >
            <span>✖ [Esc] До хабу</span>
          </button>
        </div>
      </header>

      <div
        ref={containerRef}
        id="game-container"
        className="gaming-canvas-container flex-1"
        onPointerDown={handleContainerPointerDown}
      >
        <div className="gaming-ambient-backlight" aria-hidden="true" />

        {loading && (
          <div className="relative z-20 flex flex-col items-center justify-center p-12 text-slate-300">
            <div className="w-10 h-10 border-3 border-slate-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-semibold tracking-wider font-['Rajdhani',sans-serif]">
              Завантаження ігрового модуля...
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="relative z-20 flex flex-col items-center justify-center p-8 text-rose-300 bg-rose-950/80 border border-rose-500/30 rounded-xl backdrop-blur-md">
            <p className="mb-4 font-semibold text-base">{errorMsg}</p>
            <button
              type="button"
              className="gaming-btn gaming-btn-exit"
              onClick={() => window.location.reload()}
            >
              Оновити сайт
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          id="game-canvas"
          width={850}
          height={480}
          style={{
            display: loading ? 'none' : 'block',
          }}
        />
      </div>

      <footer className="gaming-hud-footer">
        <div className="flex items-center gap-3">
          <span>Керування: <kbd>Пробіл</kbd> / <kbd>↑</kbd> / <kbd>Клік</kbd> — стрибок</span>
          <span className="text-slate-700">|</span>
          <span><kbd>R</kbd> — заново</span>
          <span className="text-slate-700">|</span>
          <span><kbd>F</kbd> — повний екран</span>
          <span className="text-slate-700">|</span>
          <span><kbd>M</kbd> — звук</span>
          <span className="text-slate-700">|</span>
          <span><kbd>Esc</kbd> — до хабу</span>
        </div>
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-slate-500">
          <span>DUCKVERSE AAA GAMING VIEW 60 FPS</span>
        </div>
      </footer>
    </div>
  );
}

export default function GameModal({ isOpen, gameId, onClose, onAddCoins }) {
  if (!isOpen) return null;
  return <GameModalContent gameId={gameId} onClose={onClose} onAddCoins={onAddCoins} />;
}
