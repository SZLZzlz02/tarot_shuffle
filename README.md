# Tarot Study

A small browser-based tarot drawing and study tool.

Tarot Study is a static website built with HTML, CSS, JavaScript, local tarot data, and local card images. It does not require a backend, package manager, build step, external library, or CDN.

## How to use the app

1. Optionally enter a spread name and one position name per line.
2. Select **Start New Round** to create a shuffled 78-card deck for the round.
3. Enter one or more numbers from 1 to 78, separated by commas, spaces, or line breaks.
4. Select **Draw** to reveal the cards assigned to those numbers.
5. Review each card's image, English and Chinese names, orientation, and study keywords.
6. End the round when finished. Starting another round creates a new shuffled mapping.

The current interface includes Chinese labels while keeping neutral English project metadata.

## How the draw system works

Each new round starts with all 78 physical cards and uses a Fisher–Yates shuffle. The shuffled position becomes that card's temporary number from 1 to 78. Every card also receives one fixed upright or reversed orientation for the round.

The temporary number mapping and orientations do not change until the round ends. A previously drawn number cannot be used again in the same round, and an invalid input does not reshuffle the deck.

## Clarification draws

After the main spread is revealed, the clarification section accepts additional numbers. Clarification cards use the same Round ID, shuffled deck, temporary numbers, and fixed orientations as the main spread. They are added below the existing reading without replacing earlier cards.

## Deploying with GitHub Pages

Recommended repository name: `tarot-study`

1. Create a GitHub repository named `tarot-study`.
2. Commit or upload the complete contents of this folder to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Select the **main** branch.
6. Select the **/(root)** folder.
7. Select **Save**.

No build workflow is required. GitHub Pages should publish the files directly from the repository root.

The expected public URL is:

```text
https://USERNAME.github.io/tarot-study/
```

Replace `USERNAME` with the GitHub account or organization name that owns the repository.

## Repository contents

Commit all of the following:

```text
.nojekyll
index.html
style.css
script.js
README.md
data/
  tarot-data.js
  tarot-rws.zh-CN.json
images/
  README.md
  major/
  wands/
  cups/
  swords/
  pentacles/
```

All asset paths are relative, so the app works from the `/tarot-study/` repository subdirectory rather than requiring deployment at the domain root.
