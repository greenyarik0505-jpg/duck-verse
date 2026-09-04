class QuackClickerGame {
    constructor(container, onAddCoins) {
        this.container = container;
        this.onAddCoins = onAddCoins;
        this.quacks = 0;
        this.quacksPerSec = 0;
        this.clickPower = 1;
        this.timer = null;

        this.upgrades = [
            { id: 'feeder', name: 'Авто-Крякер', cost: 15, qps: 1, count: 0, icon: '🤖' },
            { id: 'bread', name: 'Кибер-Хлеб', cost: 50, clickPower: 2, count: 0, icon: '🍞' },
            { id: 'pond', name: 'Квантовый Пруд', cost: 200, qps: 8, count: 0, icon: '🌊' },
            { id: 'mecha', name: 'Меха-Утка Дрон', cost: 800, qps: 35, count: 0, icon: '⚡' },
            { id: 'portal', name: 'Мультиверс Портал', cost: 2500, qps: 150, count: 0, icon: '🌀' }
        ];
    }

    start() {
        this.render();
        this.timer = setInterval(() => {
            if (this.quacksPerSec > 0) {
                const add = this.quacksPerSec / 10;
                this.quacks += add;
                if (Math.random() < 0.15 && this.onAddCoins) {
                    this.onAddCoins(1);
                }
                this.updateCounters();
            }
        }, 100);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    clickDuck(e) {
        this.quacks += this.clickPower;
        if (window.sound) window.sound.quack();
        if (this.onAddCoins) this.onAddCoins(1);

        // Spawn floating text
        const rect = e.currentTarget.getBoundingClientRect();
        const floatX = e.clientX - rect.left;
        const floatY = e.clientY - rect.top;

        this.spawnFloatingText('+' + this.clickPower, floatX, floatY);
        this.updateCounters();

        // Squish animation
        const duckEl = document.getElementById('big-duck-btn');
        if (duckEl) {
            duckEl.classList.remove('squish');
            void duckEl.offsetWidth;
            duckEl.classList.add('squish');
        }
    }

    spawnFloatingText(text, x, y) {
        const wrap = document.getElementById('duck-click-zone');
        if (!wrap) return;
        const span = document.createElement('span');
        span.className = 'floating-score';
        span.innerText = text;
        span.style.left = x + 'px';
        span.style.top = y + 'px';
        wrap.appendChild(span);
        setTimeout(() => span.remove(), 800);
    }

    buyUpgrade(idx) {
        const u = this.upgrades[idx];
        if (this.quacks >= u.cost) {
            this.quacks -= u.cost;
            u.count++;
            u.cost = Math.floor(u.cost * 1.35);

            if (u.qps) this.quacksPerSec += u.qps;
            if (u.clickPower) this.clickPower += u.clickPower;

            if (window.sound) window.sound.coin();
            this.render();
        }
    }

    updateCounters() {
        const qEl = document.getElementById('total-quacks');
        const qpsEl = document.getElementById('quacks-per-sec');
        if (qEl) qEl.innerText = Math.floor(this.quacks);
        if (qpsEl) qpsEl.innerText = this.quacksPerSec + '/сек';

        this.upgrades.forEach((u, i) => {
            const btn = document.getElementById('upg-btn-' + i);
            if (btn) {
                btn.disabled = this.quacks < u.cost;
                if (this.quacks < u.cost) {
                    btn.classList.add('disabled');
                } else {
                    btn.classList.remove('disabled');
                }
            }
        });
    }

    render() {
        let upgradesHtml = '';
        this.upgrades.forEach((u, i) => {
            const desc = u.qps ? ('+' + u.qps + ' кряк/сек') : ('+' + u.clickPower + ' к клику');
            const disabledClass = this.quacks < u.cost ? 'disabled' : '';
            upgradesHtml += `
                <button id="upg-btn-${i}" class="upgrade-card ${disabledClass}" onclick="window.activeClicker.buyUpgrade(${i})">
                    <span class="upg-icon">${u.icon}</span>
                    <div class="upg-info">
                        <div class="upg-name">${u.name} <span class="upg-count">(${u.count})</span></div>
                        <div class="upg-desc">${desc}</div>
                    </div>
                    <div class="upg-cost">🪙 ${u.cost}</div>
                </button>
            `;
        });

        this.container.innerHTML = `
            <div class="clicker-layout">
                <div class="clicker-main">
                    <div class="clicker-stats">
                        <div class="big-stat"><span id="total-quacks">${Math.floor(this.quacks)}</span> 🦆</div>
                        <div class="sub-stat">Кряков в секунду: <span id="quacks-per-sec">${this.quacksPerSec}/сек</span></div>
                        <div class="sub-stat">Сила клика: +${this.clickPower}</div>
                    </div>
                    
                    <div id="duck-click-zone" class="duck-click-zone">
                        <button id="big-duck-btn" class="big-duck-button">
                            <div class="duck-graphic">
                                <div class="duck-head">
                                    <div class="duck-visor"></div>
                                    <div class="duck-beak"></div>
                                </div>
                                <div class="duck-body-shape"></div>
                            </div>
                        </button>
                    </div>
                </div>

                <div class="clicker-shop">
                    <h3>⚡ Мультиверс Апгрейды</h3>
                    <div class="upgrade-list">
                        ${upgradesHtml}
                    </div>
                </div>
            </div>
        `;

        window.activeClicker = this;

        const duckBtn = document.getElementById('big-duck-btn');
        if (duckBtn) {
            duckBtn.addEventListener('click', (e) => this.clickDuck(e));
        }
    }
}

window.QuackClickerGame = QuackClickerGame;
