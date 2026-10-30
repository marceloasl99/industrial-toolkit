/* OEE = Availability × Performance × Quality (standard SEMI E10 / Nakajima definition). */
export function oee({ plannedMin, downtimeMin, idealCycleSec, totalCount, goodCount }) {
  if (!(plannedMin > 0)) throw new Error('Planned production time must be positive');
  if (!(downtimeMin >= 0 && downtimeMin <= plannedMin)) throw new Error('Downtime must be between 0 and the planned time');
  if (!(idealCycleSec > 0)) throw new Error('Ideal cycle time must be positive');
  if (!(totalCount >= 0 && goodCount >= 0 && goodCount <= totalCount)) throw new Error('Good count cannot exceed total count');
  const runMin = plannedMin - downtimeMin;
  const availability = runMin / plannedMin;
  const performance = runMin > 0 ? (idealCycleSec * totalCount / 60) / runMin : 0;
  const quality = totalCount ? goodCount / totalCount : 0;
  const result = availability * performance * quality;
  return {
    availability, performance, quality, oee: result, runMin,
    performanceWarning: performance > 1 ? 'Performance above 100%: the ideal cycle time is probably too slow.' : null,
    lossAvailabilityMin: downtimeMin,
    lossPerformanceMin: Math.max(0, runMin - idealCycleSec * totalCount / 60),
    lossQualityMin: idealCycleSec * (totalCount - goodCount) / 60,
    taktSec: totalCount ? runMin * 60 / totalCount : NaN,
  };
}

export function cycleTime({ availableMin, demand }) {
  if (!(availableMin > 0 && demand > 0)) throw new Error('Enter positive values');
  return { taktSec: availableMin * 60 / demand, perHour: demand / (availableMin / 60) };
}
