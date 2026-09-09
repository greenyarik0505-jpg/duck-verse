'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getGameById, GAME_REGISTRY } from '../lib/games/registry';

function GameModalContent({ gameId, onClose, onAddCoins }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const activeGameRef = useRef(null);
  const menuRef = useRef(null);

  const [currentGameId, setCurrentGameId] = useState(gameId || 'geometry_dash');
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);

  const [fps, setFps] = useState(60);
  const [inputLag, setInputLag] = useState('< 16ms');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Geometry Dash stats
  const [progress, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [bestScore, setBestScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(0.85);

  // Invaders stats
  const [invadersWave, setInvadersWave] = useState(1);
  const [invadersScore, setInvadersScore] = useState(0);
  const [invadersBest, setInvadersBest] = useState(0);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (gameId) {
      setCurrentGameId(gameId);
    }
  }, [gameId]);

  const gameMeta = getGameById(currentGameId) || {
    id: 'geometry_dash',
    title: 'Geometry Dash',
    enginePath: '/games/game_geometry_dash.js',
    engineClass: 'GeometryDashGame'
  };

  const playableGames = GAME_REGISTRY.filter((g) => g.status === 'playable');

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
    const savedSpeed = parseFloat(localStorage.getItem('duckverse_gd_speed') || '0.85') || 0.85;
    setSpeedMultiplier(savedSpeed);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsGameMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
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

  const handleToggleSpeed = useCallback((e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setSpeedMultiplier((prev) => {
      let next = 1.0;
      if (prev >= 0.95) next = 0.85;
      else if (prev >= 0.8) next = 0.75;
      else next = 1.0;

      try {
        localStorage.setItem('duckverse_gd_speed', next.toString());
      } catch {}

      if (activeGameRef.current && typeof activeGameRef.current.setSpeedMultiplier === 'function') {
        activeGameRef.current.setSpeedMultiplier(next);
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

  const onAddCoinsRef = useRef(onAddCoins);
  useEffect(() => {
    onAddCoinsRef.current = onAddCoins;
  }, [onAddCoins]);

  const handleRestart = useCallback((e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (activeGameRef.current) {
      const g = activeGameRef.current;
      if (typeof g.restart === 'function') {
        g.restart();
      } else if (typeof g.stop === 'function' && typeof g.start === 'function') {
        g.stop();
        g.start();
      }
      setAttempts(g.attempts || 1);
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

      if (e.key === 's' || e.key === 'S' || e.code === 'KeyS') {
        if (currentGameId === 'geometry_dash') {
          e.preventDefault();
          handleToggleSpeed();
          return;
        }
      }

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose, handleRestart, handleToggleFullscreen, handleToggleSound, handleToggleSpeed, currentGameId]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    // Clean up previous active game instance
    if (activeGameRef.current && typeof activeGameRef.current.stop === 'function') {
      try {
        activeGameRef.current.stop();
      } catch (err) {}
      activeGameRef.current = null;
    }

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
            (res) => {
              if (currentGameId === 'geometry_dash') {
                const curAttempts = parseInt(localStorage.getItem('duckverse_gd_attempts') || '1', 10) || 1;
                const curBest = parseInt(localStorage.getItem('duckverse_gd_best') || '0', 10) || 0;
                setAttempts(curAttempts);
                setBestScore(curBest);
              } else if (currentGameId === 'invaders') {
                if (res && res.score) {
                  setInvadersScore(res.score);
                  setInvadersWave(res.wave || 1);
                }
              }
            },
            () => {
              if (onAddCoinsRef.current) onAddCoinsRef.current(50);
              if (currentGameId === 'geometry_dash') setBestScore(100);
            },
            (coins) => {
              if (onAddCoinsRef.current) onAddCoinsRef.current(coins || 1);
            }
          );

          activeGameRef.current = instance;

          if (containerRef.current && typeof instance.resize === 'function') {
            const { clientWidth, clientHeight } = containerRef.current;
            if (clientWidth > 0 && clientHeight > 0) {
              instance.resize(clientWidth, clientHeight, true);
            }
          }

          if (instance && typeof instance.setSpeedMultiplier === 'function') {
            const initialSpeed = parseFloat(localStorage.getItem('duckverse_gd_speed') || '0.85') || 0.85;
            instance.setSpeedMultiplier(initialSpeed);
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

    let rafId = null;
    let lastTime = performance.now();
    let frameCount = 0;
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      if (delta > 0) {
        const measuredFps = Math.min(144, Math.max(1, Math.round((frameCount * 1000) / delta)));
        setFps(measuredFps);
        setInputLag(measuredFps >= 55 ? '< 16ms' : '~33ms');
      }
      frameCount = 0;
      lastTime = now;
    }, 1000);

    const countFrames = () => {
      frameCount++;
      if (isMounted) {
        rafId = requestAnimationFrame(countFrames);
      }
    };
    rafId = requestAnimationFrame(countFrames);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (rafId) cancelAnimationFrame(rafId);
      if (activeGameRef.current && typeof activeGameRef.current.stop === 'function') {
        try {
          activeGameRef.current.stop();
        } catch (err) {}
        activeGameRef.current = null;
      }
    };
  }, [currentGameId, gameMeta.engineClass, gameMeta.enginePath]);

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

    const initInvadersBest = parseInt(localStorage.getItem('duckverse_invaders_best') || '0', 10) || 0;
    setInvadersBest(initInvadersBest);

    const syncInterval = setInterval(() => {
      const g = activeGameRef.current;
      if (g) {
        if (currentGameId === 'geometry_dash') {
          const curX = g.player?.x || 0;
          const len = g.levelLength || 17280;
          const p = Math.min(100, Math.max(0, Math.floor((curX / len) * 100)));
          setProgress(p);

          const a = g.attempts !== undefined ? g.attempts : (parseInt(localStorage.getItem('duckverse_gd_attempts') || '1', 10) || 1);
          setAttempts(a);

          const b = g.bestPercent !== undefined ? g.bestPercent : (parseInt(localStorage.getItem('duckverse_gd_best') || '0', 10) || 0);
          setBestScore(b);
        } else if (currentGameId === 'invaders') {
          if (g.wave !== undefined) setInvadersWave(g.wave);
          if (g.score !== undefined) setInvadersScore(g.score);
          if (g.bestScore !== undefined) setInvadersBest(g.bestScore);
        }
      }
    }, 50);

    return () => clearInterval(syncInterval);
  }, [currentGameId]);

  const handleContainerPointerDown = (e) => {
    if (e.target !== canvasRef.current) {
      if (activeGameRef.current?.tryJump) {
        activeGameRef.current.tryJump();
      } else if (activeGameRef.current?.shoot) {
        activeGameRef.current.shoot();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030713] flex flex-col w-screen h-screen overflow-hidden select-none gaming-view-fullscreen">
      <header className="gaming-hud-header">
        <div className="gaming-hud-brand flex items-center gap-3">
          <span className="gaming-live-dot" title="Ігровий рушій активний"></span>
          <h2 className="gaming-brand-text">
            <span>⚡ DUCKVERSE</span>
            <span className="gaming-brand-sep">|</span>
            <span className="gaming-brand-title">{gameMeta.title.toUpperCase()}</span>
          </h2>

          {/* Unified Game Selection Menu (SCRUM-20) */}
          <div ref={menuRef} className="relative ml-2">
            <button
              type="button"
              className="gaming-btn font-bold flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 rounded-lg transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsGameMenuOpen((prev) => !prev);
              }}
              title="Єдине уніфіковане меню вибору та перемикання ігор"
            >
              <span>🎮 МЕНЮ ІГОР</span>
              <span className="text-xs">{isGameMenuOpen ? '▲' : '▼'}</span>
            </button>

            {isGameMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-[#0a0f1d] border border-cyan-500/40 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-bold text-cyan-400 tracking-wider flex items-center justify-between">
                  <span>ДОСТУПНІ ІГРИ ({playableGames.length})</span>
                  <span className="text-[10px] text-slate-500">ШВИДКИЙ ЗАПУСК</span>
                </div>
                <div className="p-1.5 space-y-1">
                  {playableGames.map((g) => {
                    const isCur = currentGameId === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isCur
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentGameId(g.id);
                          setIsGameMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{g.icon}</span>
                          <span>{g.title}</span>
                        </div>
                        {isCur ? (
                          <span className="text-[10px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                            АКТИВНА
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">ГРАТИ →</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="gaming-hud-center">
          {currentGameId === 'geometry_dash' ? (
            <>
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
            </>
          ) : currentGameId === 'invaders' ? (
            <>
              <span className="gaming-stat-badge" title="Поточна космічна хвиля">
                👾 Хвиля {invadersWave}
              </span>
              <span className="gaming-stat-badge" title="Поточні очки">
                🎯 Очки {invadersScore}
              </span>
              <span className="gaming-stat-badge gaming-stat-best" title="Найкращий рахунок">
                🏆 Рекорд {invadersBest}
              </span>
            </>
          ) : (
            <span className="gaming-stat-badge">
              🎮 {gameMeta.tag}
            </span>
          )}
        </div>

        <div className="gaming-hud-right">
          <div className="gaming-fps-tag" title="SCRUM-13: Моніторинг швидкодії (фіксовані 60 FPS)">
            <span>⚡ {fps} FPS | {inputLag}</span>
          </div>

          {currentGameId === 'geometry_dash' && (
            <button
              type="button"
              className="gaming-btn gaming-btn-speed"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSpeed(e);
              }}
              title="Швидкість гри (Клавіша S): 0.85x (комфортна), 1.0x (класична), 0.75x (тренувальна)"
            >
              <span>⚡ {speedMultiplier}x</span>
            </button>
          )}

          <button
            type="button"
            className="gaming-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleRestart(e);
            }}
            title="Перезапустити раунд (Клавіша R)"
          >
            <span>🔄 [R] Заново</span>
          </button>

          <button
            type="button"
            className={`gaming-btn ${!soundEnabled ? 'gaming-btn-muted' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSound();
            }}
            title={soundEnabled ? 'Вимкнути звук (Клавіша M)' : 'Увімкнути звук (Клавіша M)'}
          >
            <span>{soundEnabled ? '🔊 [M]' : '🔇 [M]'}</span>
          </button>

          <button
            type="button"
            className="gaming-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFullscreen();
            }}
            title={isFullscreen ? 'Вийти з повного екрана (Клавіша F)' : 'Повноекранний режим (Клавіша F)'}
          >
            <span>⛶ [F]</span>
          </button>

          <button
            type="button"
            className="gaming-btn gaming-btn-exit"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
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
          {currentGameId === 'geometry_dash' ? (
            <span>Керування: <kbd>Пробіл</kbd> / <kbd>↑</kbd> / <kbd>Клік</kbd> — стрибок</span>
          ) : currentGameId === 'invaders' ? (
            <span>Керування: <kbd>←</kbd> <kbd>→</kbd> / <kbd>Миша</kbd> — рух | <kbd>Пробіл</kbd> / <kbd>Клік</kbd> — лазери</span>
          ) : (
            <span>Керування: <kbd>Пробіл</kbd> / <kbd>Клік</kbd> — дія</span>
          )}
          <span className="text-slate-700">|</span>
          <span><kbd>R</kbd> — заново</span>
          {currentGameId === 'geometry_dash' && (
            <>
              <span className="text-slate-700">|</span>
              <span><kbd>S</kbd> — швидкість</span>
            </>
          )}
          <span className="text-slate-700">|</span>
          <span><kbd>F</kbd> — повний екран</span>
          <span className="text-slate-700">|</span>
          <span><kbd>M</kbd> — звук</span>
          <span className="text-slate-700">|</span>
          <span><kbd>Esc</kbd> — до хабу</span>
        </div>
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-slate-500">
          <span>DUCKVERSE AAA UNIFIED GAMING VIEW 60 FPS</span>
        </div>
      </footer>
    </div>
  );
}

export default function GameModal({ isOpen, gameId, onClose, onAddCoins }) {
  if (!isOpen) return null;
  return <GameModalContent gameId={gameId} onClose={onClose} onAddCoins={onAddCoins} />;
}
