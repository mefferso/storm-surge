# Storm Surge Lab

An offline-capable, interactive classroom exhibit about storm surge on an illustrative southeastern Louisiana coast. Built with HTML, CSS, JavaScript, and Canvas. No build, account, API key, or package installation is required.

## Run the exhibit

Unzip the project and open `index.html` in a current browser. Keep the CSS and three JavaScript files beside it. For a local web server, run `python3 -m http.server 8000` in that directory and visit <http://localhost:8000>. The exhibit works offline. The educator guide's reference links need an internet connection.

## Teach with it

1. In **Simulator**, select **Play** or scrub back to −24 h, then watch the water reach Porch House. Use the probe dropdown or tap the cross-section. Compare ground elevation, raised-floor elevation, and local water depth.
2. Open **Hurricane Showdown** and choose **Category Isn’t Everything**. Ask students to vote for Storm A, Storm B, or About the Same. Selecting an answer starts both storms and reveals the comparison when they finish. Both panels measure the **same selected location**, and the result uses each storm’s maximum water depth at that location over the full timeline. Differences under 0.35 ft count as about the same.
3. Choose the tide or levee experiments. Use **Science view** to show the astronomical tide, storm tide, and raised-floor thresholds. **Lock environment** shares shelf, predicted tide phase, and protection between storms. When enabled, the storm currently being edited supplies those settings.
4. Use **Fullscreen** and switch off **Measurements** or **Labels** as appropriate. In a narrow display, the comparison stacks so the two scenes remain usable. Native sliders, selectors, and buttons support a keyboard. The dropdown offers a keyboard alternative to tapping the terrain.

All model times are relative to each storm’s simulated landfall. Split-screen panels use identical terrain coordinates and vertical scales. A levee, a natural ridge, and two offshore profiles change the drawn cross-section. See [MODEL.md](MODEL.md) for equations, assumptions, and NOAA references.

## Publish on GitHub Pages

1. Create a new public GitHub repository, such as `storm-surge-lab`.
2. Put the **contents** of this archive at the root of its `main` branch so `index.html` sits at the root with the other files. Keep `.nojekyll` if uploading with Git. No Node build is needed.
3. Open the repository’s **Settings → Pages**. Choose **Deploy from a branch**, then **main**, **/(root)**, and **Save**.
4. Once the Pages deployment succeeds, open the URL shown in **Settings → Pages**. For a normal project repository the address has the form `https://YOUR-USERNAME.github.io/storm-surge-lab/`. Check the exhibit and both modes at that URL.

[GitHub Pages publishing documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Embed in Google Sites

In the Sites editor, choose **Insert → Embed**, paste the public GitHub Pages URL, then insert and size the embed. For maximum space, use **Pages → Add → Full page embed**. Preview it then publish the Google Site. If the frame does not allow browser fullscreen, the button enters a compact presentation layout within the frame. Open the public exhibit directly for browser fullscreen.

[Google Sites embed documentation](https://support.google.com/sites/answer/90569)

## Source and checks

- `model.js` generates a deterministic time series and computes spatial connectivity, water depth, peaks, and duration.
- `scene.js` draws the terrain, structures, water and weather, and storm-track inset from the current state.
- `app.js` handles playback, inputs, comparison, classroom activities, and accessible measurement readouts.
- Run `node --test model.test.cjs` to check reproducibility, the five experiments, water budgets, floor and ground depths, and overtopping. Tests use Node’s built-in runner and do not affect the exhibit.
