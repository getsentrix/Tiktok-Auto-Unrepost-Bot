# TikTok Auto Unrepost Bot

A browser userscript that automates the process of removing reposts from your TikTok account. It provides a simple control panel, automated navigation, and post-state verification to make managing large repost histories easier.

## Features

- **Automated Unreposting:** Automatically navigates through your repost feed and removes reposts without requiring manual interaction with every post.
- **Smart Post Detection:** Identifies relevant TikTok interface elements and checks post states before attempting actions.
- **Action Verification:** Uses available interface indicators to determine whether an unrepost action was successful.
- **Automatic Navigation:** Handles movement between posts and accounts for different post formats and feed layouts.
- **Adaptive Execution:** Uses configurable timing, pauses, and execution controls to manage automated actions.
- **Feed State Monitoring:** Detects navigation issues, stalled feeds, and other conditions that may prevent normal operation.
- **Lightweight Interface:** Adds a compact control panel directly to TikTok, providing access to the script's main functions and controls.

## Installation

1. Install a userscript manager for your browser:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
2. Install the script using the following link:

   **[Install TikTok Auto Unrepost Bot](https://github.com/getsentrix/Tiktok-Auto-Unrepost-Bot/raw/refs/heads/main/tiktok-unrepost.user.js)**

3. Allow the userscript manager to install and enable the script.
4. Open TikTok and navigate to your profile.

## Usage

1. Navigate to your TikTok profile.
2. If the Reposts tab is hidden, use the script's **Unhide Reposts Tab** control.
3. Open a post from your Reposts tab so it is displayed in the full-screen viewer.
4. Open the script's control panel.
5. Select **Start Auto-Unrepost** to begin automated processing.
6. Monitor the script through its interface while it works.

For consistent operation, avoid manually interacting with TikTok while the automation is running. Manual navigation or other interactions may interfere with automated processing.


## Troubleshooting

- **Reposts tab is missing:** Use the **Unhide Reposts Tab** control.
- **Posts are not loading:** Refresh TikTok and reopen the Reposts feed.
- **Automation stops unexpectedly:** Check whether the feed is still loading or whether TikTok has changed the current page state.
- **Actions are not registering:** Allow the page to finish rendering before restarting the automation.
- **Unexpected behavior:** Restart the script and try again from the first post in your Reposts feed.

## License

Distributed under the [MIT License](LICENSE).

## Support & Bug Reports

For bug reports, questions, or suggestions, contact **@dprits2** on Discord.

When reporting an issue, include a description of the problem and, if possible, the browser and userscript manager you are using.
