// ==UserScript==
// @name         Better Snapchat Web (Native iPhone 13 & Safari Mobile Experience)
// @namespace    https://antigravity.google.com/
// @version      6.1.0
// @description  Pixel-perfect native phone layout for iPhone 13 Safari: full dvh responsive height, native iOS header with centered ghost, single-line inline chat status & streaks, edge-to-edge media in chat bubbles, centered stories, permanent bottom bar, modal overlays (New Chat & Add Friends), and mobile redirect blocker bypass.
// @author       Dylan & Antigravity
// @match        https://*.snapchat.com/*
// @match        https://snapchat.com/*
// @match        https://web.snapchat.com/*
// @match        https://www.snapchat.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=snapchat.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  /* ==========================================================================
     0. Early Redirect Interception & Mobile Blocker Bypass
     ========================================================================== */
  (function handleEarlyRedirects() {
    const loc = window.location;
    // Intercept redirect to /download or root splash page on snapchat.com
    if (loc.hostname === 'www.snapchat.com' || loc.hostname === 'snapchat.com' || loc.hostname === 'web.snapchat.com') {
      if (loc.pathname.startsWith('/download') || loc.pathname === '/' || loc.pathname === '') {
        loc.replace('https://www.snapchat.com/web');
        return;
      }
    }

    // Intercept client-side pushState / replaceState redirects targeting /download
    try {
      const origPush = history.pushState;
      const origReplace = history.replaceState;
      history.pushState = function(state, title, url) {
        if (url && typeof url === 'string' && (url.includes('/download') || url === 'https://www.snapchat.com/')) {
          return origReplace.apply(this, [state, title, '/web']);
        }
        return origPush.apply(this, arguments);
      };
      history.replaceState = function(state, title, url) {
        if (url && typeof url === 'string' && (url.includes('/download') || url === 'https://www.snapchat.com/')) {
          return origReplace.apply(this, [state, title, '/web']);
        }
        return origReplace.apply(this, arguments);
      };
    } catch (e) {}
  })();

  /* ==========================================================================
     1. Mobile Safari UA & Platform Shim (Bypasses Snapchat's iPad/Mobile Detector)
     ========================================================================== */
  (function spoofDesktopOnMobile() {
    const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15';
    try {
      Object.defineProperty(navigator, 'userAgent', { get: () => DESKTOP_UA, configurable: true });
      Object.defineProperty(navigator, 'appVersion', { get: () => DESKTOP_UA, configurable: true });
      Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel', configurable: true });
      Object.defineProperty(navigator, 'vendor', { get: () => 'Apple Computer, Inc.', configurable: true });
      // Crucial: Snapchat checks "MacIntel"===platform && maxTouchPoints > 2 to detect iPads/mobile and redirect to /download.
      // Returning 1 preserves touch event capability while blocking the mobile redirect trigger!
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 1, configurable: true });
      Object.defineProperty(navigator, 'msMaxTouchPoints', { get: () => 0, configurable: true });
    } catch (e) {}
  })();

  /* ==========================================================================
     2. Viewport Meta Configuration (Edge-to-Edge Safe Area & Zero Auto-Zoom)
     ========================================================================== */
  function injectMeta() {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      (document.head || document.documentElement).appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
  }
  injectMeta();

  /* ==========================================================================
     3. Native Phone UI Stylesheet (Pixel-Perfect iPhone 13 Safari Layout)
     ========================================================================== */
  const OVERHAUL_CSS = `
  /* --- A. ROOT DESIGN TOKENS & RESET --- */
  :root {
    color-scheme: dark !important;
    --snap-yellow: #fffc00;
    --snap-yellow-glow: rgba(255, 252, 0, 0.35);
    --phone-width: 440px;
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    --header-height: 54px;
    --bar-height: 58px;
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-bg: rgba(14, 14, 18, 0.96);
    --sys-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  html, body {
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    overscroll-behavior: none !important;
    overscroll-behavior-y: none !important;
    position: fixed !important;
    background: #060609 !important;
    font-family: var(--sys-font) !important;
    -webkit-font-smoothing: antialiased !important;
    -webkit-text-size-adjust: 100% !important;
    touch-action: manipulation !important;
  }

  main#root {
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  /* Prevent iOS Safari from auto-zooming on input focus (requires >= 16px font) */
  input,
  textarea,
  [contenteditable="true"],
  div[role="textbox"] {
    font-size: 16px !important;
  }

  /* Global scrollbar suppression for native mobile feel */
  * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  *::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }

  /* Remove all desktop promo banners, telemetry & bloat */
  main#root > div:first-child > div:nth-child(1),
  main#root > div:first-child > div:nth-child(2) > div:nth-child(2),
  button[title="Open Spotlight"],
  [aria-label="Spotlight"],
  #adBlockTestId,
  img._HpJ5,
  img[src*="images.bitmoji.com/3d/background"],
  div.S4e9r > img._HpJ5,
  div.S4e9r img[src*="3d/background"],
  ._HpJ5 {
    display: none !important;
  }

  /* Centered Stage Wrapper (Desktop centers cleanly; Mobile iPhone spans 100vw) */
  main#root > div:first-child {
    display: flex !important;
    justify-content: center !important;
    align-items: stretch !important;
    height: 100vh !important;
    height: 100dvh !important;
    width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
    background: radial-gradient(circle at 50% 50%, #0e0e14 0%, #060609 100%) !important;
    overflow: hidden !important;
    position: relative !important;
  }

  /* --------------------------------------------------------------------------
     MODE 1: CHATS LIST VIEW
     -------------------------------------------------------------------------- */
  body[data-so-mode="chats"] main#root > div:first-child > div:nth-child(2),
  body:not([data-so-mode]) main#root > div:first-child > div:nth-child(2) {
    display: flex !important;
    flex-direction: column !important;
    width: 100vw !important;
    max-width: 100vw !important;
    min-width: 0 !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    margin: 0 auto !important;
    background: #0a0a0f !important;
    overflow: hidden !important;
    position: relative !important;
    box-sizing: border-box !important;
    padding-bottom: calc(var(--bar-height) + var(--safe-bottom)) !important;
  }

  @media (min-width: 481px) {
    body[data-so-mode="chats"] main#root > div:first-child > div:nth-child(2),
    body:not([data-so-mode]) main#root > div:first-child > div:nth-child(2) {
      width: var(--phone-width) !important;
      border-left: 1px solid var(--glass-border) !important;
      border-right: 1px solid var(--glass-border) !important;
      box-shadow: 0 0 60px rgba(0, 0, 0, 0.85) !important;
    }
  }

  /* In Chats mode, hide main child 3 UNLESS it contains active modals (.LtQF8) */
  body[data-so-mode="chats"] main#root > div:first-child > div:nth-child(3):not(:has(.LtQF8)),
  body:not([data-so-mode]) main#root > div:first-child > div:nth-child(3):not(:has(.LtQF8)) {
    display: none !important;
  }

  /* --------------------------------------------------------------------------
     MODALS OVERLAY (NEW CHAT & ADD FRIENDS FIX)
     -------------------------------------------------------------------------- */
  body[data-so-mode="chats"] main#root > div:first-child > div:nth-child(3):has(.LtQF8),
  body:not([data-so-mode]) main#root > div:first-child > div:nth-child(3):has(.LtQF8),
  body.so-has-modal main#root > div:first-child > div:nth-child(3) {
    display: block !important;
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    z-index: 1000000 !important;
    background: transparent !important;
    pointer-events: auto !important;
  }

  /* Hide regular right pane contents when modal is open */
  main#root > div:first-child > div:nth-child(3):has(.LtQF8) > div._XMCw > div:not(.LtQF8),
  body.so-has-modal main#root > div:first-child > div:nth-child(3) > div._XMCw > div:not(.LtQF8) {
    display: none !important;
  }

  /* Full Screen Backdrop for Modals */
  div.LtQF8 {
    display: flex !important;
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    z-index: 1000001 !important;
    background: rgba(0, 0, 0, 0.75) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    padding: 12px !important;
    pointer-events: auto !important;
  }

  /* Modal Cards: New Chat (.sjdIo) and Add Friends (.zYgGl) */
  div.LtQF8 > div,
  div.sjdIo,
  div.zYgGl {
    width: 100% !important;
    max-width: 420px !important;
    height: auto !important;
    max-height: 82dvh !important;
    background: #14141a !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 24px !important;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.9) !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  /* Modal inner scroll containers */
  div.sjdIo form.c9yiB,
  div.sjdIo form,
  div.zYgGl > div {
    width: 100% !important;
    max-height: 82dvh !important;
    display: flex !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  /* --------------------------------------------------------------------------
     MODE 2: CAMERA VIEW
     -------------------------------------------------------------------------- */
  body[data-so-mode="camera"] main#root > div:first-child > div:nth-child(2) {
    display: none !important;
  }

  body[data-so-mode="camera"] main#root > div:first-child > div:nth-child(3) {
    display: flex !important;
    flex-direction: column !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    margin: 0 auto !important;
    background: #000000 !important;
    overflow: hidden !important;
    position: relative !important;
    box-sizing: border-box !important;
    padding-bottom: calc(var(--bar-height) + var(--safe-bottom)) !important;
  }

  @media (min-width: 481px) {
    body[data-so-mode="camera"] main#root > div:first-child > div:nth-child(3) {
      width: var(--phone-width) !important;
      border-left: 1px solid var(--glass-border) !important;
      border-right: 1px solid var(--glass-border) !important;
      box-shadow: 0 0 60px rgba(0, 0, 0, 0.85) !important;
    }
  }

  /* Suppress desktop stories drawer inside camera */
  div.DexGI,
  [class*="DexGI"] {
    display: none !important;
  }

  /* --------------------------------------------------------------------------
     MODE 3: ACTIVE CHAT CONVERSATION VIEW (100% Solid Height, Zero Cutoffs)
     -------------------------------------------------------------------------- */
  body[data-so-mode="chat"] main#root > div:first-child > div:nth-child(2) {
    display: none !important;
  }

  body[data-so-mode="chat"] main#root > div:first-child > div:nth-child(3) {
    display: flex !important;
    flex-direction: column !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    margin: 0 auto !important;
    background: #09090d !important;
    overflow: hidden !important;
    position: relative !important;
    box-sizing: border-box !important;
    padding-bottom: 0 !important;
  }

  @media (min-width: 481px) {
    body[data-so-mode="chat"] main#root > div:first-child > div:nth-child(3) {
      width: var(--phone-width) !important;
      border-left: 1px solid var(--glass-border) !important;
      border-right: 1px solid var(--glass-border) !important;
      box-shadow: 0 0 60px rgba(0, 0, 0, 0.85) !important;
    }
  }

  /* Intermediate Flex Containers inside Chat Column */
  main#root > div:first-child > div:nth-child(3) > div:has(div[role="presentation"]),
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] {
    display: flex !important;
    flex-direction: column !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  /* Conversation Top Header with Safe Area Inset */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:first-child {
    height: auto !important;
    min-height: calc(var(--header-height) + var(--safe-top)) !important;
    padding-top: max(8px, var(--safe-top)) !important;
    padding-bottom: 8px !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
    box-sizing: border-box !important;
    background: rgba(14, 14, 18, 0.96) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border-bottom: 1px solid var(--glass-border) !important;
    display: flex !important;
    align-items: center !important;
    z-index: 100 !important;
    flex: 0 0 auto !important;
  }

  /* Clean Custom Back Arrow */
  .so-custom-back-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 36px !important;
    height: 36px !important;
    margin-right: 10px !important;
    border-radius: 50% !important;
    border: 1px solid var(--glass-border) !important;
    background: rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
    cursor: pointer !important;
    flex-shrink: 0 !important;
    transition: background 0.15s ease, transform 0.15s ease !important;
  }

  .so-custom-back-btn:hover,
  .so-custom-back-btn:active {
    background: rgba(255, 255, 255, 0.18) !important;
    transform: scale(1.06) !important;
  }

  .so-custom-back-btn + .so-custom-back-btn,
  button[title="Close Chat"] + .so-custom-back-btn,
  .so-custom-back-btn + button[title="Close Chat"] {
    display: none !important;
  }

  /* Conversation Body: fills remaining dynamic height */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) {
    height: calc(100dvh - var(--header-height) - var(--safe-top)) !important;
    max-height: calc(100dvh - var(--header-height) - var(--safe-top)) !important;
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  /* Message Scroller */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:first-child {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
  }

  /* Remove wide desktop gray boxes beside photos/snaps */
  div.KB4Aq:has(img),
  div.KB4Aq:has(video),
  [class*="KB4Aq"]:has(img),
  [class*="KB4Aq"]:has(video) {
    width: fit-content !important;
    max-width: 85% !important;
    background: transparent !important;
  }

  div.KB4Aq:has(img) > div.p8r1z,
  div.KB4Aq:has(video) > div.p8r1z,
  [class*="KB4Aq"]:has(img) > div[class*="p8r1z"],
  [class*="KB4Aq"]:has(video) > div[class*="p8r1z"] {
    width: fit-content !important;
    max-width: 100% !important;
  }

  /* Message Composer Dock: Clean Full-Width Floating Dock */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) {
    flex: 0 0 auto !important;
    min-height: 50px !important;
    margin: 6px 12px max(10px, var(--safe-bottom)) 12px !important;
    padding: 4px 8px !important;
    background: rgba(22, 22, 28, 0.96) !important;
    backdrop-filter: blur(24px) !important;
    -webkit-backdrop-filter: blur(24px) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 26px !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: center !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
    z-index: 50 !important;
  }

  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) > div:first-child {
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
  }

  /* Textbox container */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) div[class*="shMO3"],
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) div:has(> div > div[role="textbox"]) {
    flex: 1 1 auto !important;
    width: auto !important;
    min-width: 0 !important;
    display: flex !important;
    align-items: center !important;
  }

  /* Inner textbox pill */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) div[class*="fCmUn"],
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) div:has(> div[role="textbox"]) {
    width: 100% !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 4px !important;
    position: relative !important;
    display: flex !important;
    align-items: center !important;
  }

  /* Text input itself (16px to prevent iOS auto-zoom) */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) div[role="textbox"],
  div[role="textbox"][contenteditable="true"] {
    width: 100% !important;
    background: transparent !important;
    border: none !important;
    padding: 6px 36px 6px 6px !important;
    box-sizing: border-box !important;
    font-size: 16px !important;
    color: #f5f5f7 !important;
    outline: none !important;
    caret-color: var(--snap-yellow) !important;
  }

  /* Send Message Button inside Textbox Pill */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button.IHV_t,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) .fCmUn > button,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button[class*="IHV_t"],
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button[class*="v4zfr"] {
    display: inline-flex !important;
    position: absolute !important;
    right: 4px !important;
    top: 50% !important;
    bottom: auto !important;
    inset-inline-end: 4px !important;
    inset-block-end: auto !important;
    transform: translateY(-50%) !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    border-radius: 50% !important;
    background: #0fadff !important;
    color: #ffffff !important;
    border: none !important;
    box-shadow: 0 2px 6px rgba(15, 173, 255, 0.45) !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    z-index: 5 !important;
    opacity: 1 !important;
    transition: all 0.15s ease !important;
  }

  /* Action buttons inside composer */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button:not(.IHV_t):not(.v4zfr):not([class*="IHV_t"]):not([class*="v4zfr"]) {
    width: 34px !important;
    height: 34px !important;
    min-width: 34px !important;
    border-radius: 50% !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: rgba(255, 255, 255, 0.08) !important;
    border: none !important;
    color: #ffffff !important;
    cursor: pointer !important;
    flex-shrink: 0 !important;
    padding: 0 !important;
    transition: all 0.15s ease !important;
  }

  /* --------------------------------------------------------------------------
     MODE 4: STORY VIEWER (FULL-BLEED 9:16 FRAME, ZERO RIGHT-EDGE GLITCHES)
     -------------------------------------------------------------------------- */
  body[data-so-mode="story"] main#root > div:first-child > div:nth-child(2) {
    display: none !important;
  }

  body[data-so-mode="story"] main#root > div:first-child > div:nth-child(3) {
    display: flex !important;
    flex-direction: column !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    margin: 0 auto !important;
    background: #000000 !important;
    overflow: hidden !important;
    position: relative !important;
    box-sizing: border-box !important;
    padding-bottom: 0 !important;
  }

  @media (min-width: 481px) {
    body[data-so-mode="story"] main#root > div:first-child > div:nth-child(3) {
      width: var(--phone-width) !important;
      border-left: 1px solid var(--glass-border) !important;
      border-right: 1px solid var(--glass-border) !important;
      box-shadow: 0 0 60px rgba(0, 0, 0, 0.85) !important;
    }
  }

  /* Story player grid container */
  main#root > div:first-child > div:nth-child(3) > div:has(div.S4e9r),
  div._XMCw:has(div.S4e9r) {
    display: grid !important;
    grid-template: "main secondary" 1fr / 1fr 0fr !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    width: 100% !important;
    background: #000000 !important;
    overflow: hidden !important;
  }

  div.S4e9r {
    grid-area: main !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    width: 100% !important;
    max-width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    position: relative !important;
    background: #000000 !important;
    overflow: hidden !important;
  }

  div.ecBYF {
    position: relative !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    width: 100% !important;
    max-width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    padding: 8px 0 calc(var(--bar-height) + var(--safe-bottom) + 8px) 0 !important;
    box-sizing: border-box !important;
    background: #000000 !important;
    overflow: hidden !important;
  }

  /* Story Top Header */
  div.eox9R {
    flex: 0 0 48px !important;
    height: 48px !important;
    padding-top: var(--safe-top) !important;
    z-index: 100 !important;
    display: flex !important;
    align-items: center !important;
  }

  /* Hide clumsy floating desktop close button on right */
  button.hRnph,
  button:has(svg path[d*="m9.103 6.971"]) {
    display: none !important;
  }

  /* Top-right native story close button */
  button.h9IpV {
    z-index: 1000 !important;
  }

  /* Story card frame */
  div.vDdE2 {
    height: 100% !important;
    max-height: calc(100dvh - 120px) !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 18px !important;
    overflow: hidden !important;
    background: #000000 !important;
  }

  div.vDdE2 img,
  div.vDdE2 video,
  div.S4e9r img.ChG6a {
    max-width: 100% !important;
    max-height: calc(100dvh - 120px) !important;
    width: auto !important;
    height: auto !important;
    object-fit: contain !important;
    border-radius: 18px !important;
    margin: 0 auto !important;
  }

  /* Reply input docked cleanly above bottom bar */
  div.ejVI4,
  div:has(> input[placeholder*="Reply to"]),
  input[placeholder*="Reply to"] {
    z-index: 50 !important;
    margin-bottom: calc(var(--bar-height) + var(--safe-bottom) + 6px) !important;
    max-width: calc(100% - 24px) !important;
    box-sizing: border-box !important;
  }

  /* --------------------------------------------------------------------------
     5. FEED LIST & TOP HEADER NATIVE PHONE ALIGNMENT (SAFARI MOBILE FIXES)
     -------------------------------------------------------------------------- */
  /* Top Chats Header: flush-left profile avatar, centered ghost logo, flush-right New Chat */
  main#root > div:first-child > div:nth-child(2) > div:nth-child(1) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    height: auto !important;
    min-height: calc(var(--header-height) + var(--safe-top)) !important;
    padding: max(8px, var(--safe-top)) 14px 8px 14px !important;
    border-bottom: 1px solid var(--glass-border) !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    background: rgba(10, 10, 15, 0.96) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    z-index: 100 !important;
    overflow: visible !important;
  }

  main#root > div:first-child > div:nth-child(2) > div:nth-child(1) > div.AbUJt {
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    position: relative !important;
    padding: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }

  /* Center Snapchat Ghost Icon */
  div.JM4Qm,
  .JM4Qm {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    position: absolute !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    height: 100% !important;
  }

  /* Right Action Cluster (Friend Requests + New Chat) */
  div.toJ1p {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    margin-left: auto !important;
  }

  div.KcY9t,
  .KcY9t {
    display: flex !important;
    align-items: center !important;
  }

  div.KcY9t button,
  button.kwuI_ {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 36px !important;
    height: 36px !important;
    border-radius: 50% !important;
    background: rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
    border: none !important;
  }

  div.LsbRg,
  .LsbRg {
    position: static !important;
    inset-inline-end: auto !important;
    display: flex !important;
    align-items: center !important;
  }

  div.LsbRg button,
  button.n6VkK {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 36px !important;
    height: 36px !important;
    border-radius: 50% !important;
    background: #0fadff !important;
    color: #ffffff !important;
    border: none !important;
    box-shadow: 0 2px 8px rgba(15, 173, 255, 0.4) !important;
  }

  /* Search Bar & My AI */
  .yC1EG,
  div.yC1EG {
    display: flex !important;
    width: 100% !important;
    box-sizing: border-box !important;
    padding: 6px 12px !important;
    flex: 0 0 auto !important;
  }

  /* Navigation & Scroll Container */
  nav.deg2K,
  main#root > div:first-child > div:nth-child(2) > nav {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    height: auto !important;
    box-sizing: border-box !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  /* Friend Feed Row Card */
  nav div[role="list"][aria-label="Friends Feed"] div[role="listitem"] > div[role="button"] {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 12px !important;
    padding: 0 12px !important;
    margin: 1px 6px !important;
    width: calc(100% - 12px) !important;
    height: calc(100% - 2px) !important;
    box-sizing: border-box !important;
    border-radius: 14px !important;
    background: rgba(255, 255, 255, 0.02) !important;
    border: 1px solid rgba(255, 255, 255, 0.04) !important;
    transition: background 0.15s ease !important;
  }

  nav div[role="list"][aria-label="Friends Feed"] div[role="listitem"] > div[role="button"]:active {
    background: rgba(255, 255, 255, 0.08) !important;
  }

  /* Column 1: Bitmoji Avatar */
  nav div[role="list"][aria-label="Friends Feed"] div[role="listitem"] > div[role="button"] > div:nth-child(1),
  .LNwMF {
    flex: 0 0 52px !important;
    width: 52px !important;
    min-width: 52px !important;
    max-width: 52px !important;
    margin: 0 !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Column 2: Friend Details (Name + Status Row) */
  nav div[role="list"][aria-label="Friends Feed"] div[role="listitem"] > div[role="button"] > div:nth-child(2),
  .BbZFb {
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: flex-start !important;
    text-align: left !important;
    flex: 1 1 0% !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    opacity: 1 !important;
    visibility: visible !important;
    overflow: hidden !important;
  }

  /* Friend Name */
  .mYSR9,
  [id^="title-"] {
    width: 100% !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    text-align: left !important;
    line-height: 1.25 !important;
  }

  /* Status Line: Snap status icon + status text + timestamp + streak ALL IN 1 LINE */
  .PWxCe,
  div.BbZFb > div.PWxCe,
  nav div[role="list"][aria-label="Friends Feed"] div.PWxCe {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 5px !important;
    width: 100% !important;
    min-width: 0 !important;
    margin-top: 3px !important;
  }

  .ovUsZ,
  div.PWxCe > div.ovUsZ,
  nav div[role="list"][aria-label="Friends Feed"] div.ovUsZ {
    display: inline-flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 4px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    font-size: 12.5px !important;
    color: rgba(255, 255, 255, 0.6) !important;
    line-height: 1.2 !important;
  }

  .nmvCS,
  div.PWxCe > div.nmvCS {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
  }

  /* Column 3: Camera / Snap Quick Action */
  nav div[role="list"][aria-label="Friends Feed"] div[role="listitem"] > div[role="button"] > div:nth-child(3),
  .w15C2 {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
    margin-left: auto !important;
    color: rgba(255, 255, 255, 0.85) !important;
  }

  /* Suppress clumsy 'Reply' text label under camera icon */
  .fU6FK,
  [class*="fU6FK"],
  div.lpTst > div:nth-child(2) {
    display: none !important;
  }

  div.lpTst {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* --------------------------------------------------------------------------
     6. PERMANENT PHONE BOTTOM NAVIGATION BAR (FLUID SAFARI BOTTOM DOCK)
     -------------------------------------------------------------------------- */
  #so-phone-bar {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    transform: none !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: calc(var(--bar-height) + var(--safe-bottom)) !important;
    padding-bottom: var(--safe-bottom) !important;
    background: rgba(14, 14, 18, 0.96) !important;
    backdrop-filter: blur(24px) !important;
    -webkit-backdrop-filter: blur(24px) !important;
    border-top: 1px solid var(--glass-border) !important;
    display: flex !important;
    justify-content: space-around !important;
    align-items: center !important;
    z-index: 999999 !important;
    box-sizing: border-box !important;
    padding-left: 20px !important;
    padding-right: 20px !important;
  }

  @media (min-width: 481px) {
    #so-phone-bar {
      left: 50% !important;
      right: auto !important;
      transform: translateX(-50%) !important;
      width: var(--phone-width) !important;
      border-left: 1px solid var(--glass-border) !important;
      border-right: 1px solid var(--glass-border) !important;
    }
  }

  /* Bar visibility control */
  body[data-so-mode="chats"] #so-phone-bar,
  body[data-so-mode="camera"] #so-phone-bar,
  body[data-so-mode="story"] #so-phone-bar,
  body:not([data-so-mode]) #so-phone-bar {
    display: flex !important;
  }

  body[data-so-mode="chat"] #so-phone-bar,
  body:has(main#root > div:first-child > div:nth-child(3) div[role="presentation"]) #so-phone-bar,
  body:has(div[role="textbox"][placeholder="Send a chat"]) #so-phone-bar {
    display: none !important;
  }

  .so-nav-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.45);
    cursor: pointer;
    padding: 6px 28px;
    border-radius: 16px;
    transition: color 0.15s ease, transform 0.15s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .so-nav-tab:hover,
  .so-nav-tab:active {
    color: rgba(255, 255, 255, 0.85);
  }

  .so-nav-tab.active {
    color: #ffffff;
  }

  .so-nav-tab.active svg {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.4));
  }

  .so-nav-tab .so-nav-label {
    font-size: 11px;
    font-weight: 500;
    margin-top: 3px;
    letter-spacing: 0.2px;
  }

  .so-nav-tab.active .so-nav-label {
    color: var(--snap-yellow);
    font-weight: 600;
  }

  .so-nav-tab.so-tab-camera .so-camera-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid currentColor;
    transition: all 0.15s ease;
  }

  .so-nav-tab.so-tab-camera.active .so-camera-circle {
    border-color: var(--snap-yellow);
    box-shadow: 0 0 10px var(--snap-yellow-glow);
  }
  `;

  let styleEl = document.getElementById('snap-overhaul-v6');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'snap-overhaul-v6';
    (document.head || document.documentElement).appendChild(styleEl);
  }
  styleEl.textContent = OVERHAUL_CSS;

  /* ==========================================================================
     4. Pure SVG Icons
     ========================================================================== */
  const ICONS = {
    chat: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    camera: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>'
  };

  /* ==========================================================================
     5. Navigation & State Management
     ========================================================================== */
  function setMode(mode) {
    if (document.body.getAttribute('data-so-mode') === mode) return;
    document.body.setAttribute('data-so-mode', mode);

    const bar = document.getElementById('so-phone-bar');
    if (bar) {
      const chatTab = bar.querySelector('.so-tab-chat');
      const cameraTab = bar.querySelector('.so-tab-camera');
      if (chatTab) chatTab.classList.toggle('active', mode === 'chats');
      if (cameraTab) cameraTab.classList.toggle('active', mode === 'camera');
    }
  }

  let isNavigatingBack = false;
  function openChatsView() {
    if (isNavigatingBack) return;
    isNavigatingBack = true;
    try {
      setMode('chats');

      // 1. Close story if open via native close buttons
      const storyXBtn = document.querySelector('div.eox9R button:last-child, button.h9IpV, button:has(svg path[d*="m9.103 6.971"])');
      if (storyXBtn) {
        ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(t => {
          storyXBtn.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }));
        });
      }

      // 2. Return URL to /web if inside a specific conversation
      if (window.location.pathname.startsWith('/web/') && window.location.pathname !== '/web') {
        window.history.pushState({}, '', '/web');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }

      // 3. Close active chat
      const chatPres = document.querySelector('main#root > div:first-child > div:nth-child(3) div[role="presentation"]');
      const nativeCloseBtn = document.querySelector('main#root > div:first-child > div:nth-child(3) button[title="Close Chat"], main#root > div:first-child > div:nth-child(3) button[aria-label*="Back"]') ||
        (chatPres && chatPres.firstElementChild ? chatPres.firstElementChild.querySelector('button:not(.so-custom-back-btn)') : null);
      if (nativeCloseBtn) nativeCloseBtn.click();

      // 4. Close any open camera
      const closeBtn = document.querySelector('main#root > div:first-child > div:nth-child(3) button[aria-label="Close"], main#root > div:first-child > div:nth-child(3) button:has(svg path[d*="M19 6.41"]), main#root > div:first-child > div:nth-child(3) button:has(svg path[d*="M18 6L6 18"])');
      if (closeBtn) closeBtn.click();

      // 5. Close any open modal
      const modal = document.querySelector('.LtQF8');
      if (modal) {
        const modalClose = document.querySelector('button[title="New Chat"], button[title="View friend requests"], button.n6VkK, button.kwuI_');
        if (modalClose) modalClose.click();
      }

      // 6. Trigger resize event so virtual list repaints smoothly
      setTimeout(() => {
        window.dispatchEvent(new UIEvent('resize'));
      }, 50);
    } finally {
      setTimeout(() => {
        isNavigatingBack = false;
      }, 150);
    }
  }

  function openCameraView() {
    // 1. Close story if open
    const storyXBtn = document.querySelector('div.eox9R button:last-child, button.h9IpV, button:has(svg path[d*="m9.103 6.971"])');
    if (storyXBtn) {
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(t => {
        storyXBtn.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }));
      });
    }

    // 2. Return URL to /web if inside a specific conversation
    if (window.location.pathname.startsWith('/web/') && window.location.pathname !== '/web') {
      window.history.pushState({}, '', '/web');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }

    // 3. Close active chat if open
    const chatPres = document.querySelector('main#root > div:first-child > div:nth-child(3) div[role="presentation"]');
    const nativeCloseBtn = document.querySelector('main#root > div:first-child > div:nth-child(3) button[title="Close Chat"], main#root > div:first-child > div:nth-child(3) button[aria-label*="Back"]') ||
      (chatPres && chatPres.firstElementChild ? chatPres.firstElementChild.querySelector('button:not(.so-custom-back-btn)') : null);
    if (nativeCloseBtn) nativeCloseBtn.click();

    // 4. Set mode to camera
    setMode('camera');

    // 5. Trigger resize event so camera canvas/video sizes properly
    setTimeout(() => {
      window.dispatchEvent(new UIEvent('resize'));
    }, 50);
  }

  /* ==========================================================================
     6. Permanent Bottom Navigation Bar (Mounted to document.body)
     ========================================================================== */
  function ensureBottomBar() {
    let bar = document.getElementById('so-phone-bar');
    if (bar) return;

    bar = document.createElement('nav');
    bar.id = 'so-phone-bar';
    bar.innerHTML = `
      <button type="button" class="so-nav-tab so-tab-chat active" aria-label="Chats" title="Chats">
        ${ICONS.chat}
        <span class="so-nav-label">Chats</span>
      </button>

      <button type="button" class="so-nav-tab so-tab-camera" aria-label="Camera" title="Camera">
        <div class="so-camera-circle">
          ${ICONS.camera}
        </div>
        <span class="so-nav-label">Camera</span>
      </button>
    `;

    bar.querySelector('.so-tab-chat').addEventListener('click', (e) => {
      e.stopPropagation();
      openChatsView();
    });

    bar.querySelector('.so-tab-camera').addEventListener('click', (e) => {
      e.stopPropagation();
      openCameraView();
    });

    (document.body || document.documentElement).appendChild(bar);
  }

  /* ==========================================================================
     7. Clean Conversation Back Navigation
     ========================================================================== */
  function ensureBackButton() {
    const chatPres = document.querySelector('main#root > div:first-child > div:nth-child(3) div[role="presentation"]');
    if (!chatPres) return;
    const chatHeader = chatPres.firstElementChild;
    if (!chatHeader) return;

    const nativeBack = chatHeader.querySelector('button[title="Close Chat"], button[aria-label*="Back"], button[title*="Back"]');
    if (nativeBack) {
      nativeBack.onclick = () => openChatsView();
      const customDup = chatHeader.querySelector('.so-custom-back-btn');
      if (customDup) customDup.remove();
      return;
    }

    if (chatHeader.querySelector('.so-custom-back-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'so-custom-back-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Back to Chats');
    btn.innerHTML = ICONS.back;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openChatsView();
    });

    chatHeader.insertBefore(btn, chatHeader.firstElementChild);
  }

  /* ==========================================================================
     8. UI Synchronizer
     ========================================================================== */
  function syncUI() {
    injectMeta();
    ensureBottomBar();
    ensureBackButton();

    const hasModal = !!document.querySelector('.LtQF8');
    document.body.classList.toggle('so-has-modal', hasModal);

    const hasActiveChat = !document.querySelector('div.S4e9r') && (
      (window.location.pathname.startsWith('/web/') && window.location.pathname !== '/web') ||
      !!document.querySelector('main#root > div:first-child > div:nth-child(3) div[role="presentation"], div[role="textbox"][placeholder="Send a chat"]')
    );

    const isStoryActive = !hasActiveChat && !!document.querySelector('div.S4e9r, div.ecBYF, div.eox9R');

    const currentMode = document.body.getAttribute('data-so-mode') || 'chats';

    if (hasActiveChat) {
      if (currentMode !== 'chat') setMode('chat');
    } else if (isStoryActive) {
      if (currentMode !== 'story') setMode('story');
    } else {
      if (currentMode === 'chat' || currentMode === 'story') {
        setMode('chats');
      } else if (currentMode !== 'camera' && currentMode !== 'chats') {
        setMode('chats');
      }
    }
  }

  /* ==========================================================================
     9. Event Listeners (Clicks, Story Chat, Escape, History, Modals)
     ========================================================================== */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') openChatsView();
  });

  window.addEventListener('popstate', () => {
    if (window.location.pathname === '/web') {
      openChatsView();
    }
  });

  document.addEventListener('click', (e) => {
    // 0. Clicking outside modal card on modal backdrop -> dismiss modal
    if (e.target && e.target.classList && e.target.classList.contains('LtQF8')) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const modalClose = document.querySelector('button[title="New Chat"], button[title="View friend requests"], button.n6VkK, button.kwuI_');
      if (modalClose) modalClose.click();
      return;
    }

    // 1. Top-left chat icon inside story view -> Exit story and return to Chats
    const storyChatBtn = e.target.closest('button.kTUE0, div.PXgWb button, button:has(svg path[d*="M18.875"])');
    if (storyChatBtn) {
      e.preventDefault();
      e.stopPropagation();
      openChatsView();
      return;
    }

    // 2. Click on a friend feed row
    const friendRow = e.target.closest('nav div[role="list"][aria-label="Friends Feed"] div[role="listitem"]');
    if (friendRow) {
      // Only treat as story tap if clicking an explicit story ring button
      const storyBtn = e.target.closest('button.DV8P1, button[aria-label*="Story"]');
      if (storyBtn) {
        setMode('story');
        return;
      }

      // Check if user clicked the camera icon on the friend row
      const cameraAction = e.target.closest('div.w15C2, div.HEkDJ, button[aria-label*="Camera"]');
      if (cameraAction) {
        setMode('camera');
      } else {
        setMode('chat');
      }
      return;
    }

    // 3. Click on camera or story close button
    const closeBtn = e.target.closest('button[aria-label="Close"], button.h9IpV, button:has(svg path[d*="M19 6.41"]), button:has(svg path[d*="M18 6L6 18"]), div.eox9R button:last-child');
    if (closeBtn) {
      setTimeout(() => {
        openChatsView();
      }, 50);
      return;
    }

    // 4. Click on chat close / back button
    if (e.target.closest('button[title="Close Chat"], .so-custom-back-btn')) {
      openChatsView();
    }
  }, true);

  /* ==========================================================================
     10. Lifecycle Initialization
     ========================================================================== */
  setMode('chats');

  let rAF = null;
  const observer = new MutationObserver(() => {
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(() => syncUI());
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    syncUI();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
      syncUI();
    });
  }
})();
