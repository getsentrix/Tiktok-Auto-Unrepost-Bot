# Tiktok-Auto-Unrepost-Bot
A Tampermonkey script to mass-remove TikTok reposts while running completely AFK.

## Features

* **Dynamic Rate Limit Evasion:** Automatically recalculates batch limits and cooldown timers per cycle to simulate human interaction patterns and get around server-side triggers.
* **Rogue State Detection:** Monitors URL state continuously. If the feed bottoms out or the script gets trapped on an unscrollable sponsored post, it safely stops the script.
* **Precise DOM Targeting:** Evaluates explicit `data-e2e` nodes and polls `aria-label` states to confirm post status before firing synthetic clicks.
* **Minimalist Interface:** Injects a lightweight, non-intrusive control panel directly into the DOM.

## Installation

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) in your browser.
2. Click **[here](https://github.com/getsentrix/Tiktok-Auto-Unrepost-Bot/raw/refs/heads/main/tiktok-unrepost.user.js)** to install the script. 

## Usage

1. Navigate to your TikTok profile.
2. If the Reposts tab is hidden by TikTok's UI, click **Unhide Reposts Tab** on the script.
3. Open the **first** video in your Reposts grid so it occupies the full viewport. *(Note: If the feed fails to render and displays a black screen, return to the For You page, manually repost one video to flush the cache, and try again).*
4. Click **Start Auto-Unrepost**.
5. **You can now switch tabs / leave the browser.** Do not input manual keyboard or mouse commands while the script is running, as this will desync the hardcoded rendering delays.

## Known Limitations & Maintenance

This script relies on specific data tags within TikTok's DOM structure. When TikTok's UI updates, this script will lose functionality until patched.

**License:** MIT License  
**Support/Bug Reports:** Contact `@dprits2` on Discord.
