// Auto-generated from UP1.xlsx — contains all lookup data and helper algorithms.

export const METERS = [
  { meter: 'U6', installVolume_m3: 0.008, purgeVolume_m3: 0.002 },
  { meter: 'u16', installVolume_m3: 0.025, purgeVolume_m3: 0.006 },
  { meter: 'U25', installVolume_m3: 0.037, purgeVolume_m3: 0.01 },
  { meter: 'U40', installVolume_m3: 0.067, purgeVolume_m3: 0.02 },
  { meter: 'U65', installVolume_m3: 0.1, purgeVolume_m3: 0.025 },
  { meter: 'U100', installVolume_m3: 0.182, purgeVolume_m3: 0.057 },
  { meter: 'U160', installVolume_m3: 0.304, purgeVolume_m3: 0.071 },
  { meter: 'No Meter', installVolume_m3: 0.0, purgeVolume_m3: 0.0 },
];

export const PIPES = [
  { dn: 'DN15', volumePerMeter_m3: 0.00024 },
  { dn: 'DN20', volumePerMeter_m3: 0.00046 },
  { dn: 'DN25', volumePerMeter_m3: 0.00064 },
  { dn: 'DN32', volumePerMeter_m3: 0.0011 },
  { dn: 'DN40', volumePerMeter_m3: 0.0015 },
  { dn: 'DN50', volumePerMeter_m3: 0.0024 },
  { dn: 'DN65', volumePerMeter_m3: 0.0038 },
  { dn: 'DN80', volumePerMeter_m3: 0.0054 },
  { dn: 'DN100', volumePerMeter_m3: 0.009 },
  { dn: 'DN125', volumePerMeter_m3: 0.014 },
  { dn: 'DN150', volumePerMeter_m3: 0.02 },
  { dn: 'DN200', volumePerMeter_m3: 0.035 },
  { dn: 'DN250', volumePerMeter_m3: 0.053 },
  { dn: 'DN300', volumePerMeter_m3: 0.074 },
  { dn: 'DN350', volumePerMeter_m3: 0.089 },
  { dn: 'DN400', volumePerMeter_m3: 0.118 },
  { dn: 'DN450', volumePerMeter_m3: 0.151 },
  { dn: '15mm Cu', volumePerMeter_m3: 0.00014 },
  { dn: '22mm Cu', volumePerMeter_m3: 0.00032 },
  { dn: '28mm Cu', volumePerMeter_m3: 0.00054 },
  { dn: '35mm Cu', volumePerMeter_m3: 0.00084 },
  { dn: '42mm Cu', volumePerMeter_m3: 0.0012 },
  { dn: '54mm Cu', volumePerMeter_m3: 0.0021 },
  { dn: '67mm CU', volumePerMeter_m3: 0.0033 },
];

export const PURGE_HOSE = [
  { size: '100mm', hoseVolume_m3: 0.009 },
  { size: '125mm', hoseVolume_m3: 0.014 },
  { size: '15', hoseVolume_m3: NaN },
  { size: '150mm', hoseVolume_m3: 0.02 },
  { size: '200mm', hoseVolume_m3: 0.035 },
  { size: '20mm', hoseVolume_m3: 0.00046 },
  { size: '25mm', hoseVolume_m3: 0.00064 },
  { size: '30', hoseVolume_m3: NaN },
  { size: '32mm', hoseVolume_m3: 0.0011 },
  { size: '40mm', hoseVolume_m3: 0.0015 },
  { size: '45', hoseVolume_m3: NaN },
  { size: '50mm', hoseVolume_m3: 0.0024 },
  { size: '60', hoseVolume_m3: NaN },
  { size: '65mm', hoseVolume_m3: 0.0038 },
  { size: '80mm', hoseVolume_m3: 0.0054 },
  { size: 'TTD Max', hoseVolume_m3: NaN },
];

export const TABLE12 = [
  { dn: 'DN20', f1: 0.6, f2: 0.01, f3: 0.7, f4: NaN },
  { dn: 'DN25', f1: 0.6, f2: 0.02, f3: 1.0, f4: NaN },
  { dn: 'DN32', f1: 0.6, f2: 0.03, f3: 1.7, f4: NaN },
  { dn: 'DN40', f1: 0.6, f2: 0.05, f3: 2.5, f4: NaN },
  { dn: 'DN50', f1: 0.6, f2: 0.08, f3: 4.5, f4: NaN },
  { dn: 'DN80', f1: 0.6, f2: 0.19, f3: 11.0, f4: NaN },
  { dn: 'DN100', f1: 0.6, f2: 0.33, f3: 20.0, f4: NaN },
  { dn: 'DN125', f1: 0.6, f2: 0.5, f3: 30.0, f4: NaN },
  { dn: 'DN150', f1: 0.6, f2: 0.7, f3: 38.0, f4: NaN },
  { dn: 'DN200', f1: 0.7, f2: 1.32, f3: 79.0, f4: NaN },
  { dn: 'DN250', f1: 0.8, f2: 2.35, f3: 141.0, f4: NaN },
  { dn: 'DN300', f1: 0.9, f2: 3.6, f3: 216.0, f4: NaN },
  { dn: 'DN400', f1: 1.0, f2: 7.9, f3: 473.0, f4: NaN },
  { dn: 'DN450', f1: 1.0, f2: 9.6, f3: 575.0, f4: NaN },
  { dn: 'DN600', f1: 1.2, f2: 21.0, f3: 1230.0, f4: NaN },
  { dn: 'DN750', f1: 1.5, f2: 40.0, f3: 2390.0, f4: NaN },
  { dn: 'DN900', f1: 1.5, f2: 57.0, f3: 3440.0, f4: NaN },
  { dn: 'DN1200', f1: 1.7, f2: 116.0, f3: 6960.0, f4: NaN },
];

export const GAS_FACTORS_F1 = [
  { gas: 'Natural', F1_gas: 42.0, F1_n2: 67.0 },
  { gas: 'Propane', F1_gas: 102.0, F1_n2: 221.0 },
  { gas: 'Butane', F1_gas: 128.0, F1_n2: 305.0 },
  { gas: 'Lpg/Air (Sng)', F1_gas: 45.0, F1_n2: 60.0 },
  { gas: 'Lpg/Air (Smg)', F1_gas: 28.0, F1_n2: 33.0 },
  { gas: 'Coal Gas', F1_gas: 20.0, F1_n2: 31.0 },
];

export const OPERATING_FACTORS_F3 = [
  { gas: 'Natural', F3_gas: 0.059, F3_n2: 0.094 },
  { gas: 'Propane', F3_gas: 0.059, F3_n2: 0.126 },
  { gas: 'Butane', F3_gas: 0.059, F3_n2: 0.134 },
  { gas: 'Lpg/Air (Sng)', F3_gas: 0.059, F3_n2: 0.078 },
  { gas: 'Lpg/Air (Smg)', F3_gas: 0.059, F3_n2: 0.069 },
  { gas: 'Coal Gas', F3_gas: 0.059, F3_n2: 0.09 },
];


// Convenience maps (by key)
export const PIPE_MAP = Object.fromEntries(PIPES.map(p => [p.dn, p.volumePerMeter_m3]));
export const METER_MAP = Object.fromEntries(METERS.map(m => [m.meter, {install: m.installVolume_m3, purge: m.purgeVolume_m3}]));
export const HOSE_MAP = Object.fromEntries(PURGE_HOSE.map(h => [h.size, h.hoseVolume_m3]));
export const F1_MAP = Object.fromEntries(GAS_FACTORS_F1.map(g => [g.gas.toLowerCase(), {gas: g.F1_gas, n2: g.F1_n2}]));
export const F3_MAP = Object.fromEntries(OPERATING_FACTORS_F3.map(g => [g.gas.toLowerCase(), {gas: g.F3_gas, n2: g.F3_n2}]));
export const TABLE12_MAP = Object.fromEntries(TABLE12.map(e => [e.dn, {f1: e.f1, f2: e.f2, f3: e.f3, f4: e.f4}]));


// === Algorithms inferred from Sheet1 ===
// Units: lengths in meters (m), volumes in cubic meters (m^3).
// Purge multiplier observed on Sheet1 is 1.5 (Purge = 1.5 * Installation).
// Meter purge volumes come from Table 3 explicitly and should take precedence.

export const DEFAULT_PURGE_MULTIPLIER = 1.5;

export function pipeInstallVolume(dn, length_m) {
  const vpm = PIPE_MAP[dn];
  if (vpm == null) throw new Error(`Unknown pipe DN: ${dn}`);
  if (length_m == null) throw new Error(`Length required for pipe ${dn}`);
  return vpm * Number(length_m);
}

export function pipePurgeVolume(dn, length_m, purgeMultiplier = DEFAULT_PURGE_MULTIPLIER) {
  return pipeInstallVolume(dn, length_m) * purgeMultiplier;
}

export function meterInstallVolume(meterName) {
  const m = METER_MAP[meterName];
  if (!m) throw new Error(`Unknown meter: ${meterName}`);
  return m.install;
}

export function meterPurgeVolume(meterName) {
  const m = METER_MAP[meterName];
  if (!m) throw new Error(`Unknown meter: ${meterName}`);
  // Prefer explicit purge volume from Table 3; fall back to multiplier if zero.
  return (m.purge && m.purge > 0) ? m.purge : m.install * DEFAULT_PURGE_MULTIPLIER;
}

/**
 * Compute totals for an installation.
 * @param {Array<{dn:string, length_m:number}>} pipes - list of pipe segments.
 * @param {string|null} meterName - selected meter (or "No Meter"/null).
 * @param {string|null} purgeHoseSize - optional purge hose size to include.
 * @param {number} purgeMultiplier - optional override for pipe purge multiplier.
 */
export function computeTotals({pipes = [], meterName = null, purgeHoseSize = null, purgeMultiplier = DEFAULT_PURGE_MULTIPLIER} = {}) {
  // Sum pipes
  const pipeInstall = pipes.reduce((sum, seg) => sum + pipeInstallVolume(seg.dn, seg.length_m), 0);
  const pipePurge = pipes.reduce((sum, seg) => sum + pipePurgeVolume(seg.dn, seg.length_m, purgeMultiplier), 0);

  // Meter volumes (optional)
  let meterInstall = 0, meterPurge = 0;
  if (meterName && meterName.toLowerCase() !== "no meter") {
    meterInstall = meterInstallVolume(meterName);
    meterPurge   = meterPurgeVolume(meterName);
  }

  // Purge hose (optional flat volume added)
  const hoseVol = purgeHoseSize ? (HOSE_MAP[purgeHoseSize] ?? 0) : 0;

  return {
    installVolume_m3: pipeInstall + meterInstall,
    purgeVolume_m3: pipePurge + meterPurge + hoseVol,
    breakdown: {
      pipeInstall_m3: pipeInstall,
      pipePurge_m3: pipePurge,
      meterInstall_m3: meterInstall,
      meterPurge_m3: meterPurge,
      purgeHose_m3: hoseVol
    }
  };
}
