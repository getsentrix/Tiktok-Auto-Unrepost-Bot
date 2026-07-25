// ==UserScript==
// @name         TikTok Unrepost Bot (Stable)
// @namespace    http://tampermonkey.net/
// @version      10.1
// @description  TikTok unrepost script that actually works.
// @author       Dylan
// @match        https://www.tiktok.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // --- HELPER FUNCTIONS MUST BE DEFINED FIRST ---
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // --- RATE LIMITS ---
    let currentBatchLimit = randomDelay(5, 9);
    const SCROLL_TIMEOUT = 4000;

    let isRunning = false;
    let count = 0;
    let batchCount = 0;

    // --- ROGUE DETECTION VARIABLES ---
    let lastUrl = '';
    let stuckCount = 0;
    const STUCK_LIMIT = 3;

    function log(msg, type = 'info') {
        const logBox = document.getElementById('tur-log-box');
        if (!logBox) return;

        const time = new Date().toLocaleTimeString().split(' ')[0];
        const entry = document.createElement('div');
        entry.style.color = type === 'error' ? '#ff5c5c' : type === 'warn' ? '#f5a623' : '#a0a0a0';
        entry.textContent = `[${time}] ${msg}`;

        logBox.appendChild(entry);
        logBox.scrollTop = logBox.scrollHeight;
    }

    function createUI() {
        if (document.getElementById('tur-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'tur-panel';
        panel.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 999999;
            background: rgba(18, 18, 18, 0.95); border: 1px solid #2a2a2a;
            border-radius: 10px; padding: 16px; color: #eaeaea;
            font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 13px; display: flex; flex-direction: column; gap: 12px; width: 260px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5); backdrop-filter: blur(10px);
            box-sizing: border-box; overflow: hidden;
        `;

        panel.innerHTML = `
            <!-- MAIN UI -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 8px;">
                <span style="font-weight: 500; font-size: 14px; color: #fff;">Unrepost Stable</span>
                <span id="tur-open-tut" style="cursor: pointer; color: #888; font-weight: 600; font-size: 11px; background: #222; padding: 4px 8px; border-radius: 4px;">HELP</span>
            </div>

            <button id="tur-unhide-btn" style="
                background: #222; color: #eaeaea; border: 1px solid #333;
                padding: 10px; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 500; width: 100%; transition: 0.2s;
            ">Unhide Reposts Tab</button>

            <div style="background: #111; padding: 8px 12px; border-radius: 6px; border: 1px solid #222; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #888; font-size: 12px;">Processed</span>
                <span id="tur-count" style="color: #fff; font-weight: 600; font-size: 14px;">0</span>
            </div>

            <button id="tur-toggle-btn" style="
                background: #fff; color: #000; border: none;
                padding: 10px; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; width: 100%; transition: 0.2s;
            ">Start Auto-Unrepost</button>

            <div id="tur-log-box" style="
                height: 120px; background: #0a0a0a; border: 1px solid #222;
                border-radius: 6px; padding: 8px; overflow-y: auto;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; display: flex; flex-direction: column; gap: 4px;
            "></div>

            <!-- TUTORIAL OVERLAY (HIDDEN BY DEFAULT) -->
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

        // Event Listeners
        document.getElementById('tur-unhide-btn').addEventListener('click', unhideRepostsOnly);
        document.getElementById('tur-toggle-btn').addEventListener('click', toggleScript);

        // Tutorial Overlay Toggles
        document.getElementById('tur-open-tut').addEventListener('click', () => {
            document.getElementById('tur-tutorial-overlay').style.display = 'flex';
        });
        document.getElementById('tur-close-tut').addEventListener('click', () => {
            document.getElementById('tur-tutorial-overlay').style.display = 'none';
        });

        log('Discord: @dprits2. UI loaded & ready.');
    }

    function unhideRepostsOnly() {
        const candidates = document.querySelectorAll('[role="tab"], [aria-label*="-tab"], div > span, div > p, div');
        candidates.forEach(el => {
            const text = el.textContent.trim().toLowerCase();
            if (text === 'reposts' || text === 'repost') {
                el.style.setProperty('display', 'flex', 'important');
                if (el.parentElement) el.parentElement.style.setProperty('display', 'flex', 'important');
            }
        });
        log('Forced Reposts tab visible.');
    }

    function sendArrowDown() {
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
        }
        document.body.focus();

        const eventInit = { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, bubbles: true, cancelable: true, composed: true };
        document.body.dispatchEvent(new KeyboardEvent('keydown', eventInit));
        document.body.dispatchEvent(new KeyboardEvent('keyup', eventInit));
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

        if (window.location.href === startUrl) {
            log('Scroll stuck. Forcing...', 'warn');
            sendArrowDown();
            await delay(1500);
        }
        return true;
    }

    function toggleScript() {
        isRunning = !isRunning;
        const btn = document.getElementById('tur-toggle-btn');
        if (isRunning) {
            // --- RESET ROGUE COUNTERS ON MANUAL START ---
            lastUrl = '';
            stuckCount = 0;

            btn.innerText = 'Stop';
            btn.style.background = '#333';
            btn.style.color = '#fff';
            log('Bot started!');
            processLoop();
        } else {
            btn.innerText = 'Start Auto-Unrepost';
            btn.style.background = '#fff';
            btn.style.color = '#000';
            log('Bot stopped.', 'warn');
        }
    }

    async function processLoop() {
        if (!isRunning) return;

        // --- ROGUE DETECTION LOGIC ---
        const currentUrl = window.location.href;
        if (currentUrl === lastUrl) {
            stuckCount++;
            if (stuckCount >= STUCK_LIMIT) {
                log('Rogue Activity: Stuck on same video. Script killed.', 'error');
                isRunning = false;
                const btn = document.getElementById('tur-toggle-btn');
                btn.innerText = 'Start Auto-Unrepost';
                btn.style.background = '#fff';
                btn.style.color = '#000';
                return; // Break the loop completely
            }
        } else {
            stuckCount = 0;
            lastUrl = currentUrl;
        }

        // --- BATCH CHECK ---
        if (batchCount >= currentBatchLimit) {
            const breakTime = randomDelay(30000, 45000);
            log(`Anti rate limit. Sleeping ${Math.round(breakTime/1000)}s...`, 'warn');
            await delay(breakTime);

            batchCount = 0;
            currentBatchLimit = randomDelay(5, 9);
        }

        // Wait for UI to fetch and render the buttons
        await delay(randomDelay(4500, 6500));

        // Using HTML selector provided
        const repostBtn = document.querySelector('a[data-e2e="video-share-repost"]');

        if (repostBtn) {
            const ariaLabel = repostBtn.getAttribute('aria-label');

            // Check if it's currently in the 'reposted' state
            if (ariaLabel && ariaLabel.toLowerCase() === 'remove repost') {
                repostBtn.click();
                log('Successful load, button pressed.');
                count++;
                batchCount++;
                document.getElementById('tur-count').innerText = count;

                await delay(randomDelay(4000, 6000));
            } else {
                log('Not reposted. Skipping.');
            }
        } else {
            log('Repost button missing from DOM. Report to Discord dprits2.', 'error');
        }

        await ensureScroll();
        await delay(randomDelay(1500, 2500));

        if (isRunning) processLoop();
    }

    const observer = new MutationObserver(() => {
        if (!document.getElementById('tur-panel') && document.body) createUI();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

})();
