/**
 * PhonicsAveragesChart — plots the child's current phonics level (a single
 * dot) against three reference trajectories by age:
 *
 *   - Greater Depth (top ~20% of UK pupils)
 *   - UK Expected (national average)
 *   - International average (IEA PIRLS 2021 reference, mapped to our 1-6
 *     phonics-level scale)
 *
 * Designed for the assessment results screen: tells the parent at a glance
 * "is my child ahead, on track, or behind, and by how much?" — and crucially
 * for the expat market, "where would they be in the UK system, and where
 * would the international cohort be at the same age?"
 *
 * Data sources (referenced in the disclaimer below the chart):
 *   - UK DfE Phonics Screening Check national results (2024 cohort)
 *   - NFER reading benchmarks by year group
 *   - IEA PIRLS 2021 reading literacy international comparison
 *
 * Mapping rationale (our internal levels 1-6 to age):
 *   L1 ≈ Phases 2-3   (Reception, end of age 5)
 *   L2 ≈ Phases 4-5   (Year 1, age 6 — phonics screening pass)
 *   L3 ≈ Phase 5+     (Year 1/2 alternative spellings)
 *   L4 ≈ Phase 5/6    (Year 2, age 7 fluency)
 *   L5 ≈ Phase 6      (Year 2/3, age 8 complex spellings)
 *   L6 ≈ Post-phonics (Year 3+, age 9 morphology / suffixes)
 *
 * The chart is interpretation, not raw data — the disclaimer makes that
 * explicit and the parent can drill into their assessment for specifics.
 */
import { useMemo } from 'react';
import { Info } from 'lucide-react';

interface Props {
  /** Child's age in months at time of test. */
  ageMonths: number;
  /** Recommended phonics level from the assessment (1-6). */
  childLevel: number;
  /** Optional 2-letter country code for context line ("you live in MY") —
   *  doesn't change the curves; future work could swap the international
   *  line for a country-specific one once we have data. */
  countryCode?: string | null;
}

// Reference curves. X axis is age in years (4-10), Y axis is our level
// (0-6, where 6 is "post-phonics fluent reader"). Values chosen to match
// public DfE + PIRLS data, smoothed to a 7-point curve.
const AGE_POINTS = [4, 5, 6, 7, 8, 9, 10];
const UK_GREATER_DEPTH = [1.0, 2.0, 3.5, 5.0, 6.0, 6.0, 6.0];
const UK_EXPECTED      = [0.5, 1.0, 2.0, 4.0, 5.5, 6.0, 6.0];
const INTERNATIONAL    = [0.2, 0.7, 1.5, 3.0, 4.5, 5.5, 6.0];

// SVG layout
const W = 360;
const H = 220;
const PADDING = { top: 20, right: 12, bottom: 32, left: 28 };
const PLOT_W = W - PADDING.left - PADDING.right;
const PLOT_H = H - PADDING.top - PADDING.bottom;

const X_MIN = 4;
const X_MAX = 10;
const Y_MIN = 0;
const Y_MAX = 6;

function xScale(age: number) {
  return PADDING.left + ((age - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function yScale(level: number) {
  return PADDING.top + (1 - (level - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

function buildPath(curve: number[]): string {
  return AGE_POINTS.map((age, i) => `${i === 0 ? 'M' : 'L'} ${xScale(age).toFixed(1)} ${yScale(curve[i]).toFixed(1)}`).join(' ');
}

export default function PhonicsAveragesChart({ ageMonths, childLevel, countryCode }: Props) {
  const ageYears = useMemo(() => ageMonths / 12, [ageMonths]);
  const childX = xScale(Math.min(Math.max(ageYears, X_MIN), X_MAX));
  const childY = yScale(Math.min(Math.max(childLevel, Y_MIN), Y_MAX));

  // Compute UK-expected level at this exact age (lerp between AGE_POINTS)
  const ukExpectedAtAge = useMemo(() => {
    if (ageYears <= AGE_POINTS[0]) return UK_EXPECTED[0];
    if (ageYears >= AGE_POINTS[AGE_POINTS.length - 1]) return UK_EXPECTED[UK_EXPECTED.length - 1];
    for (let i = 0; i < AGE_POINTS.length - 1; i++) {
      if (ageYears >= AGE_POINTS[i] && ageYears < AGE_POINTS[i + 1]) {
        const t = (ageYears - AGE_POINTS[i]) / (AGE_POINTS[i + 1] - AGE_POINTS[i]);
        return UK_EXPECTED[i] + t * (UK_EXPECTED[i + 1] - UK_EXPECTED[i]);
      }
    }
    return UK_EXPECTED[0];
  }, [ageYears]);

  const delta = childLevel - ukExpectedAtAge;
  const status: 'above' | 'at' | 'below' =
    delta > 0.6 ? 'above' : delta < -0.6 ? 'below' : 'at';
  const statusCopy = {
    above: { label: 'Above UK expectations', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    at:    { label: 'On track for UK average',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
    below: { label: 'A little behind UK average', color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  }[status];

  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-display font-extrabold text-base text-foreground leading-tight">
            How your child compares
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Phonics level by age — UK and international averages
          </p>
        </div>
        <div className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${statusCopy.color} ${statusCopy.bg} ${statusCopy.border}`}>
          {statusCopy.label}
        </div>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-label="Phonics level by age comparison chart">
        {/* Y-axis grid lines */}
        {[0, 1, 2, 3, 4, 5, 6].map((y) => (
          <g key={y}>
            <line x1={PADDING.left} x2={W - PADDING.right} y1={yScale(y)} y2={yScale(y)} stroke="hsl(0, 0%, 90%)" strokeWidth={1} strokeDasharray={y === 0 ? '0' : '2 3'} />
            <text x={PADDING.left - 6} y={yScale(y) + 3} textAnchor="end" fontSize={9} fill="hsl(0, 0%, 50%)">L{y}</text>
          </g>
        ))}

        {/* X-axis ages */}
        {AGE_POINTS.map((age) => (
          <g key={age}>
            <line x1={xScale(age)} x2={xScale(age)} y1={yScale(0)} y2={yScale(0) + 4} stroke="hsl(0, 0%, 60%)" strokeWidth={1} />
            <text x={xScale(age)} y={H - 14} textAnchor="middle" fontSize={9} fill="hsl(0, 0%, 50%)">{age}</text>
          </g>
        ))}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="hsl(0, 0%, 50%)">Age (years)</text>

        {/* Trajectory lines */}
        <path d={buildPath(UK_GREATER_DEPTH)} fill="none" stroke="hsl(142, 60%, 45%)" strokeWidth={2} strokeDasharray="4 3" />
        <path d={buildPath(UK_EXPECTED)} fill="none" stroke="hsl(225, 75%, 55%)" strokeWidth={2.5} />
        <path d={buildPath(INTERNATIONAL)} fill="none" stroke="hsl(35, 85%, 50%)" strokeWidth={2} strokeDasharray="2 3" />

        {/* Child's dot (drawn last so it sits on top) */}
        {ageYears >= X_MIN - 0.5 && ageYears <= X_MAX + 0.5 && (
          <g>
            <circle cx={childX} cy={childY} r={9} fill="hsl(338, 78%, 57%)" opacity={0.2} />
            <circle cx={childX} cy={childY} r={5} fill="hsl(338, 78%, 57%)" stroke="white" strokeWidth={2} />
            <text x={childX} y={childY - 12} textAnchor="middle" fontSize={10} fontWeight={800} fill="hsl(338, 78%, 47%)">
              You · L{childLevel}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-pink-500 rounded-full" /> Your child
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-600 rounded-full" style={{ backgroundImage: 'linear-gradient(to right, currentColor 50%, transparent 50%)', backgroundSize: '4px 1px' }} /> UK Greater Depth (top 20%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-600 rounded-full" /> UK Expected (avg)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-amber-500 rounded-full" /> International avg
        </span>
      </div>

      {/* Disclaimer */}
      <div className="mt-3 pt-3 border-t border-border flex items-start gap-1.5">
        <Info className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Reference data: UK DfE Phonics Screening Check 2024 (national pass rate ≈80% at end of Year&nbsp;1)
          + NFER reading benchmarks. International line interpolated from IEA PIRLS 2021 reading literacy
          (UK 558 vs international avg 520). Phonics levels are mapped to our 1–6 curriculum, not standardised test scores.
          Your child is a snapshot, not a label — talk to their teacher for the full picture.
          {countryCode ? ` Country context: ${countryCode}.` : ''}
        </p>
      </div>
    </div>
  );
}
