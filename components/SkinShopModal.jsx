'use client';

import { useState, useEffect } from 'react';
import { getPlayerSkins, saveUnlockedSkin, getActiveSkin, setActiveSkin } from '../lib/skins';

export default function SkinShopModal({ isOpen, onClose, coins, onUpdateCoins }) {
  const [skins, setSkins] = useState([]);
  const [activeSkin, setActiveSkinState] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSkins(getPlayerSkins());
      setActiveSkinState(getActiveSkin());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuyOrEquip = (skin) => {
    if (skin.unlocked) {
      setActiveSkin(skin.id);
      setActiveSkinState(skin);
    } else {
      if (coins >= skin.price) {
        onUpdateCoins(-skin.price);
        saveUnlockedSkin(skin.id);
        setActiveSkin(skin.id);
        const updated = getPlayerSkins();
        setSkins(updated);
        setActiveSkinState(skin);
      } else {
        alert('Недостатньо монет! Проходьте гру Geometry Dash та збирайте монети.');
      }
    }
  };

  return (
    <div className="game-modal active">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-dialog shop-modal-dialog">
        <div className="modal-header">
          <div className="modal-title-box">
            <span className="modal-live-dot"></span>
            <h3>🎨 Магазин кастомізації куба (Geometry Dash)</h3>
          </div>
          <div className="user-wallet" title={`Ваш баланс: ${coins} QuackCoins`}>
            <span suppressHydrationWarning>🪙 {coins}</span>
          </div>
          <div className="modal-buttons">
            <button className="modal-btn close-btn" onClick={onClose} title="Закрити магазин (Escape)">
              ✖ Закрити
            </button>
          </div>
        </div>

        <div className="shop-content-body">
          <p className="shop-subtitle">
            Обирайте та розблоковуйте унікальні неонові скіни куба за зароблені в іграх монети QuackCoins:
          </p>

          <div className="skins-grid">
            {skins.map((skin) => {
              const isEquipped = activeSkin && activeSkin.id === skin.id;

              return (
                <div key={skin.id} className={`skin-card ${isEquipped ? 'equipped' : ''}`}>
                  <div
                    className="skin-cube-preview"
                    style={{
                      background: skin.primaryColor,
                      boxShadow: `0 0 16px ${skin.glowColor}`,
                      borderColor: skin.secondaryColor
                    }}
                  >
                    <div className="skin-inner-face" style={{ background: skin.secondaryColor }}></div>
                  </div>

                  <h4 className="skin-name">{skin.name}</h4>

                  <div className="skin-status">
                    {skin.unlocked ? (
                      <span className="unlocked-tag">Розблоковано</span>
                    ) : (
                      <span className="price-tag">🪙 {skin.price} монет</span>
                    )}
                  </div>

                  <button
                    className={`skin-action-btn ${isEquipped ? 'active-btn' : skin.unlocked ? 'equip-btn' : 'buy-btn'}`}
                    disabled={isEquipped || (!skin.unlocked && coins < skin.price)}
                    onClick={() => handleBuyOrEquip(skin)}
                  >
                    {isEquipped
                      ? '✓ Екіпіровано'
                      : skin.unlocked
                      ? 'Одягнути'
                      : coins >= skin.price
                      ? `Купити за ${skin.price} 🪙`
                      : 'Замало монет'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
