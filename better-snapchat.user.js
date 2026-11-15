// ==UserScript==
// @name         Better Snapchat Web (Native Phone Experience)
// @namespace    https://antigravity.google.com/
// @version      5.1.0
// @description  Flawless phone layout: 100vh centered column, native-styled full-width chat composer, centered story viewer (zero background bleed, clean 9:16 frame), permanent bottom bar across Chats, Camera, & Stories, and single-click top-left story back navigation.
// @author       Dylan & Antigravity
// @match        https://web.snapchat.com/*
// @match        https://www.snapchat.com/web*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=snapchat.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  /* ==========================================================================
     1. Viewport Meta Configuration
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
     2. Native Phone UI Stylesheet (100vh Sizing, Clean Composer & Story Layout)
     ========================================================================== */
  const OVERHAUL_CSS = `
  /* --- A. ROOT DESIGN TOKENS & RESET --- */
  :root {
    --snap-yellow: #fffc00;
    --snap-yellow-glow: rgba(255, 252, 0, 0.35);
    --phone-width: 440px;
    --header-height: 58px;
    --bar-height: 60px;
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-bg: rgba(14, 14, 18, 0.96);
  }

  html, body, main#root {
    height: 100vh !important;
    max-height: 100vh !important;
    width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #060609 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  }

  /* Remove all distractions / promo banners / telemetry */
  main#root > div:first-child > div:nth-child(1),
  main#root > div:first-child > div:nth-child(2) > div:nth-child(2),
  button[title="Open Spotlight"],
  [aria-label="Spotlight"],
  #adBlockTestId {
    display: none !important;
  }

  /* Centered Stage Wrapper */
  main#root > div:first-child {
    display: flex !important;
    justify-content: center !important;
    align-items: stretch !important;
    height: 100vh !important;
    width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
    background: radial-gradient(circle at 50% 50%, #0e0e14 0%, #060609 100%) !important;
    overflow: hidden !important;
    position: relative !important;
  }

  /* Suppress 3D Bitmoji street scene background bleed globally */
  img._HpJ5,
  img[src*="images.bitmoji.com/3d/background"],
  div.S4e9r > img._HpJ5,
  div.S4e9r img[src*="3d/background"],
  ._HpJ5 {
    display: none !important;
  }

  /* --------------------------------------------------------------------------
     MODE 1: CHATS LIST VIEW
     -------------------------------------------------------------------------- */
  body[data-so-mode="chats"] main#root > div:first-child > div:nth-child(2),
  body:not([data-so-mode]) main#root > div:first-child > div:nth-child(2) {
    display: flex !important;
    flex-direction: column !important;
    width: var(--phone-width) !important;
    max-width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    margin: 0 auto !important;
    background: #0a0a0f !important;
    border-left: 1px solid var(--glass-border) !important;
    border-right: 1px solid var(--glass-border) !important;
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.85) !important;
    overflow: hidden !important;
    position: relative !important;
    box-sizing: border-box !important;
    padding-bottom: var(--bar-height) !important;
  }

  body[data-so-mode="chats"] main#root > div:first-child > div:nth-child(3),
  body:not([data-so-mode]) main#root > div:first-child > div:nth-child(3) {
    display: none !important;
  }

  /* --------------------------------------------------------------------------
     MODE 2: CAMERA VIEW (Bottom Bar Stays Visible Here!)
     -------------------------------------------------------------------------- */
  body[data-so-mode="camera"] main#root > div:first-child > div:nth-child(2) {
    display: none !important;
  }

  body[data-so-mode="camera"] main#root > div:first-child > div:nth-child(3) {
    display: flex !important;
    flex-direction: column !important;
    width: var(--phone-width) !important;
    max-width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    margin: 0 auto !important;
    background: #000000 !important;
    border-left: 1px solid var(--glass-border) !important;
    border-right: 1px solid var(--glass-border) !important;
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.85) !important;
    overflow: hidden !important;
    position: relative !important;
    box-sizing: border-box !important;
    padding-bottom: var(--bar-height) !important;
  }

  /* --------------------------------------------------------------------------
     MODE 3: ACTIVE CHAT CONVERSATION VIEW (100% Solid Height, No Cutoffs)
     -------------------------------------------------------------------------- */
  body[data-so-mode="chat"] main#root > div:first-child > div:nth-child(2) {
    display: none !important;
  }

  body[data-so-mode="chat"] main#root > div:first-child > div:nth-child(3) {
    display: flex !important;
    flex-direction: column !important;
    width: var(--phone-width) !important;
    max-width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    margin: 0 auto !important;
    background: #09090d !important;
    border-left: 1px solid var(--glass-border) !important;
    border-right: 1px solid var(--glass-border) !important;
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.85) !important;
    overflow: hidden !important;
    position: relative !important;
    box-sizing: border-box !important;
    padding-bottom: 0 !important;
  }

  /* Intermediate Flex Containers inside Chat Column */
  main#root > div:first-child > div:nth-child(3) > div:has(div[role="presentation"]),
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] {
    display: flex !important;
    flex-direction: column !important;
    height: 100vh !important;
    max-height: 100vh !important;
    width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  /* Conversation Top Header (58px Fixed Top) */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:first-child {
    height: var(--header-height) !important;
    min-height: var(--header-height) !important;
    max-height: var(--header-height) !important;
    flex: 0 0 var(--header-height) !important;
    box-sizing: border-box !important;
    background: var(--glass-bg) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border-bottom: 1px solid var(--glass-border) !important;
    display: flex !important;
    align-items: center !important;
    padding: 0 12px !important;
    z-index: 100 !important;
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

  .so-custom-back-btn:hover {
    background: rgba(255, 255, 255, 0.18) !important;
    transform: scale(1.06) !important;
  }

  .so-custom-back-btn + .so-custom-back-btn,
  button[title="Close Chat"] + .so-custom-back-btn,
  .so-custom-back-btn + button[title="Close Chat"] {
    display: none !important;
  }

  /* Conversation Body: 100vh minus 58px header */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) {
    height: calc(100vh - var(--header-height)) !important;
    max-height: calc(100vh - var(--header-height)) !important;
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
  }

  /* --- D. MESSAGE INPUT BAR (COMPOSER) - FULL-WIDTH CLEAN DOCK --- */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) {
    flex: 0 0 auto !important;
    min-height: 52px !important;
    margin: 6px 12px 14px 12px !important;
    padding: 4px 10px !important;
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

  /* Inner flex row spans 100% full width */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) > div:first-child {
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }

  /* Textbox container expands across all available space */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) div[class*="shMO3"],
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) div:has(> div > div[role="textbox"]) {
    flex: 1 1 auto !important;
    width: auto !important;
    min-width: 0 !important;
    display: flex !important;
    align-items: center !important;
  }

  /* Inner textbox pill: clean, borderless, seamless */
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

  /* Text input itself - with right padding to clear send button */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) div[role="textbox"],
  div[role="textbox"][contenteditable="true"] {
    width: 100% !important;
    background: transparent !important;
    border: none !important;
    padding: 6px 38px 6px 4px !important;
    box-sizing: border-box !important;
    font-size: 15px !important;
    color: #f5f5f7 !important;
    outline: none !important;
    caret-color: var(--snap-yellow) !important;
  }

  /* Send Message Button inside Textbox Pill - perfectly centered, vibrant blue */
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

  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button.IHV_t:hover,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) .fCmUn > button:hover,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button[class*="IHV_t"]:hover,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button[class*="v4zfr"]:hover {
    background: #009be8 !important;
    transform: translateY(-50%) scale(1.08) !important;
  }

  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button.IHV_t svg,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) .fCmUn > button svg,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button[class*="IHV_t"] svg,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button[class*="v4zfr"] svg {
    width: 13px !important;
    height: 13px !important;
    fill: #ffffff !important;
    color: #ffffff !important;
    margin-left: 2px !important;
  }

  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button.IHV_t svg path,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) .fCmUn > button svg path,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button[class*="IHV_t"] svg path,
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button[class*="v4zfr"] svg path {
    fill: #ffffff !important;
  }

  /* Circular Action Buttons (exclude send button) */
  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button:not(.IHV_t):not(.v4zfr):not([class*="IHV_t"]):not([class*="v4zfr"]) {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
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

  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button:not(.IHV_t):not(.v4zfr):not([class*="IHV_t"]):not([class*="v4zfr"]):hover {
    background: rgba(255, 255, 255, 0.16) !important;
    transform: scale(1.06) !important;
  }

  main#root > div:first-child > div:nth-child(3) div[role="presentation"] > div:nth-child(2) > div:nth-child(2) button:not(.IHV_t):not(.v4zfr):not([class*="IHV_t"]):not([class*="v4zfr"]) svg {
    width: 20px !important;
    height: 20px !important;
    fill: #ffffff !important;
  }

  /* --------------------------------------------------------------------------
     MODE 4: STORY VIEWER (CENTERED 9:16 FRAME, ZERO BLEED, BOTTOM BAR ACCESSIBLE)
     -------------------------------------------------------------------------- */
  body[data-so-mode="story"] main#root > div:first-child > div:nth-child(2) {
    display: none !important;
  }

  body[data-so-mode="story"] main#root > div:first-child > div:nth-child(3) {
    display: flex !important;
    flex-direction: column !important;
    width: var(--phone-width) !important;
    max-width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    margin: 0 auto !important;
    background: #000000 !important;
    border-left: 1px solid var(--glass-border) !important;
    border-right: 1px solid var(--glass-border) !important;
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.85) !important;
    overflow: hidden !important;
    position: relative !important;
    box-sizing: border-box !important;
    padding-bottom: 0 !important;
  }

  /* Story player grid container */
  main#root > div:first-child > div:nth-child(3) > div:has(div.S4e9r),
  div._XMCw:has(div.S4e9r) {
    display: grid !important;
    grid-template: "main secondary" 1fr / 1fr 0fr !important;
    height: 100vh !important;
    max-height: 100vh !important;
    width: 100% !important;
    background: #000000 !important;
    overflow: hidden !important;
  }

  /* Story stage */
  div.S4e9r {
    grid-area: main !important;
    height: 100vh !important;
    max-height: 100vh !important;
    width: 100% !important;
    max-width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    position: relative !important;
    border-top: none !important;
    background: #000000 !important;
    overflow: hidden !important;
  }

  /* Story player inner wrapper */
  div.ecBYF {
    position: relative !important;
    height: 100vh !important;
    max-height: 100vh !important;
    width: 100% !important;
    max-width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    padding: 8px 0 calc(var(--bar-height) + 8px) 0 !important;
    box-sizing: border-box !important;
    background: #000000 !important;
    overflow: hidden !important;
  }

  /* Header inside story */
  div.eox9R {
    flex: 0 0 48px !important;
    height: 48px !important;
    z-index: 100 !important;
    display: flex !important;
    align-items: center !important;
  }

  /* Top-left story chat back icon: remove completely as requested */
  div.PXgWb,
  div.PXgWb button,
  div.eox9R button.kTUE0,
  button.kTUE0,
  div.eox9R div:has(> button.kTUE0),
  button:has(svg path[d*="M18.875"]) {
    display: none !important;
  }

  /* Media content wrapper */
  div.RdKti {
    display: flex !important;
    flex: 1 1 auto !important;
    height: calc(100vh - 170px) !important;
    max-height: calc(100vh - 170px) !important;
    width: 100% !important;
    max-width: 100% !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: hidden !important;
  }

  /* Story card frame */
  div.vDdE2 {
    height: 100% !important;
    max-height: calc(100vh - 170px) !important;
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
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7) !important;
  }

  div.vDdE2 img,
  div.vDdE2 video,
  div.S4e9r img.ChG6a,
  body[data-so-mode="story"] div.vDdE2 img.ChG6a {
    max-width: 100% !important;
    max-height: calc(100vh - 170px) !important;
    width: auto !important;
    height: auto !important;
    object-fit: contain !important;
    border-radius: 18px !important;
    margin: 0 auto !important;
  }

  /* Reply input cleanly docked above bottom bar */
  div.ejVI4,
  div:has(> input[placeholder*="Reply to"]),
  input[placeholder*="Reply to"] {
    z-index: 50 !important;
    margin-bottom: calc(var(--bar-height) + 6px) !important;
  }

  /* --- E. FEED LIST STYLING --- */
  main#root > div:first-child > div:nth-child(2) > div:nth-child(1) {
    height: var(--header-height) !important;
    padding: 0 16px !important;
    border-bottom: 1px solid var(--glass-border) !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: center !important;
  }

  nav div[role="list"][aria-label="Friends Feed"] div[role="listitem"] > div[role="button"] {
    margin: 2px 8px !important;
    width: calc(100% - 16px) !important;
    height: calc(100% - 4px) !important;
    box-sizing: border-box !important;
    border-radius: 14px !important;
    background: rgba(255, 255, 255, 0.02) !important;
    border: 1px solid rgba(255, 255, 255, 0.04) !important;
    transition: background 0.15s ease, border-color 0.15s ease !important;
  }

  nav div[role="list"][aria-label="Friends Feed"] div[role="listitem"] > div[role="button"]:hover {
    background: rgba(255, 255, 255, 0.07) !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }

  /* --- F. PERMANENT PHONE BOTTOM NAVIGATION BAR --- */
  #so-phone-bar {
    position: fixed !important;
    bottom: 0 !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: var(--phone-width) !important;
    max-width: 100vw !important;
    height: var(--bar-height) !important;
    background: rgba(14, 14, 18, 0.96) !important;
    backdrop-filter: blur(24px) !important;
    -webkit-backdrop-filter: blur(24px) !important;
    border-top: 1px solid var(--glass-border) !important;
    border-left: 1px solid var(--glass-border) !important;
    border-right: 1px solid var(--glass-border) !important;
    display: flex !important;
    justify-content: space-around !important;
    align-items: center !important;
    z-index: 999999 !important;
    box-sizing: border-box !important;
    padding: 0 24px !important;
  }

  /* Visible in Chats, Camera, and Story modes */
  body[data-so-mode="chats"] #so-phone-bar,
  body[data-so-mode="camera"] #so-phone-bar,
  body[data-so-mode="story"] #so-phone-bar,
  body:not([data-so-mode]) #so-phone-bar {
    display: flex !important;
  }

  /* Hidden in active chat conversation */
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
    padding: 6px 30px;
    border-radius: 16px;
    transition: color 0.15s ease, transform 0.15s ease;
    user-select: none;
  }

  .so-nav-tab:hover {
    color: rgba(255, 255, 255, 0.85);
    transform: translateY(-1px);
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

  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
  `;

  let styleEl = document.getElementById('snap-overhaul-v5');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'snap-overhaul-v5';
    (document.head || document.documentElement).appendChild(styleEl);
  }
  styleEl.textContent = OVERHAUL_CSS;

  /* ==========================================================================
     3. Icons (Pure SVG)
     ========================================================================== */
  const ICONS = {
    chat: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    camera: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>'
  };

  /* ==========================================================================
     4. Navigation & State Management
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

      // 1. Close story if open via Escape and native close buttons
      const storyXBtn = document.querySelector('div.eox9R button:last-child, button:has(svg path[d*="m9.103 6.971"])');
      if (storyXBtn) {
        ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(t => {
          storyXBtn.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }));
        });
      }

      // 2. Return URL to /web if inside a specific conversation
      if (window.location.pathname.startsWith('/web/') && window.location.pathname !== '/web') {
        window.history.pushState({}, '', '/web');
      }

      // 3. Close active chat
      const nativeCloseBtn = document.querySelector('main#root > div:first-child > div:nth-child(3) button[title="Close Chat"], main#root > div:first-child > div:nth-child(3) button[aria-label*="Back"]');
      if (nativeCloseBtn) nativeCloseBtn.click();

      // 4. Close any open camera
      const closeBtn = document.querySelector('main#root > div:first-child > div:nth-child(3) button[aria-label="Close"], main#root > div:first-child > div:nth-child(3) button:has(svg path[d*="M19 6.41"]), main#root > div:first-child > div:nth-child(3) button:has(svg path[d*="M18 6L6 18"])');
      if (closeBtn) closeBtn.click();

      // 5. Trigger resize event so virtual list repaints smoothly
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
    const storyXBtn = document.querySelector('div.eox9R button:last-child, button:has(svg path[d*="m9.103 6.971"])');
    if (storyXBtn) {
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(t => {
        storyXBtn.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }));
      });
    }

    // 2. Return URL to /web if inside a specific conversation
    if (window.location.pathname.startsWith('/web/') && window.location.pathname !== '/web') {
      window.history.pushState({}, '', '/web');
    }

    // 3. Close active chat if open
    const nativeCloseBtn = document.querySelector('main#root > div:first-child > div:nth-child(3) button[title="Close Chat"], main#root > div:first-child > div:nth-child(3) button[aria-label*="Back"]');
    if (nativeCloseBtn) nativeCloseBtn.click();

    // 4. Set mode to camera
    setMode('camera');

    // 5. Trigger resize event so camera canvas/video sizes properly
    setTimeout(() => {
      window.dispatchEvent(new UIEvent('resize'));
    }, 50);
  }

  /* ==========================================================================
     5. Permanent Bottom Navigation Bar (Mounted to document.body)
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
     6. Clean Conversation Back Navigation
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
     7. Core Synchronizer
     ========================================================================== */
  function syncUI() {
    ensureBottomBar();
    ensureBackButton();

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
      // Neither active chat nor story is open.
      // If returning from chat or story, default to chats.
      // If in camera or chats, preserve the user's explicitly selected mode!
      if (currentMode === 'chat' || currentMode === 'story') {
        setMode('chats');
      } else if (currentMode !== 'camera' && currentMode !== 'chats') {
        setMode('chats');
      }
    }
  }

  /* ==========================================================================
     8. Event Listeners (Clicks, Top-Left Story Chat, Escape, History)
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
      // Is it a story bubble button?
      const storyBtn = e.target.closest('button.DV8P1, button:has(img[src^="blob:"]), div:has(> img[src^="blob:"])');
      if (storyBtn) {
        setMode('story');
        return;
      }

      // Check if user clicked the camera icon on the friend row (div.w15C2 or div.HEkDJ)
      const cameraAction = e.target.closest('div.w15C2, div.HEkDJ, button[aria-label*="Camera"]');
      if (cameraAction) {
        setMode('camera');
      } else {
        setMode('chat');
      }
      return;
    }

    // 3. Click on camera or story close button
    const closeBtn = e.target.closest('button[aria-label="Close"], button:has(svg path[d*="M19 6.41"]), button:has(svg path[d*="M18 6L6 18"]), div.eox9R button:last-child');
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
     9. Lifecycle Initialization
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
