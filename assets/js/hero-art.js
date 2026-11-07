export function heroArt() {
  return `
  <svg class="hero-art__svg" viewBox="0 0 760 660" role="presentation" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffb35c" stop-opacity=".95"/>
        <stop offset="55%" stop-color="#f08a3c" stop-opacity=".35"/>
        <stop offset="100%" stop-color="#e07a35" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="grassTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#70845f"/>
        <stop offset="55%" stop-color="#5f7455"/>
        <stop offset="100%" stop-color="#4b6148"/>
      </linearGradient>
      <linearGradient id="dirtSide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#76583c"/>
        <stop offset="100%" stop-color="#5b412d"/>
      </linearGradient>
      <linearGradient id="stoneSide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3d4541"/>
        <stop offset="100%" stop-color="#232a28"/>
      </linearGradient>
      <linearGradient id="waterfall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9dd8d0" stop-opacity=".9"/>
        <stop offset="70%" stop-color="#71b9b5" stop-opacity=".65"/>
        <stop offset="100%" stop-color="#71b9b5" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#315048"/>
        <stop offset="100%" stop-color="#1c322d"/>
      </linearGradient>
      <pattern id="islandGrid" width="34" height="20" patternUnits="userSpaceOnUse">
        <path d="M17 0 34 10 17 20 0 10Z" fill="none" stroke="#f3ead8" stroke-opacity=".075" stroke-width="1"/>
      </pattern>
      <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="6"/>
      </filter>
      <clipPath id="islandClip">
        <path d="M380 210 560 279 690 345 520 435 380 505 220 430 70 350 230 275Z"/>
      </clipPath>
    </defs>

    <g class="hero-sun">
      <circle cx="544" cy="238" r="170" fill="url(#sunGlow)"/>
      <circle cx="544" cy="238" r="78" fill="#f2a353" opacity=".28"/>
    </g>

    <g class="hero-stars" fill="#f7e8ca">
      <rect x="112" y="146" width="3" height="3" opacity=".45"/>
      <rect x="204" y="98" width="2" height="2" opacity=".4"/>
      <rect x="642" y="108" width="3" height="3" opacity=".55"/>
      <rect x="690" y="184" width="2" height="2" opacity=".35"/>
      <rect x="88" y="266" width="2" height="2" opacity=".35"/>
      <rect x="664" y="390" width="2" height="2" opacity=".4"/>
      <rect x="462" y="104" width="2" height="2" opacity=".3"/>
    </g>

    <g class="hero-birds" stroke="#f4dfbd" stroke-width="2.2" fill="none" stroke-linecap="round">
      <path d="M157 209c8-8 15-8 22 0 7-8 14-8 22 0" opacity=".65"/>
      <path d="M208 182c6-6 11-6 17 0 5-6 10-6 16 0" opacity=".45"/>
      <path d="M594 151c5-5 10-5 14 0 5-5 9-5 14 0" opacity=".35"/>
    </g>

    <g class="hero-clouds" fill="#f9e7c7">
      <g class="cloud cloud--1" opacity=".12">
        <rect x="54" y="420" width="114" height="16"/>
        <rect x="74" y="404" width="76" height="16"/>
        <rect x="98" y="390" width="34" height="14"/>
        <rect x="36" y="436" width="82" height="12"/>
      </g>
      <g class="cloud cloud--2" opacity=".1">
        <rect x="586" y="420" width="130" height="16"/>
        <rect x="610" y="404" width="86" height="16"/>
        <rect x="640" y="390" width="38" height="14"/>
      </g>
      <g class="cloud cloud--3" opacity=".08">
        <rect x="92" y="534" width="180" height="18"/>
        <rect x="126" y="516" width="112" height="18"/>
        <rect x="164" y="500" width="48" height="16"/>
      </g>
      <g class="cloud cloud--4" opacity=".07">
        <rect x="520" y="554" width="190" height="18"/>
        <rect x="558" y="536" width="120" height="18"/>
        <rect x="602" y="520" width="48" height="16"/>
      </g>
    </g>

    <g class="hero-island">
      <g class="island-under">
        <path d="M380 608 690 455 690 494 380 660 70 494 70 455Z" fill="#1b2220" opacity=".6"/>
        <path d="M248 500l22 18-12 42-20-16Z" fill="#303936" opacity=".8"/>
        <path d="M536 498l28-18 90 24-16 16Z" fill="#2b3431" opacity=".7"/>
      </g>

      <path d="M70 350 380 505 690 345 690 373 380 533 70 378Z" fill="url(#dirtSide)"/>
      <path d="M70 378 380 533 690 373 690 460 380 620 70 465Z" fill="url(#stoneSide)"/>

      <g opacity=".32" stroke="#101513" stroke-width="2">
        <path d="M120 396v54M170 419v54M224 444v54M278 469v52M332 494v51M386 518v55M440 495v48M494 470v49M548 445v47M602 420v46M652 398v43"/>
        <path d="M96 420l94 46 94 46 94 46 94 46 94 46 94 46" opacity=".35"/>
      </g>

      <path d="M70 350 380 505 690 345 690 358 380 518 70 363Z" fill="#4f684d"/>
      <path d="M380 210 560 279 690 345 520 435 380 505 220 430 70 350 230 275Z" fill="url(#grassTop)"/>
      <path d="M380 210 560 279 690 345 520 435 380 505 220 430 70 350 230 275Z" fill="url(#islandGrid)"/>

      <g clip-path="url(#islandClip)">
        <path d="M70 350 230 275 380 335 220 430Z" fill="#f0d7a3" opacity=".045"/>
        <path d="M380 335 560 279 690 345 520 435Z" fill="#15211c" opacity=".12"/>
        <path d="M250 388c30-22 66-22 92-2 26 20 19 48-16 61-35 13-77 3-88-16-8-13-1-29 12-43Z" fill="#3e5a52" opacity=".75"/>
        <path d="M260 390c25-15 54-14 73 0 18 14 11 33-15 43-28 10-61 2-69-12-6-10 0-22 11-31Z" fill="#6aa6a1" opacity=".55"/>
        <path d="M274 397c14-8 33-7 44 2 8 6 5 15-8 20-15 6-34 1-38-6-3-5 0-11 2-16Z" fill="#91c8c1" opacity=".5"/>

        <path d="M302 422c16-7 40-4 54 8 8 7 4 13-6 18l-14 90h-16l4-96c-13-3-24-11-22-20Z" fill="#6cb8b2" opacity=".55"/>
        <path d="M304 430h28l-6 88h-12Z" fill="#a8ded5" opacity=".32"/>

        <path d="M312 394 368 370 445 397 388 424Z" fill="#d7c295" opacity=".5"/>
        <path d="M330 405 373 388 424 407 384 426Z" fill="#cbb382" opacity=".4"/>
      </g>

      <g class="island-waterfall">
        <path d="M312 437h30l-5 124c-4 18-31 18-34 0Z" fill="url(#waterfall)"/>
        <path d="M320 438h5l-2 112c0 7-6 7-7 0Z" fill="#d7f3ea" opacity=".45"/>
        <path d="M332 438h5l-3 95c-1 6-5 6-6 0Z" fill="#c8ebe3" opacity=".3"/>
        <circle cx="325" cy="565" r="21" fill="#a6d9d2" opacity=".12" filter="url(#softGlow)"/>
      </g>

      <g class="island-gate">
        <path d="M294 434 380 470 486 425 402 390Z" fill="#7f8176"/>
        <path d="M294 434 380 470 380 482 294 446Z" fill="#565d57"/>
        <path d="M380 470 486 425 486 438 380 482Z" fill="#4a514c"/>
        <path d="M308 436 380 466 462 431 389 403Z" fill="#9b9a88"/>

        <path d="M323 426h18v-141h-18Z" fill="#b85237"/>
        <path d="M341 426h7v-141h-7Z" fill="#873a28"/>
        <path d="M435 421h18v-141h-18Z" fill="#b85237"/>
        <path d="M453 421h7v-141h-7Z" fill="#873a28"/>

        <rect x="308" y="298" width="164" height="16" fill="#863b29"/>
        <rect x="308" y="298" width="164" height="5" fill="#d06d42"/>
        <rect x="318" y="278" width="142" height="9" fill="#6e3022"/>
        <rect x="318" y="278" width="142" height="3" fill="#bd5e38"/>

        <path d="M286 278 318 252 442 252 474 278 454 291 380 270 308 291Z" fill="url(#roof)"/>
        <path d="M286 278 318 252 442 252 474 278 460 280 434 260 328 260 300 280Z" fill="#3f5d52" opacity=".8"/>
        <path d="M268 268c10-12 23-13 33-3l-9 12c-5-6-13-6-19 1Z" fill="#243e37"/>
        <path d="M466 265c10-10 23-9 33 3l-5 10c-6-7-14-7-19-1Z" fill="#243e37"/>

        <path d="M330 249 354 218 409 218 433 249 416 258 380 229 348 258Z" fill="url(#roof)"/>
        <path d="M330 249 354 218 409 218 433 249 421 251 402 226 361 226 342 251Z" fill="#45655a" opacity=".75"/>
        <path d="M315 240c8-10 19-10 27-1l-7 10c-4-5-10-5-15 0Z" fill="#1c332d"/>
        <path d="M428 239c8-9 19-8 27 2l-5 9c-5-6-11-6-15-1Z" fill="#1c332d"/>

        <path d="M370 211h20v18h-20Z" fill="#743426"/>
        <path d="M374 202h12v10h-12Z" fill="#d6a14e"/>
        <path d="M398 207h29l-3 12h-26Z" fill="#cc7040"/>
        <path d="M398 207h29l-1 4h-28Z" fill="#f0bd6d"/>

        <rect x="348" y="314" width="64" height="42" fill="#5a2c20"/>
        <rect x="352" y="318" width="56" height="34" fill="#d9b77c"/>
        <rect x="352" y="318" width="56" height="3" fill="#f2d99f"/>
        <text x="380" y="343" text-anchor="middle" font-family="'Noto Serif SC','Songti SC','STZhongsong',serif" font-size="23" font-weight="700" fill="#573024" letter-spacing="2">神州</text>

        <path d="M306 309v26" stroke="#3b2b21" stroke-width="2"/>
        <circle cx="306" cy="337" r="12" fill="#f5b661" opacity=".18" filter="url(#softGlow)"/>
        <rect x="299" y="329" width="14" height="18" fill="#d98a49"/>
        <rect x="301" y="331" width="10" height="12" fill="#f6ca83"/>
        <rect x="304" y="347" width="4" height="5" fill="#7b3d28"/>

        <path d="M458 306v26" stroke="#3b2b21" stroke-width="2"/>
        <circle cx="458" cy="334" r="12" fill="#f5b661" opacity=".18" filter="url(#softGlow)"/>
        <rect x="451" y="326" width="14" height="18" fill="#d98a49"/>
        <rect x="453" y="328" width="10" height="12" fill="#f6ca83"/>
        <rect x="456" y="344" width="4" height="5" fill="#7b3d28"/>

        <path d="M324 426h112v9H324Z" fill="#6f4f35"/>
        <path d="M312 435h136v9H312Z" fill="#5a402c"/>
        <path d="M300 444h160v10H300Z" fill="#493525"/>
      </g>

      <g class="island-tree island-tree--left">
        <path d="M171 395h12v-62h-12Z" fill="#5e402b"/>
        <path d="M183 395h8v-62h-8Z" fill="#432c1e"/>
        <path d="M141 335 177 318 213 335 177 352Z" fill="#d48d42"/>
        <path d="M141 335 177 352 177 374 141 357Z" fill="#9f5f32"/>
        <path d="M213 335 177 352 177 374 213 357Z" fill="#b8733b"/>
        <path d="M121 313 177 289 233 313 177 337Z" fill="#e3a14d"/>
        <path d="M121 313 177 337 177 359 121 335Z" fill="#ad6b36"/>
        <path d="M233 313 177 337 177 359 233 335Z" fill="#c9853f"/>
        <path d="M150 285 177 273 204 285 177 297Z" fill="#efb75f"/>
        <path d="M150 285 177 297 177 315 150 303Z" fill="#c07d3d"/>
        <path d="M204 285 177 297 177 315 204 303Z" fill="#d28e46"/>
      </g>

      <g class="island-tree island-tree--right">
        <path d="M588 406h13v-78h-13Z" fill="#5a3b27"/>
        <path d="M601 406h7v-78h-7Z" fill="#3f2a1c"/>
        <path d="M548 338 591 318 634 338 591 358Z" fill="#d09743"/>
        <path d="M548 338 591 358 591 383 548 363Z" fill="#96612f"/>
        <path d="M634 338 591 358 591 383 634 363Z" fill="#b47939"/>
        <path d="M526 314 591 287 656 314 591 341Z" fill="#e1ac55"/>
        <path d="M526 314 591 341 591 366 526 339Z" fill="#a46d34"/>
        <path d="M656 314 591 341 591 366 656 339Z" fill="#c28a3f"/>
        <path d="M552 279 591 263 630 279 591 295Z" fill="#f0c66f"/>
        <path d="M552 279 591 295 591 313 552 297Z" fill="#c18d45"/>
        <path d="M630 279 591 295 591 313 630 297Z" fill="#d7a354"/>
        <path d="M616 268l7 4-1 14-7-4Z" fill="#f4d88f" opacity=".6"/>
      </g>

      <g class="island-flora" opacity=".85">
        <path d="M504 382l7-11 3 12 8-8-2 13Z" fill="#c8b46e"/>
        <path d="M262 356l6-9 2 10 7-6-2 10Z" fill="#d2b974"/>
        <path d="M462 440l5-8 2 9 7-6-2 9Z" fill="#bfa866"/>
        <circle cx="529" cy="416" r="2.5" fill="#e7b45e"/>
        <circle cx="538" cy="404" r="2" fill="#e7b45e"/>
        <circle cx="247" cy="405" r="2" fill="#e9c173"/>
        <circle cx="238" cy="394" r="1.6" fill="#e9c173"/>
      </g>

      <g class="island-lanterns">
        <path d="M250 427v21" stroke="#4b3828" stroke-width="2"/>
        <rect x="243" y="447" width="14" height="17" fill="#d88948"/>
        <rect x="245" y="449" width="10" height="11" fill="#f7ca7d"/>
        <circle cx="250" cy="456" r="12" fill="#f6b35c" opacity=".13" filter="url(#softGlow)"/>
        <path d="M475 411v18" stroke="#4b3828" stroke-width="2"/>
        <rect x="468" y="428" width="14" height="16" fill="#d88948"/>
        <rect x="470" y="430" width="10" height="10" fill="#f7ca7d"/>
        <circle cx="475" cy="436" r="11" fill="#f6b35c" opacity=".12" filter="url(#softGlow)"/>
      </g>
    </g>

    <g class="floating-blocks">
      <g transform="translate(612 492)">
        <path d="M0 18 30 4 60 18 30 32Z" fill="#687b58"/>
        <path d="M0 18 30 32 30 43 0 29Z" fill="#6b5038"/>
        <path d="M60 18 30 32 30 43 60 29Z" fill="#4e3a29"/>
        <path d="M0 18 30 32 30 38 0 24Z" fill="#435941"/>
      </g>
      <g transform="translate(104 468) scale(.72)">
        <path d="M0 18 30 4 60 18 30 32Z" fill="#7a8a64"/>
        <path d="M0 18 30 32 30 48 0 34Z" fill="#6b5038"/>
        <path d="M60 18 30 32 30 48 60 34Z" fill="#4e3a29"/>
      </g>
      <g transform="translate(650 252) scale(.55)">
        <path d="M0 18 30 4 60 18 30 32Z" fill="#77875f"/>
        <path d="M0 18 30 32 30 45 0 31Z" fill="#604832"/>
        <path d="M60 18 30 32 30 45 60 31Z" fill="#463426"/>
      </g>
      <g transform="translate(64 224) scale(.4)">
        <path d="M0 18 30 4 60 18 30 32Z" fill="#70815a"/>
        <path d="M0 18 30 32 30 44 0 30Z" fill="#5d4631"/>
        <path d="M60 18 30 32 30 44 60 30Z" fill="#433124"/>
      </g>
    </g>
  </svg>`;
}
