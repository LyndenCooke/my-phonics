import { useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

/**
 * A spinnable, zoomable globe showing where in the world each family's book
 * was made. Dependency-free on purpose: an orthographic projection is about
 * fifteen lines of trigonometry, and the alternatives (d3-geo + a TopoJSON
 * world, react-simple-maps, three.js) would each add far more weight to the
 * bundle than this whole feature is worth.
 *
 * The land outlines are STYLISED, not survey-accurate — coarse polygons that
 * read as Earth at 400px for a children's product. They are decoration; the
 * pins carry the actual information, and those are placed on real coordinates.
 */

// Real lat/lon for every country the Create-A-Book wizard offers, so a pin
// lands where the family actually is. Anything unlisted falls back to 0,0 and
// is drawn at the bottom of the panel as "elsewhere" rather than in the ocean.
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
};

// Coarse continent blobs in [lon, lat]. Deliberately low-detail.
const LAND: Array<Array<[number, number]>> = [
  // Africa
  [[-17, 15], [-16, 12], [-8, 4], [3, 6], [9, 4], [9, -1], [12, -6], [13, -17], [15, -23],
   [20, -35], [27, -34], [33, -26], [40, -16], [41, -2], [51, 12], [43, 12], [37, 22],
   [34, 31], [25, 32], [10, 37], [-6, 36], [-10, 30], [-17, 21]],
  // Europe
  [[-10, 43], [-2, 43], [3, 42], [12, 38], [16, 41], [24, 40], [28, 41], [30, 46], [38, 48],
   [40, 55], [30, 60], [30, 70], [22, 70], [12, 65], [5, 62], [8, 55], [4, 51], [-2, 50],
   [-5, 48], [-9, 44]],
  // British Isles
  [[-6, 50], [1, 51], [-1, 56], [-3, 59], [-6, 58], [-6, 54]],
  [[-10, 52], [-6, 52], [-6, 55], [-10, 55]],
  // Asia
  [[26, 41], [45, 40], [55, 38], [62, 40], [70, 43], [80, 45], [90, 48], [100, 50], [115, 46],
   [127, 43], [130, 48], [135, 55], [145, 60], [160, 62], [170, 68], [160, 71], [140, 73],
   [120, 74], [100, 76], [80, 74], [70, 70], [60, 68], [50, 66], [40, 66], [32, 62], [30, 55],
   [30, 47]],
  // South + SE Asia
  [[60, 25], [68, 24], [73, 20], [77, 8], [82, 8], [88, 21], [93, 20], [98, 12], [104, 10],
   [109, 15], [108, 21], [98, 27], [88, 27], [78, 32], [70, 32], [62, 30]],
  // Japan
  [[130, 32], [136, 34], [141, 38], [142, 43], [140, 45], [136, 37], [131, 33]],
  // Indonesia / Philippines
  [[95, 5], [105, 0], [115, -3], [130, -4], [140, -6], [133, -9], [118, -9], [106, -7], [98, 0]],
  [[119, 6], [126, 8], [125, 15], [121, 18], [119, 13]],
  // Australia
  [[113, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -18], [150, -25],
   [153, -28], [150, -37], [143, -39], [136, -35], [129, -32], [118, -34], [114, -28]],
  // North America
  [[-168, 65], [-150, 61], [-140, 60], [-130, 54], [-125, 48], [-124, 40], [-117, 32],
   [-105, 23], [-97, 16], [-90, 15], [-83, 9], [-79, 22], [-81, 25], [-75, 35], [-70, 42],
   [-60, 47], [-55, 52], [-64, 60], [-78, 62], [-95, 68], [-110, 69], [-130, 70], [-155, 71]],
  // South America
  [[-81, 0], [-75, 8], [-62, 10], [-52, 5], [-45, -2], [-35, -6], [-38, -14], [-48, -25],
   [-54, -34], [-62, -40], [-66, -47], [-72, -53], [-75, -47], [-73, -37], [-71, -25],
   [-70, -15], [-78, -5]],
  // Greenland
  [[-45, 60], [-30, 68], [-22, 73], [-25, 81], [-45, 83], [-60, 80], [-58, 70], [-52, 63]],
];

const DEG = Math.PI / 180;

export interface GlobePin {
  country: string;
  flag: string;
  count: number;
}

export default function WorldGlobe({
  pins, selected, onSelect,
}: {
  pins: GlobePin[];
  selected: string | null;
  onSelect: (country: string | null) => void;
}) {
  const [rot, setRot] = useState<[number, number]>([-10, -20]); // [lon, lat] centre
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; y: number; rot: [number, number] } | null>(null);
  const SIZE = 400;
  const R = (SIZE / 2 - 14) * zoom;
  const [cx, cy] = [SIZE / 2, SIZE / 2];

  // Orthographic projection. `front` is false for the hemisphere facing away,
  // which is what stops pins and coastlines bleeding through the far side.
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

  // Draw only the runs of a polygon that are on the near side; a polygon that
  // wraps round the limb is split rather than drawn as a chord across the face.
  const landPaths = useMemo(() => {
    const out: string[] = [];
    for (const poly of LAND) {
      let d = "";
      let open = false;
      for (const [lon, lat] of poly) {
        const q = project(lon, lat);
        if (!q.front) { open = false; continue; }
        d += `${open ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)} `;
        open = true;
      }
      if (d) out.push(d);
    }
    return out;
  }, [project]);

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
      for (let lat = -90; lat <= 90; lat += 5) {
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
  const onUp = () => { drag.current = null; };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-sky-50 to-white p-4 shadow-sm">
      <div className="relative mx-auto" style={{ maxWidth: SIZE }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full touch-none select-none"
          style={{ cursor: drag.current ? "grabbing" : "grab" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
          onWheel={(e) => setZoom((z) => Math.max(0.8, Math.min(3, z - e.deltaY * 0.001)))}
          role="img"
          aria-label="Globe showing the countries families have made books in"
        >
          <defs>
            <radialGradient id="ocean" cx="35%" cy="30%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#38bdf8" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={R} fill="url(#ocean)" />
          {graticule.map((d, i) => (
            <path key={`g${i}`} d={d} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={0.6} />
          ))}
          {landPaths.map((d, i) => (
            <path key={`l${i}`} d={`${d}Z`} fill="#86efac" stroke="#4ade80" strokeWidth={0.7} strokeLinejoin="round" />
          ))}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#0284c7" strokeWidth={1.2} />

          {placed.filter((p) => p.q.front).map(({ pin, q }) => {
            const on = selected === pin.country;
            const r = Math.min(16, 7 + pin.count * 1.5) * Math.min(1.4, zoom);
            return (
              <g key={pin.country} onClick={(e) => { e.stopPropagation(); onSelect(on ? null : pin.country); }}
                 style={{ cursor: "pointer" }}>
                <circle cx={q.x} cy={q.y} r={r + 3} fill="#fff" fillOpacity={on ? 0.95 : 0.75} />
                <circle cx={q.x} cy={q.y} r={r} fill={on ? "#7c3aed" : "#f59e0b"} />
                <text x={q.x} y={q.y + r * 0.35} textAnchor="middle" fontSize={r * 1.1}>{pin.flag}</text>
                <title>{`${pin.country} — ${pin.count} book${pin.count === 1 ? "" : "s"}`}</title>
              </g>
            );
          })}
        </svg>

        <div className="absolute right-1 top-1 flex flex-col gap-1">
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} aria-label="Zoom in"
            className="rounded-full bg-white/90 p-1.5 shadow hover:bg-white"><Plus className="h-4 w-4 text-slate-600" /></button>
          <button onClick={() => setZoom((z) => Math.max(0.8, z - 0.25))} aria-label="Zoom out"
            className="rounded-full bg-white/90 p-1.5 shadow hover:bg-white"><Minus className="h-4 w-4 text-slate-600" /></button>
          <button onClick={() => { setZoom(1); setRot([-10, -20]); onSelect(null); }} aria-label="Reset globe"
            className="rounded-full bg-white/90 p-1.5 shadow hover:bg-white"><RotateCcw className="h-4 w-4 text-slate-600" /></button>
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-slate-400">Drag to spin · scroll or use + / − to zoom · tap a pin</p>

      {offGlobe.length > 0 && (
        <p className="mt-1 text-center text-xs text-slate-400">
          Also from {offGlobe.map((p) => `${p.flag} ${p.country}`).join(", ")}
        </p>
      )}
    </div>
  );
}
