# Study Sprout

A whimsical study timetable maker. Paint your free and busy time, add subjects and portions, and it grows a day-by-day study timetable.

## Files

```
study-sprout/
├── index.html      Page structure, all pages, the theme picker, and the doodle drawings (SVG)
├── css/
│   └── style.css   Colours, layout, stickers, doodles, dark mode, seasonal themes, print layout
├── js/
│   └── app.js      Pages, week grid, subjects, scheduler, drag and drop, rescue, notes, themes
└── README.md
```

## Run it

Double-click `index.html` to open it in a browser. Nothing to install.

## Themes

Main theme, Spring, Fall, Winter and Summer. Each theme's colours are CSS variables in the `:root[data-season="…"]` blocks near the end of `style.css`, and its sticker colours are in `THEMES` near the top of `app.js`.

## Put it online

Upload the whole folder to GitHub Pages, Netlify or Vercel. Keep the folder structure the same so `index.html` can find the `css` and `js` folders.

## Notes

- Data is saved in the browser with `localStorage`, separately for each browser and device.
- Fonts load from Google Fonts: Fraunces and Atkinson Hyperlegible.
