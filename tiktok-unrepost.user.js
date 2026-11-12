// ==UserScript==
// @name         TikTok Unrepost Bot Stable
// @namespace    http://tampermonkey.net/
// @version      11.8.0
// @description  TikTok unrepost script that actually works.
// @match        https://www.tiktok.com/*
// @grant        none
// @license      GPL-3.0-or-later
// @downloadURL  https://update.greasyfork.org/scripts/588508/TikTok%20Unrepost%20Bot%20Stable.user.js
// @updateURL    https://update.greasyfork.org/scripts/588508/TikTok%20Unrepost%20Bot%20Stable.meta.js
// ==/UserScript==

(function () {
    'use strict';

    // helper functions
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    function safeParseCount(rawVal) {
        const parsed = parseInt(rawVal || '0', 10);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }

    // guarenteed click
    function safeClick(element) {
        if (!element) return;
        try {
            const rect = (typeof element.getBoundingClientRect === 'function')
                ? element.getBoundingClientRect()
                : { left: 0, top: 0, width: 0, height: 0 };
            const clientX = rect.left + rect.width / 2 + (Math.random() * 4 - 2);
            const clientY = rect.top + rect.height / 2 + (Math.random() * 4 - 2);
            const eventOpts = {
                bubbles: true, cancelable: true, view: window,
                clientX, clientY, button: 0, buttons: 1, pointerType: 'mouse', isPrimary: true
            };

            try { element.dispatchEvent(new PointerEvent('pointerdown', eventOpts)); } catch (_) {}
            try { element.dispatchEvent(new MouseEvent('mousedown', eventOpts)); } catch (_) {}
            try { element.dispatchEvent(new PointerEvent('pointerup', { ...eventOpts, buttons: 0 })); } catch (_) {}
            try { element.dispatchEvent(new MouseEvent('mouseup', { ...eventOpts, buttons: 0 })); } catch (_) {}
        } catch (_) {}

        try {
            if (typeof element.click === 'function') element.click();
        } catch (_) {}
    }

    // hover simulation for ui
    function safeHover(element) {
        if (!element) return;
        try {
            const rect = (typeof element.getBoundingClientRect === 'function')
                ? element.getBoundingClientRect()
                : { left: 0, top: 0, width: 0, height: 0 };
            const clientX = rect.left + rect.width / 2 + (Math.random() * 4 - 2);
            const clientY = rect.top + rect.height / 2 + (Math.random() * 4 - 2);
            const hoverOpts = {
                bubbles: true, cancelable: true, view: window,
                clientX, clientY, pointerType: 'mouse', isPrimary: true
            };

            const targets = [element];
            if (element.parentElement && element.parentElement !== document.body) {
                targets.unshift(element.parentElement);
            }

            for (const t of targets) {
                try { t.dispatchEvent(new PointerEvent('pointerover', hoverOpts)); } catch (_) {}
                try { t.dispatchEvent(new PointerEvent('pointerenter', { ...hoverOpts, bubbles: false })); } catch (_) {}
                try { t.dispatchEvent(new MouseEvent('mouseover', hoverOpts)); } catch (_) {}
                try { t.dispatchEvent(new MouseEvent('mouseenter', { ...hoverOpts, bubbles: false })); } catch (_) {}
            }
            try { element.dispatchEvent(new PointerEvent('pointermove', hoverOpts)); } catch (_) {}
            try { element.dispatchEvent(new MouseEvent('mousemove', hoverOpts)); } catch (_) {}
            try { element.dispatchEvent(new FocusEvent('focusin', { bubbles: true, view: window })); } catch (_) {}
        } catch (_) {}
    }

    // unhover cleanup
    function safeUnhover(element) {
        if (!element) return;
        try {
            const leaveOpts = {
                bubbles: true, cancelable: true, view: window,
                clientX: 0, clientY: 0, pointerType: 'mouse', isPrimary: true
            };
            const targets = [element];
            if (element.parentElement && element.parentElement !== document.body) {
                targets.push(element.parentElement);
            }
            for (const t of targets) {
                try { t.dispatchEvent(new PointerEvent('pointerout', leaveOpts)); } catch (_) {}
                try { t.dispatchEvent(new PointerEvent('pointerleave', { ...leaveOpts, bubbles: false })); } catch (_) {}
                try { t.dispatchEvent(new MouseEvent('mouseout', leaveOpts)); } catch (_) {}
                try { t.dispatchEvent(new MouseEvent('mouseleave', { ...leaveOpts, bubbles: false })); } catch (_) {}
            }
            try { element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, view: window })); } catch (_) {}
        } catch (_) {}
    }

    // label / keyword match
    function isRemoveRepostLabel(rawText) {
        if (!rawText) return false;
        const text = rawText.toLowerCase().trim();
        const validLabels = [
            'remove repost', 'repost remove', 'eliminar repost', 'repost eliminar',
            'supprimer le repost', 'repost supprimer', 'supprimer la republication',
            'eliminar republicación', 'remover republicação', 'remover repost', 'repost remover',
            'repost entfernen', 'entfernen repost', 'rimuovi ripubblicazione', 'rimuovi repost',
            'usuń repost', 'repost usuń', 'repost sil', 'sil repost', 'repost verwijderen',
            'repost fjerne', 'ta bort repost', 'repost löschen',
            'удалить репост', 'отменить репост', 'убрать репост'
        ];
        if (validLabels.some(label => text.includes(label))) return true;

        const words = text.split(/[\s,.'"\-]+/);
        const removalKeywords = [
            'remove', 'eliminar', 'supprimer', 'remover', 'entfernen',
            'löschen', 'rimuovi', 'usuń', 'sil', 'verwijderen', 'fjerne',
            'удалить', 'отменить', 'убрать'
        ];
        const repostKeywords = [
            'repost', 'republication', 'republicación', 'republicação', 'ripubblicazione',
            'репост'
        ];
        return repostKeywords.some(rk => words.includes(rk)) && removalKeywords.some(kw => words.includes(kw));
    }

    // confirming a removed repost
    function hasUnrepostToast() {
        const toastCandidates = document.querySelectorAll(
            '[role="status"], [role="alert"], [data-e2e*="toast" i], [class*="Toast" i], [class*="TUXToast" i]'
        );
        const toastPhrases = [
            'repost removed', 'removed repost', 'repost eliminado', 'republication supprimée',
            'republicação removida', 'repost entfernt', 'repost rimosso', 'usunięto repost',
            'repost kaldırıldı', 'репост удален', 'репост удалён'
        ];
        for (const el of toastCandidates) {
            const t = (el.textContent || '').toLowerCase().trim();
            if (t && toastPhrases.some(phrase => t.includes(phrase))) {
                return true;
            }
        }
        return false;
    }

    function getActiveElement(selector, filterFn = null) {
        const elements = document.querySelectorAll(selector);
        const screenCenter = window.innerHeight / 2;
        let closestEl = null;
        let minDistance = Infinity;

        for (const el of elements) {
            if (el.closest('#tur-panel')) continue;
            if (filterFn && !filterFn(el)) continue;

            const rect = el.getBoundingClientRect();
            if (rect.height > 0 && rect.width > 0) {
                const style = window.getComputedStyle(el);
                if (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity) === 0) {
                    continue;
                }
                const centerY = rect.top + (rect.height / 2);
                const dist = Math.abs(centerY - screenCenter);
                if (dist < minDistance && rect.bottom > 0 && rect.top < window.innerHeight) {
                    minDistance = dist;
                    closestEl = el;
                }
            }
        }
        return closestEl;
    }

    // variable timeout
    async function waitForElement(getterFn, timeoutMs = 1800, intervalMs = 60) {
        const start = performance.now();
        while (performance.now() - start < timeoutMs) {
            if (!isRunning) return null;
            const el = getterFn();
            if (el) return el;
            await delay(intervalMs);
        }
        return null;
    }

    // distinguish photo carousel and regular video right button
    function isPhotoCarouselButton(el) {
        if (!el) return false;
        if (el.closest(
            '[data-e2e="photo-mode-container"], [data-e2e="browse-photo"], ' +
            '[class*="PhotoMode" i], [class*="Swiper" i], [class*="Carousel" i], [class*="ImageSwiper" i]'
        )) {
            return true;
        }
        const label = (el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
        if (/\b(photo|slide|image|picture)\b/.test(label)) {
            return true;
        }
        const e2e = (el.getAttribute('data-e2e') || '').toLowerCase();
        if (e2e.includes('photo') || e2e.includes('carousel') || e2e.includes('swiper')) {
            return true;
        }
        return false;
    }

    // identify photo/vid from post id
    function extractPostIdFromUrl(urlStr) {
        const match = urlStr.match(/\/(?:video|photo)\/(\d+)/);
        return match ? match[1] : '';
    }

    // better logic for photo/video
    function getCurrentPostSignature() {
        const url = window.location.href;
        const postId = extractPostIdFromUrl(url);
        const activeAuthor = getActiveElement('[data-e2e="browse-username"], [data-e2e="video-author-uniqueid"]');
        const authorText = activeAuthor ? activeAuthor.textContent.trim() : '';
        const activeDesc = getActiveElement('[data-e2e="browse-video-desc"], [data-e2e="video-desc"]');
        const descText = activeDesc ? activeDesc.textContent.trim().slice(0, 40) : '';

        // cont.
        const activePhotoContainer = getActiveElement(
            '[data-e2e="photo-mode-container"], [data-e2e="browse-photo"], [class*="PhotoMode" i]'
        );

        let mediaIdentity = '';
        const isPhotoUrl = url.includes('/photo/');
        if (activePhotoContainer || isPhotoUrl) {
            // anchor to the FIRST image in the container
            // inside the same photo carousel never mutates the post-level signature
            const firstImg = activePhotoContainer
                ? activePhotoContainer.querySelector('img[src], img[srcset]')
                : getActiveElement('img[src]');
            const stableImgSrc = firstImg ? (firstImg.getAttribute('src') || firstImg.currentSrc || '') : '';
            const imgCount = activePhotoContainer ? activePhotoContainer.querySelectorAll('img').length : 0;
            mediaIdentity = `photo:${postId || stableImgSrc}|slides:${imgCount}`;
        } else {
            const activeVid = getActiveElement('video', v => {
                const r = v.getBoundingClientRect();
                return r.width > 120 && r.height > 120;
            });
            const vidSrc = activeVid ? (activeVid.currentSrc || activeVid.src || '') : '';
            mediaIdentity = `video:${postId || vidSrc}`;
        }

        return `${url}|${mediaIdentity}|${authorText}|${descText}`;
    }

    // rate limits
    let currentBatchLimit = randomDelay(15, 25);
    const SCROLL_TIMEOUT = 4000;

    let isRunning = false;
    let isProcessingLoop = false;
    let totalCount = safeParseCount(localStorage.getItem('tur_processed_count'));
    let currentCount = 0;
    let skippedCount = 0;
    let batchCount = 0;

    // normalized storage
    try {
        localStorage.setItem('tur_processed_count', totalCount.toString());
    } catch (_) {}

    // --- rogue detection stuff
    let lastSignature = '';
    let stuckCount = 0;
    const STUCK_LIMIT = 3;

    // inject styles
    function injectStyles() {
        if (document.getElementById('tur-styles')) return;
        const style = document.createElement('style');
        style.id = 'tur-styles';
        style.textContent = `
            @keyframes turFadeIn {
                from { opacity: 0; transform: translateY(-15px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes turPulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(255, 71, 87, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
            }
            @keyframes turLogEntry {
                from { opacity: 0; transform: translateX(-8px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes turOverlayEntry {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            #tur-panel {
                position: fixed; top: 20px; right: 20px; z-index: 999999;
                background: rgba(22, 22, 22, 0.98); border: 1px solid #2a2a2a;
                border-radius: 10px; padding: 14px; color: #eaeaea;
                font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 13px; display: flex; flex-direction: column; gap: 10px; width: 270px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.8); box-sizing: border-box; overflow: hidden; user-select: none;
                animation: turFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .tur-header {
                display: flex; justify-content: space-between; align-items: center;
                border-bottom: 1px solid #333; padding-bottom: 8px; cursor: move;
            }
            .tur-btn {
                background: #222; color: #eaeaea; border: 1px solid #333;
                padding: 8px; border-radius: 6px; cursor: pointer; font-family: inherit;
                font-size: 12px; font-weight: 500; width: 100%;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .tur-btn:hover {
                background: #2f2f2f;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            }
            .tur-btn:active {
                transform: translateY(1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.4);
            }
            .tur-btn-primary {
                background: #fff; color: #000; border: none; font-weight: 600; font-size: 13px;
            }
            .tur-btn-primary:hover {
                background: #e5e5e5;
            }
            .tur-btn-active {
                background: #ff4757 !important; color: #fff !important;
                animation: turPulse 1.5s infinite cubic-bezier(0.66, 0, 0, 1);
            }
            .tur-badge {
                cursor: pointer; color: #888; font-weight: 600; font-size: 11px;
                background: #222; padding: 3px 6px; border-radius: 4px;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .tur-badge:hover {
                color: #fff;
                background: #333;
                transform: scale(1.05);
            }
            .tur-badge:active {
                transform: scale(0.95);
            }
            .tur-stats-grid {
                display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;
            }
            .tur-stat-card {
                background: #111; padding: 6px 8px; border-radius: 6px; border: 1px solid #222;
                display: flex; flex-direction: column; align-items: center; gap: 2px;
            }
            .tur-stat-label {
                color: #777; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px;
            }
            .tur-stat-val {
                color: #fff; font-weight: 600; font-size: 13px;
            }
            #tur-log-box {
                height: 110px; background: #0a0a0a; border: 1px solid #222;
                border-radius: 6px; padding: 8px; overflow-y: auto;
                font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
                font-size: 11px; display: flex; flex-direction: column; gap: 4px;
                user-select: text;
                scroll-behavior: smooth;
            }
            #tur-log-box div {
                animation: turLogEntry 0.3s ease-out forwards;
            }
            #tur-tutorial-overlay[style*="display: flex"] {
                animation: turOverlayEntry 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
        `;
        document.head.appendChild(style);
    }

    function log(msg, type = 'info') {
        const logBox = document.getElementById('tur-log-box');
        if (!logBox) return;

        const time = new Date().toLocaleTimeString([], { hour12: false });
        const entry = document.createElement('div');
        entry.style.color = type === 'error' ? '#ff5c5c' : type === 'warn' ? '#f5a623' : type === 'success' ? '#2ed573' : '#a0a0a0';
        entry.textContent = `[${time}] ${msg}`;

        logBox.appendChild(entry);

        while (logBox.children.length > 50) {
            logBox.removeChild(logBox.firstChild);
        }
        logBox.scrollTop = logBox.scrollHeight;
    }

    function updateStatsUI() {
        const totalEl = document.getElementById('tur-count');
        const currentEl = document.getElementById('tur-current-count');
        const skippedEl = document.getElementById('tur-skipped-count');
        if (totalEl) totalEl.innerText = totalCount;
        if (currentEl) currentEl.innerText = currentCount;
        if (skippedEl) skippedEl.innerText = skippedCount;
    }

    function recordUnrepost() {
        totalCount = safeParseCount(totalCount) + 1;
        currentCount++;
        batchCount++;
        try {
            localStorage.setItem('tur_processed_count', totalCount.toString());
        } catch (_) {}
        updateStatsUI();
        log(`Successful unrepost #${totalCount}`, 'success');
    }

    //confirms unrepost is genuine
    async function verifyUnrepostSuccess(mode, triggerEl, shareIcon = null, openedViaHover = false) {
        const startPostSig = getCurrentPostSignature();
        const timeoutMs = 2200;
        const intervalMs = 80;
        const start = performance.now();

        while (performance.now() - start < timeoutMs) {
            if (!isRunning) return false;

            // 1. Toast confirmation
            if (hasUnrepostToast()) return true;

            // 2. Auto-advance check
            if (getCurrentPostSignature() !== startPostSig) return true;

            if (mode === 'old-ui') {
                const currentOldBtn = getActiveElement('a[data-e2e="video-share-repost"]');
                // Button disappeared or its aria-label flipped from "Remove repost" -> "Repost"
                if (!currentOldBtn) return true;
                const updatedLabel = currentOldBtn.getAttribute('aria-label') || '';
                if (updatedLabel && !isRemoveRepostLabel(updatedLabel)) return true;
            } else if (mode === 'share-menu') {
                const currentShareBtn = getShareRepostButton();
                if (currentShareBtn) {
                    const updatedText = currentShareBtn.textContent || currentShareBtn.getAttribute('aria-label') || '';
                    // Still open, and label flipped from "Remove repost" -> "Repost"
                    if (updatedText && !isRemoveRepostLabel(updatedText)) return true;
                } else {
                    // Share popover auto-closed after clicking "Remove repost". Re-probe once to confirm state flipped.
                    await delay(220);
                    if (hasUnrepostToast() || getCurrentPostSignature() !== startPostSig) return true;

                    if (shareIcon && document.body.contains(shareIcon)) {
                        let reopenedViaHover = false;
                        safeHover(shareIcon);
                        let verifyBtn = await waitForElement(getShareRepostButton, 400, 50);
                        if (verifyBtn) {
                            reopenedViaHover = true;
                        } else {
                            safeClick(shareIcon);
                            verifyBtn = await waitForElement(getShareRepostButton, 800, 60);
                        }
                        if (verifyBtn) {
                            const checkText = verifyBtn.textContent || verifyBtn.getAttribute('aria-label') || '';
                            const succeeded = Boolean(checkText) && !isRemoveRepostLabel(checkText);
                            await closeShareMenu(shareIcon, reopenedViaHover);
                            return succeeded;
                        }
                    }
                    return false;
                }
            }
            await delay(intervalMs);
        }
        return false;
    }

    function createUI() {
        if (document.getElementById('tur-panel')) return;
        injectStyles();

        const panel = document.createElement('div');
        panel.id = 'tur-panel';

        panel.innerHTML = `
            <div class="tur-header" id="tur-drag-handle">
                <span style="font-weight: 600; font-size: 13px; color: #fff;">Unrepost Bot v11.8.0</span>
                <div style="display: flex; gap: 6px;">
                    <span id="tur-min-btn" class="tur-badge">—</span>
                    <span id="tur-open-tut" class="tur-badge">HELP</span>
                </div>
            </div>

            <div id="tur-body" style="display: flex; flex-direction: column; gap: 10px;">
                <button id="tur-unhide-btn" class="tur-btn">Unhide Reposts Tab</button>

                <div class="tur-stats-grid">
                    <div class="tur-stat-card">
                        <span class="tur-stat-label">Current</span>
                        <span id="tur-current-count" class="tur-stat-val">${currentCount}</span>
                    </div>
                    <div class="tur-stat-card">
                        <span class="tur-stat-label">Skipped</span>
                        <span id="tur-skipped-count" class="tur-stat-val">${skippedCount}</span>
                    </div>
                    <div class="tur-stat-card">
                        <span class="tur-stat-label">All-Time</span>
                        <span id="tur-count" class="tur-stat-val">${totalCount}</span>
                    </div>
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
                <div style="font-size: 11px; line-height: 1.5; color: #bbb;">
                    <b>1.</b> Navigate to your profile page, and open the Reposts tab.<br><br>
                    <b>2.</b> Click <b>Unhide Reposts Tab</b> if the tab is hidden by TikTok.<br><br>
                    <b>3.</b> Wait for videos to load. Open the <b>FIRST</b> video in the grid so it occupies the screen.<br><br>
                    <b>4.</b> If you only see a blank black page, go to your For You page and manually repost a video to refresh TikTok's cache. Also try enabling a VPN.<br><br>
                    <b>5.</b> Click <b>Start Auto-Unrepost</b>.<br><br>
                    <span style="color: #f5a623;"><b>WARNING:</b> Using this script poses a shadowban risk. Keep this tab focused and avoid touching your keyboard or interacting with TikTok while running. PLEASE report any issues to my Discord: @dprits2</span>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        document.getElementById('tur-unhide-btn').addEventListener('click', unhideRepostsOnly);
        document.getElementById('tur-toggle-btn').addEventListener('click', toggleScript);
        document.getElementById('tur-open-tut').addEventListener('click', () => {
            document.getElementById('tur-tutorial-overlay').style.display = 'flex';
        });
        document.getElementById('tur-close-tut').addEventListener('click', () => {
            document.getElementById('tur-tutorial-overlay').style.display = 'none';
        });

        const bodyEl = document.getElementById('tur-body');
        document.getElementById('tur-min-btn').addEventListener('click', (e) => {
            const isHidden = bodyEl.style.display === 'none';
            bodyEl.style.display = isHidden ? 'flex' : 'none';
            e.target.textContent = isHidden ? '—' : '┼';
        });

        makeDraggable(panel, document.getElementById('tur-drag-handle'));
        log('Discord: @dprits2. Ready.');
    }

    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let activeDragController = null;

        handle.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('tur-badge')) return;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;

            const rect = element.getBoundingClientRect();
            element.style.left = rect.left + 'px';
            element.style.top = rect.top + 'px';
            element.style.right = 'auto';

            activeDragController = new AbortController();

            document.addEventListener('mousemove', (e) => {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;

                const maxLeft = Math.max(0, window.innerWidth - element.offsetWidth);
                const maxTop = Math.max(0, window.innerHeight - element.offsetHeight);
                const newLeft = Math.min(Math.max(0, element.offsetLeft - pos1), maxLeft);
                const newTop = Math.min(Math.max(0, element.offsetTop - pos2), maxTop);

                element.style.left = newLeft + 'px';
                element.style.top = newTop + 'px';
            }, { signal: activeDragController.signal });

            document.addEventListener('mouseup', () => {
                if (activeDragController) {
                    activeDragController.abort();
                    activeDragController = null;
                }
            }, { signal: activeDragController.signal });
        });
    }

    //repost tab bring back logic
    function isInsideTabNavigation(el) {
        if (!el || el.closest('#tur-panel')) return false;
        if (el.getAttribute('data-e2e') === 'repost-tab' || el.getAttribute('role') === 'tab') return true;
        if (el.closest('[role="tablist"], [data-e2e="user-post-item-list-tab"], [class*="VideoFeedTab" i], [class*="UserTab" i], [class*="TabBar" i]')) {
            return true;
        }
        // fallback
        const parent = el.parentElement;
        const grandParent = parent ? parent.parentElement : null;
        if (grandParent) {
            const siblingTabMatch = grandParent.querySelector(
                '[data-e2e="videos-tab"], [data-e2e="liked-tab"], [data-e2e="favorites-tab"], [role="tab"]'
            );
            if (siblingTabMatch) return true;
        }
        return false;
    }

    function unhideRepostsOnly() {
        const candidates = document.querySelectorAll(
            '[data-e2e="repost-tab"], [role="tab"], [aria-label*="-tab"], [role="tablist"] span, [role="tablist"] p, div > span, div > p'
        );
        const tabKeywords = ['reposts', 'repost', 'republications', 'republicaciones', 'republicações', 'ripubblicazioni', 'репосты'];
        let found = 0;

        candidates.forEach(el => {
            if (!isInsideTabNavigation(el)) return;
            const text = el.textContent.trim().toLowerCase();
            const isE2ERepost = el.getAttribute('data-e2e') === 'repost-tab';
            if (isE2ERepost || tabKeywords.includes(text)) {
                el.style.setProperty('display', 'flex', 'important');
                el.style.setProperty('visibility', 'visible', 'important');
                el.removeAttribute('hidden');
                const tabWrapper = el.closest('[role="tab"], [data-e2e="repost-tab"]') || el.parentElement;
                if (tabWrapper && tabWrapper !== document.body && !tabWrapper.matches('[role="tablist"]')) {
                    tabWrapper.style.setProperty('display', 'flex', 'important');
                    tabWrapper.style.setProperty('visibility', 'visible', 'important');
                    tabWrapper.removeAttribute('hidden');
                }
                found++;
            }
        });
        log(found > 0 ? 'Unhid Reposts tab.' : 'Reposts tab not found on profile tab bar.', found > 0 ? 'success' : 'warn');
    }

    // Safely closes ONLY the Share popover/dialog without clicking top-level nav icons or the fullscreen player close button
    async function closeShareMenu(shareIcon, openedViaHover = false) {
        const shareBtn = getShareRepostButton();
        const sharePopoverRoot = shareBtn
            ? shareBtn.closest('[role="dialog"], [data-radix-popper-content-wrapper], [class*="Share" i], [class*="Popover" i]')
            : null;
        let safeCloseBtn = null;

        if (sharePopoverRoot) {
            safeCloseBtn = sharePopoverRoot.querySelector(
                'button[aria-label="close" i]:not([data-e2e="browse-close"]), ' +
                '.TUXNavBarIconButton:not([data-e2e="browse-close"])'
            );
        } else {
            // Fallback strictly inside an open dialog that is NOT the main video browse modal
            const dialogs = document.querySelectorAll('[role="dialog"]');
            for (const dlg of dialogs) {
                if (dlg.querySelector('[data-e2e="browse-video"], [data-e2e="browse-close"]')) continue;
                const btn = dlg.querySelector('button[aria-label="close" i], .TUXNavBarIconButton');
                if (btn) {
                    safeCloseBtn = btn;
                    break;
                }
            }
        }

        if (safeCloseBtn) {
            safeClick(safeCloseBtn);
        } else if (openedViaHover && shareIcon) {
            safeUnhover(shareIcon);
            document.body.dispatchEvent(new PointerEvent('pointermove', {
                bubbles: true, cancelable: true, view: window, clientX: 5, clientY: 5
            }));
        } else {
            // Escape key cleanly dismisses
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true
            }));
            await delay(120);
            if (getShareRepostButton() && shareIcon) {
                safeUnhover(shareIcon);
                // outside-click dismissal logic, somehow well implemented LOL
                const neutralSpot = document.getElementById('tur-drag-handle');
                if (neutralSpot) safeClick(neutralSpot);
            }
        }
        await delay(randomDelay(250, 400));
    }

    // Locates the Repost action inside the Share popup
    function getShareRepostButton() {
        return getActiveElement('[data-e2e="share-repost"]') ||
               document.querySelector('[role="dialog"] [data-e2e="share-repost"]') ||
               document.querySelector('[data-e2e="share-repost"]');
    }

    // finds the feed-level Next Post button while excluding horizontal photo-carousel arrows
    function getNextPostButton() {
        const notCarousel = el => !isPhotoCarouselButton(el);
        return getActiveElement('button[data-e2e="arrow-right"]', notCarousel) ||
               getActiveElement('[data-e2e="arrow-right"]', notCarousel) ||
               getActiveElement('button[data-e2e="arrow-down"]', notCarousel) ||
               getActiveElement('button[aria-label*="Next video" i]', notCarousel) ||
               getActiveElement('button[aria-label*="Next post" i]', notCarousel) ||
               getActiveElement(
                   'button[aria-label*="Next" i]:not([data-e2e="browse-close"])',
                   el => notCarousel(el) && !/\b(photo|slide|image|page)\b/i.test(el.getAttribute('aria-label') || '')
               );
    }

    function sendArrowDown() {
        const nextBtn = getNextPostButton();
        if (nextBtn && !nextBtn.disabled && nextBtn.getAttribute('aria-disabled') !== 'true') {
            safeClick(nextBtn);
            return true;
        }

        log('Next-post button unavailable; trying fallback...', 'warn');

        // 1. Vertical WheelEvent simulation on active media container (vertical deltaY only advances feed, never horizontal photo swiper)
        const scrollTarget = getActiveElement('[data-e2e="browse-video"]') ||
                             getActiveElement('[data-e2e="photo-mode-container"]') ||
                             getActiveElement('[data-e2e="browse-photo"]') ||
                             getActiveElement('video') ||
                             document.scrollingElement ||
                             document.body;

        if (scrollTarget) {
            try {
                const rect = scrollTarget.getBoundingClientRect();
                scrollTarget.dispatchEvent(new WheelEvent('wheel', {
                    deltaX: 0,
                    deltaY: 650,
                    deltaMode: 0,
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2,
                    bubbles: true,
                    cancelable: true,
                    view: window
                }));
            } catch (_) {}
        }

        // 2. Vertical scrollable feed container advance (ignores horizontal overflow-x photo carousels)
        try {
            let scroller = scrollTarget ? scrollTarget.parentElement : null;
            let scrolledContainer = false;
            while (scroller && scroller !== document.body && scroller !== document.documentElement) {
                const style = window.getComputedStyle(scroller);
                if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && scroller.scrollHeight > scroller.clientHeight + 50) {
                    scroller.scrollBy({ top: window.innerHeight * 0.85, left: 0, behavior: 'smooth' });
                    scrolledContainer = true;
                    break;
                }
                scroller = scroller.parentElement;
            }
            if (!scrolledContainer && document.documentElement.scrollHeight > window.innerHeight + 50) {
                window.scrollBy({ top: window.innerHeight * 0.85, left: 0, behavior: 'smooth' });
            }
        } catch (_) {}

        // 3. Original ArrowDown KeyboardEvent fallback preserved (ArrowDown moves vertically between posts, unlike ArrowRight)
        const target = document.activeElement || document.body;
        target.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, bubbles: true, cancelable: true
        }));
        return false;
    }

    async function ensureScroll() {
        const startSig = getCurrentPostSignature();
        sendArrowDown();

        let elapsed = 0;
        const hasMoved = () => getCurrentPostSignature() !== startSig;

        while (!hasMoved() && elapsed < SCROLL_TIMEOUT) {
            if (!isRunning) return false;
            await delay(100);
            elapsed += 100;
        }

        if (!hasMoved() && isRunning) {
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
            lastSignature = '';
            stuckCount = 0;
            btn.innerText = 'Stop Auto-Unrepost';
            btn.classList.add('tur-btn-active');
            log('Bot started.');

            if (!isProcessingLoop) {
                processLoop();
            }
        } else {
            btn.innerText = 'Start Auto-Unrepost';
            btn.classList.remove('tur-btn-active');
            log('Bot stopped.', 'warn');
        }
    }

    async function processLoop() {
        if (isProcessingLoop) return;
        isProcessingLoop = true;

        try {
            while (isRunning) {
                const currentSig = getCurrentPostSignature();

                if (currentSig === lastSignature) {
                    stuckCount++;
                    if (stuckCount >= STUCK_LIMIT) {
                        log('Reached end of feed or stuck on same post. Stopping bot.', 'error');
                        isRunning = false;
                        break;
                    }
                } else {
                    stuckCount = 0;
                    lastSignature = currentSig;
                }

                if (batchCount >= currentBatchLimit) {
                    const breakTimeSeconds = randomDelay(10, 15);
                    log(`Rate-limit prevention: Sleeping ${breakTimeSeconds}s...`, 'warn');

                    for (let i = breakTimeSeconds; i > 0; i--) {
                        if (!isRunning) break;
                        if (i % 5 === 0 || i <= 3) log(`Resuming in ${i}s...`, 'info');
                        await delay(1000);
                    }

                    batchCount = 0;
                    currentBatchLimit = randomDelay(15, 25);
                }

                if (!isRunning) break;

                await delay(randomDelay(1500, 2200));

                // --- 1. OLD UI CHECK ---
                const oldRepostBtn = getActiveElement('a[data-e2e="video-share-repost"]');

                if (oldRepostBtn) {
                    const ariaLabel = oldRepostBtn.getAttribute('aria-label') || '';

                    if (isRemoveRepostLabel(ariaLabel)) {
                        safeClick(oldRepostBtn);
                        const verified = await verifyUnrepostSuccess('old-ui', oldRepostBtn);
                        if (verified) {
                            recordUnrepost();
                        } else {
                            log('Removed repost, but state change was not confirmed.', 'warn');
                        }
                        await delay(randomDelay(900, 1500));
                    } else {
                        skippedCount++;
                        updateStatsUI();
                        log('Post not reposted. Skipping.');
                    }
                } else {
                    // NEWU UI LOGIC
                    const shareIcon = getActiveElement('div[data-e2e="share-icon"]') ||
                                      getActiveElement('button[data-e2e="share-icon"]') ||
                                      getActiveElement('[data-e2e="browse-share-icon"]');

                    if (shareIcon) {
                        let openedViaHover = false;

                        // Step A
                        safeHover(shareIcon);
                        let shareMenuRepostBtn = await waitForElement(getShareRepostButton, 350, 50);

                        if (shareMenuRepostBtn) {
                            openedViaHover = true;
                        } else if (isRunning) {
                            // Step B: fallback
                            safeUnhover(shareIcon);
                            safeClick(shareIcon);
                            shareMenuRepostBtn = await waitForElement(getShareRepostButton, 1500, 60);
                        }

                        if (!isRunning) break;

                        if (shareMenuRepostBtn) {
                            const btnText = shareMenuRepostBtn.textContent || shareMenuRepostBtn.getAttribute('aria-label') || '';

                            if (isRemoveRepostLabel(btnText)) {
                                safeClick(shareMenuRepostBtn);
                                const verified = await verifyUnrepostSuccess('share-menu', shareMenuRepostBtn, shareIcon, openedViaHover);
                                if (openedViaHover) safeUnhover(shareIcon);
                                if (verified) {
                                    recordUnrepost();
                                } else {
                                    log('Clicked remove repost, but state change was not confirmed.', 'warn');
                                    await closeShareMenu(shareIcon, openedViaHover);
                                }
                                await delay(randomDelay(900, 1500));
                            } else {
                                skippedCount++;
                                updateStatsUI();
                                log('Post not reposted by you. Skipping.');
                                await closeShareMenu(shareIcon, openedViaHover);
                            }
                        } else {
                            log('Repost option missing from Share menu.', 'warn');
                            await closeShareMenu(shareIcon, openedViaHover);
                        }
                    } else {
                        log('Share icon missing from DOM.', 'warn');
                    }
                }

                if (!isRunning) break;

                await ensureScroll();
                await delay(randomDelay(400, 750));
            }
        } catch (err) {
            log(`Unexpected error: ${err.message}`, 'error');
            isRunning = false;
        } finally {
            isProcessingLoop = false;
            const btn = document.getElementById('tur-toggle-btn');
            if (btn && !isRunning) {
                btn.innerText = 'Start Auto-Unrepost';
                btn.classList.remove('tur-btn-active');
            }
        }
    }

    function initObserver() {
        if (document.body && !document.getElementById('tur-panel')) {
            createUI();
        }
        const uiObserver = new MutationObserver(() => {
            if (!document.getElementById('tur-panel') && document.body) {
                createUI();
            }
        });
        if (document.body) {
            uiObserver.observe(document.body, { childList: true, subtree: false });
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                if (document.body && !document.getElementById('tur-panel')) {
                    createUI();
                }
                if (document.body) {
                    uiObserver.observe(document.body, { childList: true, subtree: false });
                }
            });
        }
    }

    initObserver();
})();
