import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { WORLD_LAND } from "@/lib/worldLand";

/**
 * The World of Books globe — a toy planet whose pins are real books.
 *
 * Coastlines are REAL geography: Natural Earth 110m land (public domain, via
 * world-atlas@2), converted offline to a compact ring list in
 * src/lib/worldLand.ts. The first version hand-drew the continents and Lynden
 * called it what it was — "looks like a 2 year old drew it".
 *
 * Pins are round flag badges (flag images from flagcdn, because emoji flags
 * render as bare letter pairs on Windows Chrome), sized by book count, with a
 * gentle lighthouse pulse. Clicking one tells the page, which pops the
 * country's books up next to the globe.
 *
 * Projection is a plain orthographic — ~15 lines of trigonometry — because
 * d3-geo/three.js would cost more bundle than this whole feature is worth.
 */

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "United Kingdom": [-2.0, 54.0], "United States": [-98.0, 39.5], "Saudi Arabia": [45.0, 24.0],
  "United Arab Emirates": [54.0, 24.0], Egypt: [30.0, 26.8], Pakistan: [69.3, 30.4],
  India: [78.9, 20.6], Nigeria: [8.7, 9.1], Ghana: [-1.0, 7.9], Kenya: [37.9, -0.02],
  "South Africa": [24.7, -29.0], Jamaica: [-77.3, 18.1], Poland: [19.1, 51.9],
  Romania: [24.9, 45.9], Turkey: [35.2, 39.0], Bangladesh: [90.4, 23.7], China: [104.2, 35.9],
  Japan: [138.3, 36.2], Philippines: [121.8, 12.9], Brazil: [-51.9, -14.2],
  Mexico: [-102.6, 23.6], France: [2.2, 46.2], Spain: [-3.7, 40.5], Italy: [12.6, 41.9],
  Germany: [10.5, 51.2], Ireland: [-8.2, 53.4], Australia: [133.8, -25.3],
  Somalia: [46.2, 5.2], Morocco: [-7.1, 31.8], Malaysia: [101.98, 4.2], Indonesia: [113.9, -0.8],
  Nepal: [84.1, 28.4], "Trinidad and Tobago": [-61.2, 10.7], Iceland: [-19.0, 64.9],
  Thailand: [100.99, 15.87], "South Korea": [127.8, 36.5], Sweden: [18.6, 60.1],
  Colombia: [-74.3, 4.6],
};

// ISO-3166 alpha-2 for flag artwork. Anything absent renders a warm fallback
// badge instead — reserved for a future pin whose story genuinely names no
// country (none currently do; the Jam Jug was the last one, now Saudi Arabia).
const COUNTRY_ISO: Record<string, string> = {
  "United Kingdom": "gb", "United States": "us", "Saudi Arabia": "sa",
  "United Arab Emirates": "ae", Egypt: "eg", Pakistan: "pk", India: "in",
  Nigeria: "ng", Ghana: "gh", Kenya: "ke", "South Africa": "za", Jamaica: "jm",
  Poland: "pl", Romania: "ro", Turkey: "tr", Bangladesh: "bd", China: "cn",
  Japan: "jp", Philippines: "ph", Brazil: "br", Mexico: "mx", France: "fr",
  Spain: "es", Italy: "it", Germany: "de", Ireland: "ie", Australia: "au",
  Somalia: "so", Morocco: "ma", Malaysia: "my", Indonesia: "id", Nepal: "np",
  "Trinidad and Tobago": "tt", Iceland: "is", Thailand: "th", "South Korea": "kr",
  Sweden: "se", Colombia: "co",
};

export function flagUrl(country: string, size: 40 | 80 = 40): string | null {
  const iso = COUNTRY_ISO[country];
  return iso ? `https://flagcdn.com/w${size}/${iso}.png` : null;
}

const DEG = Math.PI / 180;

export interface GlobePin {
  country: string;
  flag: string;   // emoji fallback (used when no flag artwork exists)
  count: number;
}

export default function WorldGlobe({
  pins, selected, onSelect,
}: {
  pins: GlobePin[];
  selected: string | null;
  onSelect: (country: string | null) => void;
}) {
  const [rot, setRot] = useState<[number, number]>([-10, -18]);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; rot: [number, number] } | null>(null);
  const SIZE = 460;
  const R = (SIZE / 2 - 42) * zoom;
  const [cx, cy] = [SIZE / 2, SIZE / 2];

  // Idle spin, paused whenever the user is looking at something specific.
  useEffect(() => {
    if (dragging || selected || zoom > 1.15) return;
    let raf = 0;
    let last = performance.now();
    const spin = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setRot(([lon, lat]) => [lon + dt * 2.6, lat]);
      raf = requestAnimationFrame(spin);
    };
    raf = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(raf);
  }, [dragging, selected, zoom]);

  const project = useMemo(() => {
    const [l0, p0] = [rot[0] * DEG, rot[1] * DEG];
    const sinP0 = Math.sin(p0), cosP0 = Math.cos(p0);
    return (lon: number, lat: number) => {
      const l = lon * DEG - l0, p = lat * DEG;
      const sinP = Math.sin(p), cosP = Math.cos(p), cosL = Math.cos(l);
      const cosc = sinP0 * sinP + cosP0 * cosP * cosL;
      return {
        x: cx + R * (cosP * Math.sin(l)),
        y: cy - R * (cosP0 * sinP - sinP0 * cosP * cosL),
        front: cosc > 0,
      };
    };
  }, [rot, R, cx, cy]);

  // Real coastlines with clean horizon handling. The first pass split each
  // ring into front-facing runs and closed them individually — the implicit
  // closing chords painted slivers along the limb and stray shapes near the
  // horizon (Lynden 2026-08-08: "looks a bit glitchy"). Now every ring stays
  // CLOSED: back-hemisphere points are pushed outward to the horizon circle
  // in the direction they project, the whole path is clipped to the globe
  // disc, and rings with no visible points are skipped entirely (otherwise a
  // fully-hidden continent would wrap the rim and flood-fill the planet).
  // fillRule="evenodd" makes hole rings real holes — the Caspian reads as
  // water instead of vanishing into the land fill.
  const landPath = useMemo(() => {
    let d = "";
    for (const ring of WORLD_LAND) {
      const pts = ring.map(([lon, lat]) => project(lon, lat));
      if (!pts.some((q) => q.front)) continue;
      let seg = "";
      for (let i = 0; i < pts.length; i++) {
        const q = pts[i];
        let x = q.x, y = q.y;
        if (!q.front) {
          const dx = x - cx, dy = y - cy;
          const len = Math.hypot(dx, dy) || 1;
          x = cx + (dx / len) * R * 1.001;
          y = cy + (dy / len) * R * 1.001;
        }
        seg += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      }
      d += seg + "Z";
    }
    return d;
  }, [project, cx, cy, R]);

  const graticule = useMemo(() => {
    const out: string[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      let d = "", open = false;
      for (let lon = -180; lon <= 180; lon += 5) {
        const q = project(lon, lat);
        if (!q.front) { open = false; continue; }
        d += `${open ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)} `;
        open = true;
      }
      if (d) out.push(d);
    }
    for (let lon = -180; lon < 180; lon += 30) {
      let d = "", open = false;
      for (let lat = -85; lat <= 85; lat += 5) {
        const q = project(lon, lat);
        if (!q.front) { open = false; continue; }
        d += `${open ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)} `;
        open = true;
      }
      if (d) out.push(d);
    }
    return out;
  }, [project]);

  const placed = pins
    .map((p) => ({ pin: p, at: COUNTRY_COORDS[p.country] }))
    .filter((p) => p.at)
    .map((p) => ({ ...p, q: project(p.at![0], p.at![1]) }));
  const offGlobe = pins.filter((p) => !COUNTRY_COORDS[p.country]);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, rot };
    setDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    const k = 0.35 / zoom;
    setRot([
      drag.current.rot[0] + dx * k,
      Math.max(-85, Math.min(85, drag.current.rot[1] - dy * k)),
    ]);
  };
  const onUp = () => { drag.current = null; setDragging(false); };

  return (
    <div className="relative mx-auto" style={{ maxWidth: SIZE }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full touch-none select-none"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        onWheel={(e) => setZoom((z) => Math.max(0.8, Math.min(3, z - e.deltaY * 0.001)))}
        role="img"
        aria-label="Globe showing where every book's story lives"
      >
        <defs>
          <radialGradient id="wg-ocean" cx="34%" cy="28%">
            <stop offset="0%" stopColor="#a5ddfb" />
            <stop offset="55%" stopColor="#5fc4f5" />
            <stop offset="100%" stopColor="#2f9fe0" />
          </radialGradient>
          <radialGradient id="wg-atmo" cx="50%" cy="50%">
            <stop offset="62%" stopColor="#7dd3fc" stopOpacity="0" />
            <stop offset="84%" stopColor="#bae6fd" stopOpacity="0.5" />
            <stop offset="96%" stopColor="#e0f2fe" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wg-shade" cx="32%" cy="26%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="88%" stopColor="#075985" stopOpacity="0" />
            <stop offset="100%" stopColor="#075985" stopOpacity="0.18" />
          </radialGradient>
          <filter id="wg-pin-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor="#0f172a" floodOpacity="0.30" />
          </filter>
        </defs>

        {/* soft ground shadow so the planet sits rather than floats */}
        <ellipse cx={cx} cy={cy + R + 14} rx={R * 0.62} ry={9} fill="#0c4a6e" opacity={0.08} />

        <circle cx={cx} cy={cy} r={Math.min(R * 1.22, SIZE / 2)} fill="url(#wg-atmo)" />
        <circle cx={cx} cy={cy} r={R} fill="url(#wg-ocean)" />
        {graticule.map((d, i) => (
          <path key={`g${i}`} d={d} fill="none" stroke="#ffffff" strokeOpacity={0.16} strokeWidth={0.5} />
        ))}
        <clipPath id="wg-globe-clip">
          <circle cx={cx} cy={cy} r={R} />
        </clipPath>
        <g clipPath="url(#wg-globe-clip)">
          <path
            d={landPath}
            fill="#b6e3a0"
            fillRule="evenodd"
            stroke="#7ec983"
            strokeWidth={0.6}
            strokeLinejoin="round"
          />
        </g>
        <circle cx={cx} cy={cy} r={R} fill="url(#wg-shade)" />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#7dd3fc" strokeOpacity={0.8} strokeWidth={1.2} />

        {placed.filter((p) => p.q.front).map(({ pin, q }) => {
          const on = selected === pin.country;
          const r = Math.min(15, 9 + pin.count * 0.8) * Math.min(1.3, zoom);
          const flag = flagUrl(pin.country);
          return (
            <g
              key={pin.country}
              transform={`translate(${q.x.toFixed(1)}, ${q.y.toFixed(1)})`}
              onClick={(e) => { e.stopPropagation(); onSelect(on ? null : pin.country); }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{ cursor: "pointer" }}
            >
              {/* lighthouse pulse — one soft ring, never a strobe */}
              <circle r={r + 2.5} fill="none" stroke={on ? "#8b5cf6" : "#f59e0b"} strokeWidth={1.3} opacity={0.7}>
                <animate attributeName="r" values={`${r + 2.5};${r + 10}`} dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" dur="2.6s" repeatCount="indefinite" />
              </circle>
              {/* white badge ring, flag clipped inside */}
              <g filter="url(#wg-pin-shadow)">
                <circle r={r + 2.5} fill="#ffffff" />
              </g>
              <circle r={r + 2.5} fill="none" stroke={on ? "#8b5cf6" : "#e2e8f0"} strokeWidth={on ? 2 : 1} />
              {flag ? (
                <>
                  <clipPath id={`wg-clip-${COUNTRY_ISO[pin.country]}`}>
                    <circle r={r} />
                  </clipPath>
                  {/* under the image: never a blank white badge while the
                      flag artwork is still loading (or blocked) */}
                  <circle r={r} fill="#e2e8f0" />
                  <text y={r * 0.38} textAnchor="middle" fontSize={r} opacity={0.9}>{pin.flag}</text>
                  <image
                    href={flag}
                    x={-r * 1.35} y={-r} width={r * 2.7} height={r * 2}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#wg-clip-${COUNTRY_ISO[pin.country]})`}
                  />
                  <circle r={r} fill="none" stroke="#0f172a" strokeOpacity={0.12} strokeWidth={0.8} />
                </>
              ) : (
                <>
                  <circle r={r} fill="#fef3c7" />
                  <text y={r * 0.38} textAnchor="middle" fontSize={r * 1.05}>{pin.flag}</text>
                </>
              )}
              {pin.count > 1 && (
                <g transform={`translate(${r * 0.95}, ${-r * 0.95})`}>
                  <circle r={6.5} fill="#0f172a" stroke="#ffffff" strokeWidth={1.4} />
                  <text y={2.6} textAnchor="middle" fontSize={7.5} fontWeight={800} fill="#ffffff">{pin.count}</text>
                </g>
              )}
              <title>{`${pin.country} — ${pin.count} book${pin.count === 1 ? "" : "s"}`}</title>
            </g>
          );
        })}
      </svg>

      <div className="absolute right-1 top-8 flex flex-col gap-1.5">
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} aria-label="Zoom in"
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"><Plus className="h-4 w-4" /></button>
        <button onClick={() => setZoom((z) => Math.max(0.8, z - 0.25))} aria-label="Zoom out"
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"><Minus className="h-4 w-4" /></button>
        <button onClick={() => { setZoom(1); setRot([-10, -18]); onSelect(null); }} aria-label="Reset globe"
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"><RotateCcw className="h-4 w-4" /></button>
      </div>

      <p className="mt-1 text-center text-xs text-muted-foreground">drag to spin · scroll to zoom · tap a flag</p>

      {offGlobe.length > 0 && (
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Also from {offGlobe.map((p) => `${p.flag} ${p.country}`).join(", ")}
        </p>
      )}
    </div>
  );
}
