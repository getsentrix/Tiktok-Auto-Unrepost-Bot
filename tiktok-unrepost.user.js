// ==UserScript==
// @name         TikTok Unrepost Bot Stable
// @namespace    http://tampermonkey.net/
// @version      11.2
// @description  TikTok unrepost script that actually works.
// @author       Dylan
// @match        https://www.tiktok.com/*
// @grant        none
// @license      GPL-3.0-or-later
// ==/UserScript==

(function () {
    'use strict';

    // --- HELPER FUNCTIONS ---
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // --- AGGRESSIVE RATE LIMITS ---
    let currentBatchLimit = randomDelay(15, 25);
    const SCROLL_TIMEOUT = 4000;

    let isRunning = false;
    let isProcessingLoop = false;
    let count = parseInt(localStorage.getItem('tur_processed_count') || '0', 10);
    let batchCount = 0;

    // --- ROGUE DETECTION ---
    let lastUrl = '';
    let stuckCount = 0;
    const STUCK_LIMIT = 3;

    // --- INJECT CUSTOM STYLES ---
    function injectStyles() {
        if (document.getElementById('tur-styles')) return;
        const style = document.createElement('style');
        style.id = 'tur-styles';
        style.textContent = `
            #tur-panel {
                position: fixed; top: 20px; right: 20px; z-index: 999999;
                background: rgba(18, 18, 18, 0.95); border: 1px solid #2a2a2a;
                border-radius: 10px; padding: 14px; color: #eaeaea;
                font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 13px; display: flex; flex-direction: column; gap: 10px; width: 270px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.6); backdrop-filter: blur(10px);
                box-sizing: border-box; overflow: hidden; user-select: none;
            }
            .tur-header {
                display: flex; justify-content: space-between; align-items: center;
                border-bottom: 1px solid #333; padding-bottom: 8px; cursor: move;
            }
            .tur-btn {
                background: #222; color: #eaeaea; border: 1px solid #333;
                padding: 8px; border-radius: 6px; cursor: pointer; font-family: inherit;
                font-size: 12px; font-weight: 500; width: 100%; transition: 0.2s;
            }
            .tur-btn:hover { background: #2f2f2f; }
            .tur-btn-primary {
                background: #fff; color: #000; border: none; font-weight: 600; font-size: 13px;
            }
            .tur-btn-primary:hover { background: #e5e5e5; }
            .tur-btn-active {
                background: #ff4757 !important; color: #fff !important;
            }
            .tur-badge {
                cursor: pointer; color: #888; font-weight: 600; font-size: 11px;
                background: #222; padding: 3px 6px; border-radius: 4px;
            }
            .tur-badge:hover { color: #fff; background: #333; }
            #tur-log-box {
                height: 110px; background: #0a0a0a; border: 1px solid #222;
                border-radius: 6px; padding: 8px; overflow-y: auto;
                font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
                font-size: 11px; display: flex; flex-direction: column; gap: 4px;
                user-select: text;
            }
        `;
        document.head.appendChild(style);
    }

    function log(msg, type = 'info') {
        const logBox = document.getElementById('tur-log-box');
        if (!logBox) return;

        const time = new Date().toLocaleTimeString().split(' ')[0];
        const entry = document.createElement('div');
        entry.style.color = type === 'error' ? '#ff5c5c' : type === 'warn' ? '#f5a623' : '#a0a0a0';
        entry.textContent = `[${time}] ${msg}`;

        logBox.appendChild(entry);

        // Keep DOM lightweight (max 50 log items)
        while (logBox.children.length > 50) {
            logBox.removeChild(logBox.firstChild);
        }

        logBox.scrollTop = logBox.scrollHeight;
    }

    function createUI() {
        if (document.getElementById('tur-panel')) return;
        injectStyles();

        const panel = document.createElement('div');
        panel.id = 'tur-panel';

        panel.innerHTML = `
            <div class="tur-header" id="tur-drag-handle">
                <span style="font-weight: 600; font-size: 13px; color: #fff;">Unrepost Bot v11.2 (Stable)</span>
                <div style="display: flex; gap: 6px;">
                    <span id="tur-min-btn" class="tur-badge">—</span>
                    <span id="tur-open-tut" class="tur-badge">HELP</span>
                </div>
            </div>

            <div id="tur-body" style="display: flex; flex-direction: column; gap: 10px;">
                <button id="tur-unhide-btn" class="tur-btn">Unhide Reposts Tab</button>

                <div style="background: #111; padding: 8px 12px; border-radius: 6px; border: 1px solid #222; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #888; font-size: 12px;">Processed Total</span>
                    <span id="tur-count" style="color: #fff; font-weight: 600; font-size: 14px;">${count}</span>
                </div>

                <button id="tur-toggle-btn" class="tur-btn tur-btn-primary">Start Auto-Unrepost</button>

                <div id="tur-log-box"></div>
            </div>

            <!-- TUTORIAL OVERLAY -->
            <div id="tur-tutorial-overlay" style="
                display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(18, 18, 18, 0.98); padding: 16px; box-sizing: border-box;
                z-index: 10; flex-direction: column; overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 12px;">
                    <span style="font-weight: 500; font-size: 14px; color: #fff;">How To Use</span>
                    <span id="tur-close-tut" style="cursor: pointer; color: #ff5c5c; font-weight: bold; font-size: 14px;">✕</span>
                </div>
                <div style="font-size: 12px; line-height: 1.6; color: #bbb;">
                    <b>1.</b> Navigate to your profile page.<br><br>
                    <b>2.</b> Click <b>Unhide Reposts Tab</b> if the tab is hidden by TikTok.<br><br>
                    <b>3.</b> Wait for videos to load. Open the <b>FIRST</b> video in the grid so it occupies the screen.<br><br>
                    <b>4.</b> If you only see a blank black page, go to your For You page and manually repost a video to refresh TikTok's cache.<br><br>
                    <b>5.</b> Click <b>Start Auto-Unrepost</b>.<br><br>
                    <span style="color: #f5a623;"><b>WARNING:</b> Avoid touching your keyboard or interacting with TikTok while running. The script relies on precise delays to bypass rate limits.</span>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Bind Events
        document.getElementById('tur-unhide-btn').addEventListener('click', unhideRepostsOnly);
        document.getElementById('tur-toggle-btn').addEventListener('click', toggleScript);
        document.getElementById('tur-open-tut').addEventListener('click', () => {
            document.getElementById('tur-tutorial-overlay').style.display = 'flex';
        });
        document.getElementById('tur-close-tut').addEventListener('click', () => {
            document.getElementById('tur-tutorial-overlay').style.display = 'none';
        });

        // Minimize Toggle
        const bodyEl = document.getElementById('tur-body');
        document.getElementById('tur-min-btn').addEventListener('click', (e) => {
            const isHidden = bodyEl.style.display === 'none';
            bodyEl.style.display = isHidden ? 'flex' : 'none';
            e.target.textContent = isHidden ? '—' : '┼';
        });

        // Make Panel Draggable
        makeDraggable(panel, document.getElementById('tur-drag-handle'));

        log('Discord: @dprits2. Ready.');
    }

    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.right = 'auto'; // Disable right lock
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function unhideRepostsOnly() {
        const candidates = document.querySelectorAll('[role="tab"], [aria-label*="-tab"], div > span, div > p');
        let found = 0;
        candidates.forEach(el => {
            const text = el.textContent.trim().toLowerCase();
            if (text === 'reposts' || text === 'repost') {
                el.style.setProperty('display', 'flex', 'important');
                if (el.parentElement) el.parentElement.style.setProperty('display', 'flex', 'important');
                found++;
            }
        });
        log(found > 0 ? 'Unhid Reposts tab.' : 'Reposts tab not found.', found > 0 ? 'info' : 'warn');
    }

    function sendArrowDown() {
        const nextBtn = document.querySelector('button[data-e2e="arrow-right"]');
        if (nextBtn) {
            nextBtn.click();
        } else {
            log('Next video button missing from DOM. Scroll failed.', 'error');
            isRunning = false; // Kill the loop if navigation is broken to prevent endless hangs
        }
    }

    async function ensureScroll() {
        const startUrl = window.location.href;
        sendArrowDown();

        let elapsed = 0;
        while (window.location.href === startUrl && elapsed < SCROLL_TIMEOUT) {
            if (!isRunning) return false;
            await delay(100);
            elapsed += 100;
        }

        if (window.location.href === startUrl && isRunning) {
            log('Scroll delayed. Retrying...', 'warn');
            sendArrowDown();
            await delay(1200);
        }
        return true;
    }

    function toggleScript() {
        isRunning = !isRunning;
        const btn = document.getElementById('tur-toggle-btn');

        if (isRunning) {
            lastUrl = '';
            stuckCount = 0;
            btn.innerText = 'Stop Auto-Unrepost';
            btn.classList.add('tur-btn-active');
            log('Bot execution started.');

            if (!isProcessingLoop) {
                processLoop();
            }
        } else {
            btn.innerText = 'Start Auto-Unrepost';
            btn.classList.remove('tur-btn-active');
            log('Bot stopped by user.', 'warn');
        }
    }

    async function processLoop() {
        isProcessingLoop = true;

        while (isRunning) {
            // --- ROGUE DETECTION LOGIC ---
            const currentUrl = window.location.href;
            if (currentUrl === lastUrl) {
                stuckCount++;
                if (stuckCount >= STUCK_LIMIT) {
                    log('Stuck on same video. Halting bot.', 'error');
                    toggleScript();
                    break;
                }
            } else {
                stuckCount = 0;
                lastUrl = currentUrl;
            }

            // --- ANTI-RATE LIMIT BATCH CHECK ---
            if (batchCount >= currentBatchLimit) {
                const breakTimeSeconds = randomDelay(10, 15);
                log(`Rate-limit prevention: Sleeping ${breakTimeSeconds}s...`, 'warn');

                for (let i = breakTimeSeconds; i > 0; i--) {
                    if (!isRunning) break;
                    if (i % 5 === 0 || i <= 3) log(`Resuming in ${i}s...`, 'info');
                    await delay(1000);
                }

                batchCount = 0;
                currentBatchLimit = randomDelay(15, 25); // Bug fixed here
            }

            if (!isRunning) break;

            // DOM UI Render Delay
            await delay(randomDelay(2000, 3000));

            // STRICT Selectors for Unrepost Button
            const repostBtn = document.querySelector('a[data-e2e="video-share-repost"]');

            if (repostBtn) {
                const ariaLabel = (repostBtn.getAttribute('aria-label') || '').toLowerCase();

                if (ariaLabel === 'remove repost') {
                    repostBtn.click();
                    count++;
                    batchCount++;

                    localStorage.setItem('tur_processed_count', count.toString());
                    document.getElementById('tur-count').innerText = count;

                    log(`Unreposted video #${count}`);
                    await delay(randomDelay(1500, 2500));
                } else {
                    log('Video not reposted. Skipping.');
                }
            } else {
                log('Repost button missing from DOM.', 'warn');
            }

            if (!isRunning) break;

            await ensureScroll();
            await delay(randomDelay(500, 1000));
        }

        isProcessingLoop = false;

        // Failsafe to reset UI state if the loop breaks internally
        const btn = document.getElementById('tur-toggle-btn');
        if (btn && !isRunning) {
            btn.innerText = 'Start Auto-Unrepost';
            btn.classList.remove('tur-btn-active');
        }
    }

    // Lightweight UI Injection Check
    setInterval(() => {
        if (!document.getElementById('tur-panel') && document.body) {
            createUI();
        }
    }, 2000);

})();
