import { useState, useEffect, useMemo } from "react";
import { Zap, RefreshCw, Check, AlertTriangle, Info, Calendar as CalendarIcon, CalendarOff, Sun } from "lucide-react";
import * as smsStorage from "@/lib/smsStorage";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035"];

const SMART_SIZES = [
  { id: "is13487", size: "4 LPH" },
  { id: "is13487", size: "8 LPH" },
  { id: "is13487", size: "14 LPH" },
  { id: "is14483", size: "V-1\" (25mm)" },
  { id: "is14483", size: "V-2\" (50mm)" }
];

export default function SmsSmartProduction() {
  const [apMonth, setApMonth] = useState<string>(() => MONTHS[new Date().getMonth()]);
  const [apYear, setApYear] = useState<string>(() => new Date().getFullYear().toString());
  
  // Track Targets for each size (key: `${id}_${size}`)
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [selectedSizes, setSelectedSizes] = useState<Record<string, boolean>>(
    SMART_SIZES.reduce((acc, sz) => ({ ...acc, [`${sz.id}_${sz.size}`]: true }), {})
  );
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [previewEntries, setPreviewEntries] = useState<any[]>([]);

  // Excluded production dates in selected month (Set of day numbers e.g. 1..31)
  const [excludedDays, setExcludedDays] = useState<Set<number>>(new Set());

  // Automatically pre-select all Sundays in the selected month as off-days (user can still unmark them)
  useEffect(() => {
    const monthIdx = MONTHS.indexOf(apMonth);
    const yr = Number(apYear);
    if (isNaN(yr) || monthIdx === -1) return;

    const daysInMonth = new Date(yr, monthIdx + 1, 0).getDate();
    const sundays = new Set<number>();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(yr, monthIdx, d);
      if (dateObj.getDay() === 0) { // 0 = Sunday
        sundays.add(d);
      }
    }

    setExcludedDays(sundays);
  }, [apMonth, apYear]);

  const toggleDayExclusion = (dayNum: number) => {
    setExcludedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNum)) {
        next.delete(dayNum);
      } else {
        next.add(dayNum);
      }
      return next;
    });
  };

  const excludeAllSundays = () => {
    const monthIdx = MONTHS.indexOf(apMonth);
    const yr = Number(apYear);
    if (isNaN(yr) || monthIdx === -1) return;
    const daysInMonth = new Date(yr, monthIdx + 1, 0).getDate();

    setExcludedDays(prev => {
      const next = new Set(prev);
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(yr, monthIdx, d).getDay() === 0) {
          next.add(d);
        }
      }
      return next;
    });
  };

  const clearAllExclusions = () => {
    setExcludedDays(new Set());
  };

  // Find sizes that already have production entries in the selected month & year
  const alreadyProducedSizes = useMemo(() => {
    const monthIdx = MONTHS.indexOf(apMonth) + 1;
    const prefix = `${apYear}-${monthIdx.toString().padStart(2, '0')}`;
    const set = new Set<string>();

    SMART_SIZES.forEach(sz => {
      const pStored = localStorage.getItem(`sms_prod_${sz.id}`);
      if (pStored) {
        try {
          const prods = JSON.parse(pStored);
          if (prods.some((p: any) => p.size === sz.size && p.date && p.date.startsWith(prefix))) {
            set.add(`${sz.id}_${sz.size}`);
          }
        } catch (e) {
          // ignore
        }
      }
    });

    return set;
  }, [apMonth, apYear, previewEntries]);

  // Sync selectedSizes whenever alreadyProducedSizes changes to disable & uncheck already produced sizes
  useEffect(() => {
    setSelectedSizes(prev => {
      const next = { ...prev };
      let changed = false;
      SMART_SIZES.forEach(sz => {
        const key = `${sz.id}_${sz.size}`;
        if (alreadyProducedSizes.has(key)) {
          if (next[key] !== false) {
            next[key] = false;
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [alreadyProducedSizes]);

  // Fetch real-time opening stock and dispatches
  const [metrics, setMetrics] = useState<Record<string, { opening: number, disp: number }>>({});

  useEffect(() => {
    // When month/year changes, calculate the current metrics
    const fetchMetrics = () => {
      const newMetrics: Record<string, { opening: number, disp: number }> = {};
      const prefix = `${apYear}-${(MONTHS.indexOf(apMonth) + 1).toString().padStart(2, '0')}`;
      
      SMART_SIZES.forEach(sz => {
        const key = `${sz.id}_${sz.size}`;
        
        // 1. Fetch Dispatches for the target month
        const dStored = localStorage.getItem(`sms_disp_${sz.id}`);
        let monthDisp = 0;
        if (dStored) {
          const disps = JSON.parse(dStored);
          disps.filter((d: any) => d.size === sz.size && d.date.startsWith(prefix))
               .forEach((d: any) => monthDisp += (d.dispNos || d.dispPipe || d.dispMtr || 0));
        }

        // 2. Calculate Opening Stock by rolling forward from oldest manual stock key or target year
        let startYear = Number(apYear);
        let startMonth = 1;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`sms_last_stock_${sz.id}_${sz.size}_`)) {
            const parts = key.split("_");
            if (parts.length >= 7) {
              const yr = Number(parts[parts.length - 2]);
              const monthName = parts[parts.length - 1];
              const mIdx = MONTHS.indexOf(monthName);
              if (!isNaN(yr) && mIdx !== -1) {
                const m = mIdx + 1;
                if (yr < startYear || (yr === startYear && m < startMonth)) {
                  startYear = yr;
                  startMonth = m;
                }
              }
            }
          }
        }

        const apMonthIdx = MONTHS.indexOf(apMonth) + 1;
        
        let currentStock = 0;
        let curY = startYear;
        let curM = startMonth;
        let hasFoundFirstManual = false;
        
        while (curY < Number(apYear) || (curY === Number(apYear) && curM < apMonthIdx)) {
            const mStr = curM.toString().padStart(2, '0');
            const periodPrefix = `${curY}-${mStr}`;
            const monthName = MONTHS[curM - 1];
            
            const manualKey = `sms_last_stock_${sz.id}_${sz.size}_${curY}_${monthName}`;
            const manualValStr = localStorage.getItem(manualKey);
            
            let periodStartStock = currentStock;
            
            if (manualValStr !== null) {
                periodStartStock = Number(manualValStr) || 0;
                hasFoundFirstManual = true;
            } else if (!hasFoundFirstManual) {
                const oldFallback = localStorage.getItem(`sms_last_stock_${sz.id}_${sz.size}`);
                if (oldFallback !== null) {
                    periodStartStock = Number(oldFallback) || 0;
                } else {
                    periodStartStock = 0;
                }
                hasFoundFirstManual = true;
            }
            
            let periodProd = 0;
            let periodDisp = 0;
            
            const pStoredLoop = localStorage.getItem(`sms_prod_${sz.id}`);
            if (pStoredLoop) {
                const prods = JSON.parse(pStoredLoop);
                prods.filter((p: any) => p.size === sz.size && p.date.startsWith(periodPrefix))
                     .forEach((p: any) => periodProd += (p.nos || p.pipe || 0));
            }
            
            if (dStored) {
                const disps = JSON.parse(dStored);
                disps.filter((d: any) => d.size === sz.size && d.date.startsWith(periodPrefix))
                     .forEach((d: any) => periodDisp += (d.dispNos || d.dispPipe || d.dispMtr || 0));
            }
            
            currentStock = periodStartStock + periodProd - periodDisp;
            
            curM++;
            if (curM > 12) {
                curM = 1;
                curY++;
            }
        }
        
        let opening = currentStock;
        const apManualKey = `sms_last_stock_${sz.id}_${sz.size}_${apYear}_${apMonth}`;
        if (localStorage.getItem(apManualKey) !== null) {
            opening = Number(localStorage.getItem(apManualKey)) || 0;
        } else if (!hasFoundFirstManual) {
             const oldFallback = localStorage.getItem(`sms_last_stock_${sz.id}_${sz.size}`);
             if (oldFallback !== null) {
                 opening = Number(oldFallback) || 0;
             }
        }

        newMetrics[key] = { opening, disp: monthDisp };
      });
      setMetrics(newMetrics);
    };

    fetchMetrics();
    setPreviewEntries([]);
    setStatus(null);
  }, [apMonth, apYear]);

  const handleTargetChange = (key: string, val: string) => {
    setTargets(prev => ({ ...prev, [key]: val }));
  };

  const handleSelectionToggle = (key: string) => {
    setSelectedSizes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setStatus(null);
    setPreviewEntries([]);

    setTimeout(() => {
      try {
        const apMonthIdx = MONTHS.indexOf(apMonth) + 1;
        const apMonthStr = apMonthIdx.toString().padStart(2, '0');
        const prefix = `${apYear}-${apMonthStr}`;
        const daysInMonth = new Date(Number(apYear), apMonthIdx, 0).getDate();

        // 1. Check if any production already exists in this month
        let hasExistingMonthProd = false;
        SMART_SIZES.forEach(sz => {
          if (!selectedSizes[`${sz.id}_${sz.size}`]) return;
          const pStored = localStorage.getItem(`sms_prod_${sz.id}`);
          if (pStored) {
            const prods = JSON.parse(pStored);
            if (prods.some((p: any) => p.size === sz.size && p.date.startsWith(prefix))) {
              hasExistingMonthProd = true;
            }
          }
        });

        if (hasExistingMonthProd) {
           setStatus({ type: "error", message: `Auto-Produce blocked: Production entries already exist in ${apMonth} ${apYear} for one or more sizes. Please clear them first.` });
           setIsGenerating(false);
           return;
        }

        // 2. Determine requirements per size
        const sizeReqs: any[] = [];
        for (const sz of SMART_SIZES) {
          const key = `${sz.id}_${sz.size}`;
          if (!selectedSizes[key]) continue;
          
          const m = metrics[key] || { opening: 0, disp: 0 };
          const target = Number(targets[key]) || 0;
          
          const totalRequired = target + m.disp - m.opening;
          const mult = sz.id === 'is14483' ? 10 : 100;
          let actualProdNeeded = Math.ceil(totalRequired / mult) * mult;
          
          if (actualProdNeeded > 0) {
            // Fetch limits for this size
            const limitsStr = localStorage.getItem(`sms_autoproduce_limits_${sz.id}_${sz.size}`);
            if (!limitsStr) {
               setStatus({ type: "error", message: `No Limits configured for ${sz.size}. Set them in Settings.` });
               setIsGenerating(false);
               return;
            }
            const limits = JSON.parse(limitsStr);
            if (!limits.min || !limits.max) {
               setStatus({ type: "error", message: `Invalid Limits configured for ${sz.size}.` });
               setIsGenerating(false);
               return;
            }
            sizeReqs.push({ sz, req: actualProdNeeded, min: limits.min, max: limits.max });
          }
        }

        if (sizeReqs.length === 0) {
           setStatus({ type: "info", message: "No production needed to meet the configured targets." });
           setIsGenerating(false);
           return;
        }

        // Helper for smart chunk distribution (varied, natural, non-repeating production per day)
        const generateSmartChunks = (req: number, minLimit: number, maxLimit: number, mult: number): number[] => {
          const safeMin = Math.ceil(minLimit / mult) * mult;
          const safeMax = Math.floor(maxLimit / mult) * mult;

          if (req <= 0) return [];
          if (safeMax <= 0 || safeMin <= 0 || safeMin >= safeMax) return [req];

          // Aim for an average daily production around 80% of maxLimit
          // This avoids pushing every chunk to hit safeMax (which caused repetition like 210, 210, 210)
          // while keeping total days low to save calendar space for other standards.
          const targetAvg = Math.max(safeMin, Math.min(safeMax - mult, Math.round((safeMax * 0.8) / mult) * mult));
          
          let numChunks = Math.ceil(req / targetAvg);
          if (numChunks < 1) numChunks = 1;

          if (req / numChunks < safeMin) {
            numChunks = Math.max(1, Math.floor(req / safeMin));
          }

          if (numChunks === 1) {
            return [req];
          }

          const chunks: number[] = new Array(numChunks).fill(0);
          let remaining = req;

          for (let i = 0; i < numChunks - 1; i++) {
            const remChunks = numChunks - 1 - i;

            const minPossible = Math.max(safeMin, remaining - remChunks * safeMax);
            const maxPossible = Math.min(safeMax, remaining - remChunks * safeMin);

            const qMin = Math.ceil(minPossible / mult) * mult;
            const qMax = Math.floor(maxPossible / mult) * mult;

            if (qMin >= qMax) {
              chunks[i] = qMin;
            } else {
              const steps = Math.floor((qMax - qMin) / mult);
              let randomStep = Math.floor(Math.random() * (steps + 1));
              let candidate = qMin + randomStep * mult;

              // Avoid repeating the previous chunk's value if alternatives exist
              if (i > 0 && candidate === chunks[i - 1] && steps > 0) {
                randomStep = (randomStep + 1) % (steps + 1);
                candidate = qMin + randomStep * mult;
              }

              chunks[i] = candidate;
            }

            remaining -= chunks[i];
          }

          chunks[numChunks - 1] = remaining;

          // Post-process to eliminate repeated adjacent values if bounds permit
          for (let iter = 0; iter < 15; iter++) {
            for (let i = 0; i < chunks.length - 1; i++) {
              if (chunks[i] === chunks[i + 1]) {
                if (chunks[i] + mult <= safeMax && chunks[i + 1] - mult >= safeMin) {
                  chunks[i] += mult;
                  chunks[i + 1] -= mult;
                } else if (chunks[i] - mult >= safeMin && chunks[i + 1] + mult <= safeMax) {
                  chunks[i] -= mult;
                  chunks[i + 1] += mult;
                }
              }
            }
          }

          return chunks;
        };

        // 3. Generate smart chunks and calculate earliest required deadline per chunk to NEVER dip negative
        let totalChunksNeeded = 0;
        const allChunkItems: Array<{
          sr: any;
          chunkQty: number;
          maxAllowedDay: number;
        }> = [];

        sizeReqs.forEach(sr => {
          const mult = sr.sz.id === 'is14483' ? 10 : 100;
          sr.chunks = generateSmartChunks(sr.req, sr.min, sr.max, mult);
          sr.numChunks = sr.chunks.length;
          totalChunksNeeded += sr.numChunks;

          // Fetch daily dispatches for this size in the target month to compute deadlines
          const dStored = localStorage.getItem(`sms_disp_${sr.sz.id}`);
          const dailyDisps: Record<number, number> = {};
          if (dStored) {
            try {
              const disps = JSON.parse(dStored);
              disps.filter((d: any) => d.size === sr.sz.size && d.date && d.date.startsWith(prefix))
                   .forEach((d: any) => {
                      const dayNum = Number(d.date.split('-')[2]);
                      const qty = (sr.sz.id === "is13488" || sr.sz.id === "is12786") ? (d.dispMtr || 0) :
                                  (sr.sz.id === "is4985") ? (d.dispPipe || 0) : (d.dispNos || d.dispPipe || 0);
                      dailyDisps[dayNum] = (dailyDisps[dayNum] || 0) + qty;
                   });
            } catch (e) {}
          }

          // Simulate day-by-day running stock to find deadline days for chunks
          let runningStock = metrics[`${sr.sz.id}_${sr.sz.size}`]?.opening || 0;
          let chunkIdx = 0;
          const chunkDeadlines: number[] = new Array(sr.chunks.length).fill(daysInMonth);

          for (let d = 1; d <= daysInMonth; d++) {
            const dispOnDay = dailyDisps[d] || 0;
            runningStock -= dispOnDay;

            // If running stock dips below 0 on day d, schedule unscheduled chunk(s) to cover the deficit
            while (runningStock < 0 && chunkIdx < sr.chunks.length) {
              chunkDeadlines[chunkIdx] = d;
              runningStock += sr.chunks[chunkIdx];
              chunkIdx++;
            }
          }

          sr.chunks.forEach((chunkQty: number, idx: number) => {
            allChunkItems.push({
              sr,
              chunkQty,
              maxAllowedDay: chunkDeadlines[idx]
            });
          });
        });

        const availableDays = new Set<number>();
        for (let d = 1; d <= daysInMonth; d++) {
          if (!excludedDays.has(d)) {
            availableDays.add(d);
          }
        }

        if (totalChunksNeeded > availableDays.length) {
           setStatus({ type: "error", message: `Cannot distribute production. Needed ${totalChunksNeeded} unique days across all sizes, but only ${availableDays.length} working days available after exclusions.` });
           setIsGenerating(false);
           return;
        }

        // 4. Assign unique working dates to chunks respecting deadlines (so stock NEVER goes negative)
        // Sort chunks by maxAllowedDay ascending so tightest deadlines get scheduled first
        allChunkItems.sort((a, b) => a.maxAllowedDay - b.maxAllowedDay);

        const previews: any[] = [];
        let dateIdxCounter = 0;

        for (const item of allChunkItems) {
          // Find available days on or before maxAllowedDay
          const validDays = Array.from(availableDays).filter(d => d <= item.maxAllowedDay);
          let chosenDay: number;

          if (validDays.length > 0) {
            // Pick a random valid day among days on or before deadline
            chosenDay = validDays[Math.floor(Math.random() * validDays.length)];
          } else {
            // Fallback to earliest available day in the month
            chosenDay = Math.min(...Array.from(availableDays));
          }

          availableDays.delete(chosenDay);
          const assignedDate = `${prefix}-${chosenDay.toString().padStart(2, '0')}`;

          previews.push({
             id: `ap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${++dateIdxCounter}`,
             date: assignedDate,
             size: item.sr.sz.size,
             standardId: item.sr.sz.id,
             coils: 0,
             mtr: 0,
             nos: item.chunkQty,
             pipe: item.chunkQty,
             kg: 0,
             tonn: 0,
             value: 0
          });
        }

        // Sort chronologically
        previews.sort((a, b) => a.date.localeCompare(b.date));

        setPreviewEntries(previews);
        setStatus({ type: "success", message: `Successfully generated ${totalChunksNeeded} global batches.` });
        setIsGenerating(false);
      } catch(e) {
        setStatus({ type: "error", message: "Failed to generate global preview." });
        setIsGenerating(false);
      }
    }, 600);
  };

  const handleCommit = async () => {
    if (previewEntries.length === 0) return;

    // Group by standardId
    const grouped: Record<string, any[]> = {};
    for (const e of previewEntries) {
      if (!grouped[e.standardId]) grouped[e.standardId] = [];
      grouped[e.standardId].push(e);
    }

    // Save for each standard
    for (const id of Object.keys(grouped)) {
       const mappedNewEntries = grouped[id].map(e => {
         const entry: any = {
           id: e.id,
           date: e.date,
           size: e.size,
           value: 0
         };

         if (id === 'is13487') {
           entry.nos = e.nos || 0;
           entry.thousandUnit = (e.nos || 0) / 1000;
         } else if (id === 'is14483') {
           entry.nos = e.nos || 0;
         } else if (id === 'is4985') {
           entry.pipe = e.pipe || 0;
           entry.mtr = (e.pipe || 0) * 6;
           entry.tonn = 0;
           entry.kg = 0;
         } else if (id === 'is17425') {
           entry.pipe = e.pipe || 0;
           entry.nos = e.pipe || 0;
         } else {
           entry.mtr = e.mtr || 0;
           entry.coils = e.coils || 0;
         }
         return entry;
       });

       const pStored = localStorage.getItem(`sms_prod_${id}`);
       const existingProd = pStored ? JSON.parse(pStored) : [];
       const newProd = [...existingProd, ...mappedNewEntries].sort((a: any, b: any) => a.date.localeCompare(b.date));
       localStorage.setItem(`sms_prod_${id}`, JSON.stringify(newProd));

       for (const e of mappedNewEntries) {
         await smsStorage.saveProductionEntry(id, e);
       }
    }

    // Clear any artificial manual stock overrides for the next month so it genuinely inherits the real closing stock from this month
    const apMonthIdx = MONTHS.indexOf(apMonth);
    const nextMonthIdx = (apMonthIdx + 1) % 12;
    const nextYearStr = nextMonthIdx === 0 ? (Number(apYear) + 1).toString() : apYear;
    
    SMART_SIZES.forEach(sz => {
      const manualKey = `sms_last_stock_${sz.id}_${sz.size}_${nextYearStr}_${MONTHS[nextMonthIdx]}`;
      localStorage.removeItem(manualKey);
    });

    // Dispatch update notifications so other components sync
    window.dispatchEvent(new Event("storage"));

    setStatus({ type: "success", message: "Successfully committed global production to database!" });
    setPreviewEntries([]);
    setTargets({});
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Zap className="w-48 h-48 text-purple-500 blur-2xl" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3 tracking-tight">
              <Zap className="w-6 h-6 text-purple-400" />
              Global Smart Production Engine
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Dynamically calculate and distribute automated production entries across all sizes for IS 13487 and IS 14483 concurrently, ensuring zero date overlaps.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Target Month</span>
                <span className="text-[10px] bg-purple-950 text-purple-400 border border-purple-800/60 px-2 py-0.5 rounded-full font-mono">
                  {apMonth} {apYear}
                </span>
              </h3>
              <div className="space-y-3">
                 <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">Month</label>
                    <select
                      value={apMonth}
                      onChange={(e) => setApMonth(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">Year</label>
                    <select
                      value={apYear}
                      onChange={(e) => setApYear(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>
              </div>
           </div>

           {/* Interactive Production Off-Days & Holiday Calendar */}
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                 <div>
                    <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                       <CalendarIcon className="w-4 h-4 text-purple-400" />
                       Holiday & Off-Days
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click any date to exclude from auto-production</p>
                 </div>
                 <span className="text-[10px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded-full font-bold">
                    {excludedDays.size} Off
                 </span>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between text-xs gap-2 pt-1">
                 <button
                   type="button"
                   onClick={excludeAllSundays}
                   className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-950/50 hover:bg-amber-950 border border-amber-800/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                 >
                   <Sun className="w-3 h-3" /> Exclude Sundays
                 </button>
                 <button
                   type="button"
                   onClick={clearAllExclusions}
                   className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors"
                 >
                   Clear All
                 </button>
              </div>

              {/* Calendar Grid */}
              {(() => {
                 const monthIdx = MONTHS.indexOf(apMonth);
                 const yr = Number(apYear);
                 if (isNaN(yr) || monthIdx === -1) return null;

                 const daysInMonth = new Date(yr, monthIdx + 1, 0).getDate();
                 // 0 = Monday, 6 = Sunday for cleaner Mon-Sun grid
                 const rawFirstDay = new Date(yr, monthIdx, 1).getDay();
                 const firstDayOffset = (rawFirstDay + 6) % 7;

                 const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

                 return (
                   <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 border-b border-slate-800/60 pb-1.5">
                         {weekDays.map((wd, i) => (
                           <span key={wd} className={i === 6 ? "text-amber-400 font-black" : ""}>
                             {wd}
                           </span>
                         ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                         {/* Empty padding cells */}
                         {Array.from({ length: firstDayOffset }).map((_, idx) => (
                           <div key={`empty_${idx}`} className="h-9 rounded-lg bg-slate-950/20" />
                         ))}

                         {/* Day cells */}
                         {Array.from({ length: daysInMonth }).map((_, idx) => {
                            const d = idx + 1;
                            const isSunday = new Date(yr, monthIdx, d).getDay() === 0;
                            const isExcluded = excludedDays.has(d);

                            let btnStyle = "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800/80";
                            if (isExcluded && isSunday) {
                               btnStyle = "bg-amber-950/80 border-amber-600 text-amber-200 font-bold ring-1 ring-amber-500/40 shadow-sm";
                            } else if (isExcluded) {
                               btnStyle = "bg-purple-950/80 border-purple-600 text-purple-200 font-bold ring-1 ring-purple-500/40 shadow-sm";
                            } else if (isSunday) {
                               btnStyle = "bg-slate-950/90 hover:bg-amber-950/40 border-amber-900/50 text-amber-400";
                            }

                            return (
                               <button
                                 key={`day_${d}`}
                                 type="button"
                                 onClick={() => toggleDayExclusion(d)}
                                 title={isExcluded ? `Day ${d}: Excluded from production (Click to include)` : `Day ${d}: Working Day (Click to exclude)`}
                                 className={`h-9 rounded-lg border text-xs font-mono flex flex-col items-center justify-center relative transition-all cursor-pointer ${btnStyle}`}
                               >
                                  <span>{d}</span>
                                  {isExcluded && (
                                     <span className="text-[8px] leading-none font-bold uppercase tracking-tight scale-90">
                                       {isSunday ? "Sun Off" : "Holiday"}
                                     </span>
                                  )}
                               </button>
                            );
                         })}
                      </div>

                      <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 mt-3">
                         <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-amber-950 border border-amber-600 inline-block" />
                            <span>Sunday Off</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-purple-950 border border-purple-600 inline-block" />
                            <span>Custom Off</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-slate-950 border border-slate-800 inline-block" />
                            <span>Working</span>
                         </div>
                      </div>
                   </div>
                 );
              })()}
           </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                 <h3 className="font-bold text-slate-200">Target Stock Configuration</h3>
                 <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                   {apMonth} {apYear}
                 </span>
              </div>
              <div className="p-0 overflow-x-auto">
                 <table className="w-full text-left text-sm border-collapse">
                     <thead>
                        <tr className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                           <th className="py-3 px-4 font-semibold w-12 text-center">
                             <input 
                               type="checkbox"
                               checked={SMART_SIZES.filter(sz => !alreadyProducedSizes.has(`${sz.id}_${sz.size}`)).every(sz => selectedSizes[`${sz.id}_${sz.size}`])}
                               onChange={(e) => {
                                 const val = e.target.checked;
                                 setSelectedSizes(SMART_SIZES.reduce((acc, sz) => {
                                   const k = `${sz.id}_${sz.size}`;
                                   acc[k] = alreadyProducedSizes.has(k) ? false : val;
                                   return acc;
                                 }, {} as Record<string, boolean>));
                               }}
                               className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-600 focus:ring-offset-slate-900 bg-slate-900 cursor-pointer"
                             />
                           </th>
                           <th className="py-3 px-4 font-semibold">Standard & Size</th>
                           <th className="py-3 px-4 font-semibold text-right">Opening Stock</th>
                           <th className="py-3 px-4 font-semibold text-right">Dispatches</th>
                           <th className="py-3 px-4 font-semibold text-right text-purple-400">Target Stock</th>
                           <th className="py-3 px-4 font-semibold text-right text-blue-400">Est. Prod</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800 text-slate-300">
                        {SMART_SIZES.map(sz => {
                           const key = `${sz.id}_${sz.size}`;
                           const m = metrics[key] || { opening: 0, disp: 0 };
                           const mult = sz.id === 'is14483' ? 10 : 100;
                           const rawRequired = m.disp - m.opening;
                           const estProd = Math.max(0, Math.ceil(rawRequired / mult) * mult);
                           const isAlreadyProduced = alreadyProducedSizes.has(key);
                           const isSelected = isAlreadyProduced ? false : (selectedSizes[key] || false);

                           return (
                             <tr key={key} className={`hover:bg-slate-800/30 transition-colors ${isAlreadyProduced ? 'bg-slate-950/60 opacity-60' : !isSelected ? 'opacity-40 grayscale' : ''}`}>
                                <td className="py-3 px-4 text-center">
                                  <input 
                                    type="checkbox"
                                    disabled={isAlreadyProduced}
                                    checked={isSelected}
                                    onChange={() => !isAlreadyProduced && handleSelectionToggle(key)}
                                    className={`w-4 h-4 rounded border-slate-700 bg-slate-900 ${isAlreadyProduced ? 'opacity-30 cursor-not-allowed text-slate-600' : 'text-purple-600 focus:ring-purple-600 cursor-pointer'}`}
                                  />
                                </td>
                               <td className="py-3 px-4 font-medium flex items-center justify-between gap-2">
                                 <div className="flex items-center gap-2">
                                   <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{sz.id.replace('is', 'IS ')}</span>
                                   {sz.size}
                                 </div>
                                 {isAlreadyProduced && (
                                   <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-semibold shrink-0">
                                     Already Produced
                                   </span>
                                 )}
                               </td>
                               <td className="py-3 px-4 text-right font-mono">{m.opening.toLocaleString()}</td>
                               <td className="py-3 px-4 text-right font-mono text-emerald-400">{m.disp.toLocaleString()}</td>
                               <td className="py-3 px-4 text-right">
                                  <input
                                    type="number"
                                    disabled={isAlreadyProduced}
                                    value={targets[key] !== undefined ? targets[key] : ""}
                                    onChange={(e) => handleTargetChange(key, e.target.value)}
                                    placeholder="0"
                                    className={`w-24 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-right text-sm focus:outline-none placeholder:text-slate-600 ${isAlreadyProduced ? 'opacity-40 cursor-not-allowed' : 'focus:border-purple-500'}`}
                                  />
                               </td>
                               <td className="py-3 px-4 text-right font-mono text-blue-400">{estProd > 0 ? estProd.toLocaleString() : "-"}</td>
                            </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                 <div className="text-xs text-slate-400 max-w-lg">
                   The engine calculates: <code className="bg-slate-900 px-1 py-0.5 rounded text-purple-300">Target + Dispatches - Opening</code>, and rounds up to nearest 100 (for IS 13487) or 10 (for IS 14483). If calculation is ≤ 0, no production is generated.
                 </div>
                 <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span>Generate Global Preview</span>
                  </button>
              </div>
           </div>

           {status && (
              <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                status.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                status.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                "bg-blue-500/10 border-blue-500/20 text-blue-400"
              }`}>
                {status.type === "error" ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> : <Info className="w-5 h-5 shrink-0 mt-0.5" />}
                <span className="leading-relaxed font-medium">{status.message}</span>
              </div>
            )}

           {previewEntries.length > 0 && (
             <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                   <h3 className="font-bold text-slate-200">Generated Production Batches</h3>
                   <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                     {previewEntries.length} Unique Dates
                   </span>
                </div>
                <div className="p-0 overflow-x-auto">
                   <table className="w-full text-left text-sm border-collapse">
                      <thead>
                         <tr className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                            <th className="py-3 px-4 font-semibold">Date</th>
                            <th className="py-3 px-4 font-semibold">Standard & Size</th>
                            <th className="py-3 px-4 font-semibold text-right text-purple-400">Generated Qty</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                         {previewEntries.map(e => (
                           <tr key={e.id} className="hover:bg-slate-800/30">
                              <td className="py-3 px-4 font-mono">{e.date}</td>
                              <td className="py-3 px-4 font-medium flex items-center gap-2">
                                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{e.standardId.replace('is', 'IS ')}</span>
                                {e.size}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-purple-400 font-bold">{e.nos.toLocaleString()}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
                   <button
                    onClick={handleCommit}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Commit All to Database</span>
                  </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
