import { useState, useRef, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono  = "'JetBrains Mono', monospace";
const sans  = "'Inter', sans-serif";
const serif = "'Crimson Pro', serif";

// ── Task data ─────────────────────────────────────────────────────────────────
const TASKS = [
  {
    id: 'shoe',
    tab: 'Sketch → Shoe',
    title: 'Sketch → Photo (Shoes)',
    dataset: 'UT Zappos50K',
    desc: 'Learned from paired sketch-photo data on the UT Zappos50K dataset. The model reconstructs material, color, and shading from line art.',
  },
  {
    id: 'map',
    tab: 'Map → Aerial',
    title: 'Map → Aerial Photo',
    dataset: 'Google Maps paired tiles',
    desc: 'Trained on aligned (map, satellite) tile pairs from Google Maps. Useful for generating aerial photo previews from cartographic data.',
  },
  {
    id: 'day',
    tab: 'Day → Night',
    title: 'Day → Night',
    dataset: 'Urban temporal pairs',
    desc: 'Trained on temporal pairs of the same urban scene captured at different times. The model relightens the scene rather than just darkening it.',
  },
  {
    id: 'bag',
    tab: 'Edges → Bag',
    title: 'Edges → Handbag',
    dataset: 'edges2handbags',
    desc: 'Trained on edges2handbags — automatically generated edge maps paired with original product photos. A creative tool for design exploration.',
  },
  {
    id: 'facade',
    tab: 'Labels → Facade',
    title: 'Labels → Facade',
    dataset: 'CMP Facades',
    desc: 'Trained on the CMP Facades dataset of European building facades with hand-labeled segmentation. Each color in the input is replaced by a corresponding texture in the output.',
  },
];

// ── Shared SVG constants ──────────────────────────────────────────────────────
const BG4  = '#1e1e1e';
const TEXT = '#e8eaed';

// ── Task A: Sketch → Shoe ─────────────────────────────────────────────────────
function ShoeInputSVG() {
  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: 'block' }}>
      <rect width="480" height="260" fill={BG4} />
      <path d="M 90 195 Q 85 208 100 214 L 370 214 Q 390 214 395 200 Q 398 188 385 182 L 355 178"
            fill="none" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 90 195 L 115 178 Q 116 162 122 148 Q 132 124 158 110 Q 188 96 232 92 Q 272 88 312 94 Q 346 99 366 119 Q 381 139 379 159 Q 377 171 368 178 L 355 178"
            fill="none" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 208 96 Q 240 90 274 94 L 270 138 Q 240 134 212 138 Z"
            fill="none" stroke={TEXT} strokeWidth="1.5" strokeDasharray="4 3" />
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1={215} y1={108 + i * 9} x2={265} y2={103 + i * 9}
              stroke={TEXT} strokeWidth="1.5" strokeLinecap="round" />
      ))}
      <path d="M 112 158 L 122 148" stroke={TEXT} strokeWidth="1" strokeDasharray="3 2" />
      <text x="240" y="248" textAnchor="middle" fontFamily={mono} fontSize="9" fill={TEXT} opacity="0.35">
        line art · no fill
      </text>
    </svg>
  );
}

function ShoeOutputSVG() {
  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="so-leather" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(175,115,65)" />
          <stop offset="100%" stopColor="rgb(112,70,36)" />
        </linearGradient>
        <linearGradient id="so-sole" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(90,88,90)" />
          <stop offset="100%" stopColor="rgb(52,52,52)" />
        </linearGradient>
      </defs>
      <rect width="480" height="260" fill={BG4} />
      <ellipse cx="235" cy="220" rx="160" ry="7" fill="rgba(0,0,0,0.45)" />
      <path d="M 90 195 Q 85 208 100 214 L 370 214 Q 390 214 395 200 Q 398 188 385 182 L 355 178 L 90 195 Z"
            fill="url(#so-sole)" stroke="rgb(42,42,42)" strokeWidth="1" />
      <path d="M 90 195 L 115 178 Q 116 162 122 148 Q 132 124 158 110 Q 188 96 232 92 Q 272 88 312 94 Q 346 99 366 119 Q 381 139 379 159 Q 377 171 368 178 L 355 178 L 90 195 Z"
            fill="url(#so-leather)" stroke="rgb(85,52,24)" strokeWidth="1" />
      <path d="M 208 96 Q 240 90 274 94 L 270 138 Q 240 134 212 138 Z"
            fill="rgb(155,100,55)" stroke="rgb(85,52,24)" strokeWidth="1" />
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1={215} y1={108 + i * 9} x2={265} y2={103 + i * 9}
              stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      ))}
      <path d="M 90 195 L 115 178 Q 116 162 122 148 Q 132 124 158 110 Q 188 96 232 92"
            fill="none" stroke="rgba(70,38,14,0.65)" strokeWidth="1" strokeDasharray="5 3" />
    </svg>
  );
}

// ── Task B: Map → Aerial ──────────────────────────────────────────────────────
function MapInputSVG() {
  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: 'block' }}>
      <rect width="480" height="260" fill="white" />
      <rect x="0" y="55" width="480" height="14" fill="#d2d2d2" />
      <rect x="0" y="125" width="480" height="14" fill="#d2d2d2" />
      <rect x="0" y="195" width="480" height="14" fill="#d2d2d2" />
      <rect x="55" y="0" width="14" height="260" fill="#d2d2d2" />
      <rect x="155" y="0" width="14" height="260" fill="#d2d2d2" />
      <rect x="265" y="0" width="14" height="260" fill="#d2d2d2" />
      <rect x="365" y="0" width="14" height="260" fill="#d2d2d2" />
      {[
        [70,10,78,38],[70,70,78,48],[170,10,88,38],[170,70,88,48],
        [70,140,78,48],[170,140,88,48],[70,210,78,44],[170,210,88,44],
        [380,10,90,108],[380,140,90,108],
      ].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="#e5e5e5" stroke="#bbb" strokeWidth="0.5" />
      ))}
      <rect x="280" y="10" width="78" height="108" fill="rgb(190,228,140)" stroke="#aac875" strokeWidth="0.5" />
      <text x="319" y="66" textAnchor="middle" fontFamily={sans} fontSize="9" fill="rgb(80,130,40)">PARK</text>
      <path d="M 0 218 Q 100 210 190 226 Q 280 242 380 222 L 480 228 L 480 260 L 0 260 Z"
            fill="rgb(135,185,235)" stroke="rgb(100,155,205)" strokeWidth="0.5" />
      <text x="109" y="50" textAnchor="middle" fontFamily={sans} fontSize="7" fill="#999">1st Ave</text>
      <text x="209" y="50" textAnchor="middle" fontFamily={sans} fontSize="7" fill="#999">2nd Ave</text>
    </svg>
  );
}

function MapOutputSVG() {
  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: 'block' }}>
      <rect width="480" height="260" fill="rgb(192,180,152)" />
      <rect x="0" y="55" width="480" height="14" fill="rgb(105,100,95)" />
      <rect x="0" y="125" width="480" height="14" fill="rgb(105,100,95)" />
      <rect x="0" y="195" width="480" height="14" fill="rgb(105,100,95)" />
      <rect x="55" y="0" width="14" height="260" fill="rgb(105,100,95)" />
      <rect x="155" y="0" width="14" height="260" fill="rgb(105,100,95)" />
      <rect x="265" y="0" width="14" height="260" fill="rgb(105,100,95)" />
      <rect x="365" y="0" width="14" height="260" fill="rgb(105,100,95)" />
      {[
        [70,10,78,38],[70,70,78,48],[170,10,88,38],[170,70,88,48],
        [70,140,78,48],[170,140,88,48],[70,210,78,44],[170,210,88,44],
        [380,10,90,108],[380,140,90,108],
      ].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="rgb(142,130,108)" />
      ))}
      <rect x="280" y="10" width="78" height="108" fill="rgb(62,112,55)" />
      {[[292,22],[315,32],[338,18],[298,52],[326,62],[308,78],[290,95],[340,84]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="rgb(45,88,40)" />
      ))}
      <path d="M 0 218 Q 100 210 190 226 Q 280 242 380 222 L 480 228 L 480 260 L 0 260 Z"
            fill="rgb(55,105,168)" />
      <path d="M 15 232 Q 55 226 88 234 Q 128 242 162 234 Q 202 226 240 234 Q 280 242 318 232 Q 358 222 400 232"
            fill="none" stroke="rgba(88,145,210,0.5)" strokeWidth="1.5" />
    </svg>
  );
}

// ── Task C: Day → Night ───────────────────────────────────────────────────────
function DayInputSVG() {
  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="di-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(100,168,235)" />
          <stop offset="70%" stopColor="rgb(170,210,250)" />
          <stop offset="100%" stopColor="rgb(215,232,252)" />
        </linearGradient>
      </defs>
      <rect width="480" height="205" fill="url(#di-sky)" />
      <circle cx="408" cy="52" r="26" fill="rgb(255,228,72)" />
      <circle cx="408" cy="52" r="36" fill="rgba(255,228,72,0.22)" />
      <ellipse cx="100" cy="68" rx="48" ry="17" fill="white" opacity="0.88" />
      <ellipse cx="128" cy="56" rx="34" ry="20" fill="white" opacity="0.92" />
      <ellipse cx="84"  cy="60" rx="27" ry="15" fill="white" opacity="0.82" />
      <ellipse cx="295" cy="88" rx="38" ry="14" fill="white" opacity="0.78" />
      <ellipse cx="318" cy="78" rx="27" ry="15" fill="white" opacity="0.82" />
      <rect x="15"  y="128" width="58" height="132" fill="rgb(238,232,220)" />
      <rect x="20"  y="100" width="48" height="32"  fill="rgb(230,224,212)" />
      <rect x="85"  y="152" width="68" height="108" fill="rgb(242,236,224)" />
      <rect x="90"  y="138" width="58" height="18"  fill="rgb(234,228,215)" />
      <rect x="165" y="118" width="78" height="142" fill="rgb(235,228,212)" />
      <rect x="170" y="98"  width="68" height="24"  fill="rgb(226,220,205)" />
      <rect x="255" y="138" width="53" height="122" fill="rgb(240,234,220)" />
      <rect x="320" y="158" width="62" height="102" fill="rgb(236,230,215)" />
      <rect x="395" y="142" width="78" height="118" fill="rgb(242,235,222)" />
      {[
        [22,142,10,12],[40,142,10,12],[22,168,10,12],[40,168,10,12],
        [92,165,10,10],[118,165,10,10],[92,185,10,10],[118,185,10,10],
        [175,130,12,10],[200,130,12,10],[175,152,12,10],[200,152,12,10],
      ].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="rgb(195,220,245)" />
      ))}
      <rect x="0" y="200" width="480" height="60" fill="rgb(155,152,148)" />
      <rect x="0" y="197" width="480" height="6"  fill="rgb(95,130,75)" />
    </svg>
  );
}

function NightOutputSVG() {
  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ni-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgb(5,8,30)" />
          <stop offset="65%"  stopColor="rgb(12,18,52)" />
          <stop offset="100%" stopColor="rgb(22,28,62)" />
        </linearGradient>
      </defs>
      <rect width="480" height="205" fill="url(#ni-sky)" />
      {[[28,18],[75,38],[145,12],[215,28],[308,10],[375,38],[442,22],[58,58],[168,52],[350,62],[418,48],[250,20],[462,72]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 1.5 : 1} fill="white" opacity={0.5 + (i * 0.04) % 0.45} />
      ))}
      <circle cx="408" cy="52" r="22" fill="rgb(218,218,205)" />
      <circle cx="416" cy="46" r="19" fill="rgb(12,18,52)" />
      <rect x="15"  y="128" width="58" height="132" fill="rgb(18,22,38)" />
      <rect x="20"  y="100" width="48" height="32"  fill="rgb(14,18,32)" />
      <rect x="85"  y="152" width="68" height="108" fill="rgb(16,20,36)" />
      <rect x="90"  y="138" width="58" height="18"  fill="rgb(12,16,30)" />
      <rect x="165" y="118" width="78" height="142" fill="rgb(14,18,34)" />
      <rect x="170" y="98"  width="68" height="24"  fill="rgb(11,15,28)" />
      <rect x="255" y="138" width="53" height="122" fill="rgb(18,22,40)" />
      <rect x="320" y="158" width="62" height="102" fill="rgb(16,20,38)" />
      <rect x="395" y="142" width="78" height="118" fill="rgb(14,18,34)" />
      {[
        [22,142,10,12],[40,168,10,12],
        [92,165,10,10],[118,185,10,10],[92,185,10,10],
        [175,130,12,10],[200,152,12,10],[175,172,12,10],[210,138,12,10],
        [262,148,10,10],[278,165,10,10],[262,182,10,10],
        [325,168,10,10],[350,158,10,10],[328,188,10,10],
        [402,155,10,10],[425,170,10,10],[402,182,10,10],[448,160,10,10],
      ].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="rgb(255,208,72)" opacity="0.88" />
      ))}
      <rect x="0" y="200" width="480" height="60" fill="rgb(15,18,26)" />
      <circle cx="115" cy="200" r="20" fill="rgba(255,195,72,0.10)" />
      <circle cx="295" cy="200" r="20" fill="rgba(255,195,72,0.10)" />
      <circle cx="445" cy="200" r="20" fill="rgba(255,195,72,0.10)" />
    </svg>
  );
}

// ── Task D: Edges → Handbag ───────────────────────────────────────────────────
function BagInputSVG() {
  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: 'block' }}>
      <rect width="480" height="260" fill="rgb(4,4,4)" />
      <path d="M 185 112 Q 185 62 240 56 Q 295 62 295 112"
            fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <rect x="138" y="112" width="204" height="132" rx="12"
            fill="none" stroke="white" strokeWidth="2" />
      <line x1="142" y1="135" x2="338" y2="135" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="228" y="129" width="24" height="11" rx="3"
            fill="none" stroke="white" strokeWidth="1.5" />
      <rect x="152" y="123" width="176" height="108" rx="8"
            fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1" strokeDasharray="5 4" />
      <line x1="145" y1="226" x2="335" y2="226" stroke="rgba(255,255,255,0.48)" strokeWidth="1" />
      <path d="M 185 112 Q 185 62 240 56 Q 295 62 295 112"
            fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  );
}

function BagOutputSVG() {
  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="bo-leather" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="rgb(132,85,48)" />
          <stop offset="50%"  stopColor="rgb(108,68,36)" />
          <stop offset="100%" stopColor="rgb(85,52,26)" />
        </linearGradient>
        <linearGradient id="bo-handle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgb(98,62,34)" />
          <stop offset="50%"  stopColor="rgb(142,90,52)" />
          <stop offset="100%" stopColor="rgb(98,62,34)" />
        </linearGradient>
        <linearGradient id="bo-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.09)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>
      <rect width="480" height="260" fill={BG4} />
      <ellipse cx="240" cy="248" rx="112" ry="7" fill="rgba(0,0,0,0.52)" />
      <rect x="138" y="112" width="204" height="132" rx="12" fill="url(#bo-leather)" />
      <rect x="138" y="112" width="204" height="60"  rx="12" fill="url(#bo-sheen)" />
      <path d="M 185 112 Q 185 62 240 56 Q 295 62 295 112"
            fill="none" stroke="url(#bo-handle)" strokeWidth="14" strokeLinecap="round" />
      <path d="M 185 112 Q 185 62 240 56 Q 295 62 295 112"
            fill="none" stroke="rgba(55,30,12,0.6)" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="142" y1="135" x2="338" y2="135" stroke="rgb(205,162,48)" strokeWidth="3.5" />
      <rect x="228" y="129" width="24" height="11" rx="3"
            fill="rgb(205,162,48)" stroke="rgb(165,128,35)" strokeWidth="1" />
      <rect x="152" y="123" width="176" height="108" rx="8"
            fill="none" stroke="rgba(58,32,12,0.5)" strokeWidth="1" strokeDasharray="5 4" />
      <line x1="145" y1="226" x2="335" y2="226" stroke="rgba(58,32,12,0.5)" strokeWidth="1" />
    </svg>
  );
}

// ── Task E: Labels → Facade ───────────────────────────────────────────────────
function FacadeInputSVG() {
  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: 'block' }}>
      <rect width="480" height="260" fill="#111" />
      <rect x="55" y="18" width="370" height="44" fill="rgb(118,118,120)" />
      <text x="240" y="44" textAnchor="middle" fontFamily={mono} fontSize="10" fill="rgba(255,255,255,0.65)">ROOF</text>
      <rect x="55" y="62" width="370" height="138" fill="rgb(218,78,58)" />
      <text x="240" y="135" textAnchor="middle" fontFamily={mono} fontSize="10" fill="rgba(255,255,255,0.55)">WALL</text>
      {[80, 168, 256, 344].map((x, i) => (
        <rect key={i} x={x} y={76} width={52} height={50} fill="rgb(55,118,198)" />
      ))}
      {[80, 344].map((x, i) => (
        <rect key={i} x={x} y={144} width={52} height={50} fill="rgb(55,118,198)" />
      ))}
      <rect x="188" y="144" width="104" height="56" fill="rgb(75,158,75)" />
      <text x="106" y="106" textAnchor="middle" fontFamily={mono} fontSize="9" fill="rgba(255,255,255,0.8)">WIN</text>
      <text x="240" y="176" textAnchor="middle" fontFamily={mono} fontSize="8" fill="rgba(255,255,255,0.8)">DOOR</text>
      <rect x="55" y="200" width="370" height="44" fill="rgb(155,155,158)" />
      <text x="240" y="226" textAnchor="middle" fontFamily={mono} fontSize="10" fill="rgba(255,255,255,0.45)">GROUND</text>
    </svg>
  );
}

function FacadeOutputSVG() {
  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <pattern id="fo-brick" x="0" y="0" width="22" height="11" patternUnits="userSpaceOnUse">
          <rect width="22" height="11" fill="rgb(160,72,48)" />
          <rect x="1" y="1" width="9"  height="9" fill="rgb(172,82,56)" />
          <rect x="12" y="1" width="9" height="9" fill="rgb(166,76,52)" />
        </pattern>
        <pattern id="fo-tile" x="0" y="0" width="18" height="14" patternUnits="userSpaceOnUse">
          <rect width="18" height="14" fill="rgb(88,90,96)" />
          <rect x="1" y="1" width="16" height="12" fill="rgb(100,102,108)" rx="1" />
        </pattern>
        <pattern id="fo-ground" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill="rgb(148,142,136)" />
          <line x1="40" y1="0" x2="40" y2="20" stroke="rgb(128,122,116)" strokeWidth="0.8" />
          <line x1="0" y1="20" x2="40" y2="20" stroke="rgb(128,122,116)" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="480" height="260" fill={BG4} />
      <rect x="55" y="18" width="370" height="44" fill="url(#fo-tile)" />
      <rect x="55" y="18" width="370" height="44" fill="none" stroke="rgb(68,70,75)" strokeWidth="0.5" />
      <rect x="55" y="62" width="370" height="138" fill="url(#fo-brick)" />
      {[80, 168, 256, 344].map((x, i) => (
        <g key={i}>
          <rect x={x} y={76} width={52} height={50} fill="rgb(35,72,128)" />
          <rect x={x} y={76} width={25} height={24} fill="rgba(80,128,200,0.45)" />
          <rect x={x} y={76} width={8}  height={50} fill="rgba(255,255,255,0.06)" />
          <rect x={x} y={76} width={52} height={50} fill="none" stroke="rgb(52,52,56)" strokeWidth="2" />
          <line x1={x + 26} y1={76}  x2={x + 26} y2={126} stroke="rgb(52,52,56)" strokeWidth="1.5" />
          <line x1={x}      y1={101} x2={x + 52} y2={101} stroke="rgb(52,52,56)" strokeWidth="1.5" />
        </g>
      ))}
      {[80, 344].map((x, i) => (
        <g key={i}>
          <rect x={x} y={144} width={52} height={50} fill="rgb(35,72,128)" />
          <rect x={x} y={144} width={25} height={24} fill="rgba(80,128,200,0.45)" />
          <rect x={x} y={144} width={8}  height={50} fill="rgba(255,255,255,0.06)" />
          <rect x={x} y={144} width={52} height={50} fill="none" stroke="rgb(52,52,56)" strokeWidth="2" />
          <line x1={x + 26} y1={144} x2={x + 26} y2={194} stroke="rgb(52,52,56)" strokeWidth="1.5" />
          <line x1={x}      y1={169} x2={x + 52} y2={169} stroke="rgb(52,52,56)" strokeWidth="1.5" />
        </g>
      ))}
      <rect x="188" y="144" width="104" height="56" fill="rgb(100,65,30)" />
      <rect x="193" y="149" width="45"  height="46" fill="rgb(112,72,34)" stroke="rgb(80,48,20)" strokeWidth="1" />
      <rect x="242" y="149" width="45"  height="46" fill="rgb(108,70,32)" stroke="rgb(80,48,20)" strokeWidth="1" />
      <circle cx="237" cy="175" r="4" fill="rgb(198,162,48)" />
      <circle cx="243" cy="175" r="4" fill="rgb(198,162,48)" />
      <rect x="55" y="200" width="370" height="44" fill="url(#fo-ground)" />
    </svg>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────
function StatRow({ label, val, valStyle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px', gap: '6px' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0 }}>{label}:</span>
      <span style={{ color: 'var(--text)', fontSize: '11px', textAlign: 'right', ...valStyle }}>{val}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />;
}

// ── SVG component map ─────────────────────────────────────────────────────────
const SVG_MAP = {
  shoe:   { Input: ShoeInputSVG,   Output: ShoeOutputSVG   },
  map:    { Input: MapInputSVG,    Output: MapOutputSVG    },
  day:    { Input: DayInputSVG,    Output: NightOutputSVG  },
  bag:    { Input: BagInputSVG,    Output: BagOutputSVG    },
  facade: { Input: FacadeInputSVG, Output: FacadeOutputSVG },
};

// ── Main widget ───────────────────────────────────────────────────────────────
export default function PairedTranslation() {
  const [taskIdx,    setTaskIdx]    = useState(0);
  const [sliderPos,  setSliderPos]  = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const dragRef      = useRef(false);

  const task = TASKS[taskIdx];
  const { Input, Output } = SVG_MAP[task.id];

  // Attach global mouse listeners for smooth drag
  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setSliderPos(pct);
    }
    function onUp() {
      dragRef.current = false;
      setIsDragging(false);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  // Cycle: 0 → 50 → 100 → 0
  const toggleView = () => setSliderPos(p => p < 25 ? 50 : p < 75 ? 100 : 0);

  // Container aspect ratio from viewBox 480×260
  const ASPECT_PT = (260 / 480) * 100;

  return (
    <WidgetCard title="Paired Translation — 5 pix2pix Tasks" number="18.3">

      {/* Task selector tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {TASKS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => { setTaskIdx(i); setSliderPos(50); }}
            style={{
              flex: 1,
              padding: '6px 4px',
              fontFamily: mono,
              fontSize: '10px',
              fontWeight: taskIdx === i ? 600 : 400,
              color: taskIdx === i ? 'var(--accent)' : 'var(--text-mid)',
              background: taskIdx === i ? 'var(--accent-dim)' : 'var(--bg4)',
              border: '1px solid',
              borderColor: taskIdx === i ? 'var(--accent)' : 'var(--border)',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t.tab}
          </button>
        ))}
      </div>

      {/* Main row: showcase column + stats panel */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Left: showcase + loss formula */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Showcase panel */}
          <div style={{ background: 'var(--bg3)', borderRadius: '12px', padding: '20px', marginBottom: '8px' }}>

            {/* Task title + dataset */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontFamily: serif, fontSize: '17px', color: 'var(--text)', marginBottom: '4px' }}>
                {task.title}
              </div>
              <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text-mid)' }}>
                {task.dataset}
              </div>
            </div>

            {/* Before/after image area */}
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: `${ASPECT_PT}%`,
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '14px',
                cursor: isDragging ? 'ew-resize' : 'col-resize',
                userSelect: 'none',
              }}
              onMouseDown={(e) => {
                const rect = containerRef.current.getBoundingClientRect();
                const pct  = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                setSliderPos(pct);
                dragRef.current = true;
                setIsDragging(true);
              }}
            >
              {/* Input layer */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <Input />
              </div>

              {/* Output layer — clips everything left of sliderPos */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                clipPath: `inset(0 0 0 ${sliderPos}%)`,
              }}>
                <Output />
              </div>

              {/* Vertical divider */}
              <div style={{
                position: 'absolute',
                top: 0, bottom: 0,
                left: `${sliderPos}%`,
                width: '2px',
                background: 'var(--accent)',
                transform: 'translateX(-1px)',
                pointerEvents: 'none',
                zIndex: 5,
              }} />

              {/* Drag handle (pointer-events none — parent div handles drag) */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: `${sliderPos}%`,
                transform: 'translate(-50%, -50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(45,212,191,0.45)',
                pointerEvents: 'none',
                zIndex: 10,
              }}>
                <svg width="16" height="10" viewBox="0 0 16 10" style={{ display: 'block' }}>
                  <path d="M 0 5 L 5 1 L 5 9 Z" fill="white" />
                  <path d="M 16 5 L 11 1 L 11 9 Z" fill="white" />
                  <line x1="5" y1="5" x2="11" y2="5" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>

              {/* INPUT label */}
              <div style={{
                position: 'absolute', top: '8px', left: '10px',
                fontFamily: mono, fontSize: '10px', fontWeight: 700,
                color: 'var(--accent)', letterSpacing: '0.08em',
                pointerEvents: 'none', zIndex: 6,
                opacity: sliderPos > 6 ? 1 : 0,
                transition: 'opacity 0.2s',
              }}>
                INPUT
              </div>

              {/* OUTPUT label */}
              <div style={{
                position: 'absolute', top: '8px', right: '10px',
                fontFamily: mono, fontSize: '10px', fontWeight: 700,
                color: 'var(--accent)', letterSpacing: '0.08em',
                pointerEvents: 'none', zIndex: 6,
                opacity: sliderPos < 94 ? 1 : 0,
                transition: 'opacity 0.2s',
              }}>
                OUTPUT
              </div>
            </div>

            {/* Task description */}
            <p style={{
              fontFamily: sans, fontSize: '12px', color: '#b8c4cc',
              textAlign: 'center', margin: '0 auto 14px', lineHeight: 1.65,
              maxWidth: '460px',
            }}>
              {task.desc}
            </p>

            {/* Reveal controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text-mid)', flexShrink: 0 }}>
                Reveal
              </span>
              <input
                type="range" min={0} max={100}
                value={Math.round(sliderPos)}
                onChange={e => setSliderPos(Number(e.target.value))}
                style={{ flex: 1, minWidth: 80 }}
              />
              <span style={{
                fontFamily: mono, fontSize: '10px', color: 'var(--accent)',
                width: '44px', flexShrink: 0, textAlign: 'right',
              }}>
                {Math.round(sliderPos)}% out
              </span>
              <button
                onClick={toggleView}
                style={{
                  fontFamily: mono, fontSize: '10px',
                  padding: '4px 10px',
                  background: 'var(--bg4)',
                  color: 'var(--text-mid)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Toggle
              </button>
            </div>
          </div>

          {/* Loss formula panel */}
          <div style={{ background: 'var(--bg4)', borderRadius: '6px', padding: '12px 16px' }}>
            <div style={{
              fontFamily: mono, fontSize: '14px',
              color: '#fbbf24',
              textAlign: 'center', marginBottom: '8px',
            }}>
              L = L_cGAN(G, D) + λ · L_L1(G)
            </div>
            <div style={{
              fontFamily: mono, fontSize: '10px',
              color: 'var(--text-mid)',
              lineHeight: 1.75, textAlign: 'center',
            }}>
              L_cGAN: discriminator adversarial signal (high frequency)<br />
              L_L1: pixel-wise reconstruction loss (low frequency, ground truth)<br />
              λ ≈ 100: balances the two losses
            </div>
          </div>
        </div>

        {/* Right: stats panel */}
        <div style={{
          width: '180px', flexShrink: 0,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '14px 16px',
          fontFamily: mono, fontSize: '11px',
        }}>
          <StatRow label="Task" val={task.tab} valStyle={{ fontSize: '9px', color: 'var(--accent)' }} />
          <Divider />
          <StatRow label="Direction" val="in → out" valStyle={{ fontSize: '10px' }} />
          <StatRow label="Slider" val={`${Math.round(sliderPos)}% out`} valStyle={{ color: 'var(--accent)' }} />
          <Divider />
          <div style={{ fontSize: '10px', color: 'var(--text-mid)', marginBottom: '4px' }}>Dataset (paired):</div>
          <div style={{ fontSize: '10px', color: 'var(--text)', lineHeight: 1.4, marginBottom: '10px' }}>
            {task.dataset}
          </div>
          <Divider />
          <div style={{ fontSize: '10px', color: 'var(--text-mid)', marginBottom: '6px' }}>Training:</div>
          <StatRow label="Loss" val="cGAN + λ·L1" valStyle={{ fontSize: '9px' }} />
          <StatRow label="λ" val="100 (default)" valStyle={{ fontSize: '9px' }} />
          <StatRow label="Gen" val="U-Net" valStyle={{ fontSize: '9px' }} />
          <StatRow label="Disc" val="PatchGAN" valStyle={{ fontSize: '9px' }} />
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', paddingLeft: '4px', marginBottom: '8px' }}>
            70×70 patches
          </div>
          <Divider />
          <div style={{ fontSize: '10px', color: 'var(--text-mid)', marginBottom: '4px' }}>Inference:</div>
          <div style={{ fontSize: '9px', color: 'var(--text)', lineHeight: 1.65 }}>
            Single forward pass.<br />
            No iteration needed.<br />
            ~tens of ms / image.
          </div>
          <Divider />
          <div style={{
            fontFamily: sans, fontSize: '10px',
            color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5,
          }}>
            Illustrations are stylized for clarity. Actual pix2pix outputs use real images.
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
