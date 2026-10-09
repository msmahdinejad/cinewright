# Third-party notices

cinewright has **no npm or pip dependencies**. The only third-party material in this repository is the set of fonts bundled so that videos render offline with correct Latin and Persian/Arabic shaping. All of them are licensed under the **SIL Open Font License 1.1** (full text: [`skills/cinewright/templates/fonts/LICENSE-fonts.txt`](skills/cinewright/templates/fonts/LICENSE-fonts.txt)). The OFL allows use, embedding and redistribution (also commercially) as long as the fonts are not sold on their own and the licence text travels with them. Videos you render with these fonts are yours; no attribution is required inside the video.

| Font | Used for | Upstream |
|---|---|---|
| Vazirmatn | Persian/Arabic UI and body text (also the fallback for every Latin font) | https://github.com/rastikerdar/vazirmatn |
| Inter | Latin UI and body text | https://github.com/rsms/inter |
| JetBrains Mono | code, terminals | https://github.com/JetBrains/JetBrainsMono |
| Anton | condensed display headlines | https://github.com/googlefonts/AntonFont |
| Playfair Display | editorial serif | https://github.com/clauseggers/Playfair-Display |
| Space Grotesk | techy grotesque | https://github.com/floriankarsten/space-grotesk |
| Caveat | handwriting | https://github.com/googlefonts/caveat |
| Fredoka | rounded, friendly, neon tubes | https://github.com/hafontia-zz/Fredoka |
| Lalezar | Persian display headlines | https://github.com/BornaIz/Lalezar |
| Amiri | Persian/Arabic classic (naskh) | https://github.com/aliftype/amiri |
| Reem Kufi | Persian/Arabic kufi | https://github.com/aliftype/reem-kufi |
| Aref Ruqaa | Persian/Arabic ruqaa | https://github.com/aliftype/aref-ruqaa |
| Noto Nastaliq Urdu | Persian poetry titles (nastaliq) | https://github.com/notofonts/nastaliq |
| Rakkas | playful Persian/Arabic display | https://github.com/EkType/Rakkas |

Each font remains © its respective *Project Authors* (see the upstream repositories for the exact copyright lines); the subsets in `templates/fonts/` are the unmodified WOFF2 files served by Google Fonts, except that Vazirmatn is the upstream variable WOFF2.

## Sample media

The MP4 files attached to GitHub Releases were produced by this skill from code; their soundtracks are synthesised by `templates/lib/synth.mjs`. They contain no third-party footage, music or samples.
