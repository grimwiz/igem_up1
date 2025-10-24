// Auto-generated from UP1.xlsx — contains all lookup data and helper algorithms.

export const GAS_SIZING_DATA_VERSION = '2024-06-01';

export const DIAPHRAGM_PURGE_MULTIPLIER = 5;

export const DIAPHRAGM_METERS = [
  { meter: 'U6', installVolume_m3: 0.008, purgeVolume_m3: 0.002 },
  { meter: 'U16', installVolume_m3: 0.025, purgeVolume_m3: 0.006 },
  { meter: 'U25', installVolume_m3: 0.037, purgeVolume_m3: 0.01 },
  { meter: 'U40', installVolume_m3: 0.067, purgeVolume_m3: 0.02 },
  { meter: 'U65', installVolume_m3: 0.1, purgeVolume_m3: 0.025 },
  { meter: 'U100', installVolume_m3: 0.182, purgeVolume_m3: 0.057 },
  { meter: 'U160', installVolume_m3: 0.304, purgeVolume_m3: 0.071 },
  { meter: 'U250', installVolume_m3: 0.471, purgeVolume_m3: 0.111 },
  { meter: 'U400', installVolume_m3: 0.752, purgeVolume_m3: 0.178 },
  { meter: 'No Meter', installVolume_m3: 0.0, purgeVolume_m3: 0.0 }
];

export const ROTARY_METERS = [
  { meter: 'No Meter', installVolume_m3: 0.0, purgeVolume_m3: 0.0 },
  { meter: 'DN32', installVolume_m3: 0.004, purgeVolume_m3: 0.001 },
  { meter: 'DN40', installVolume_m3: 0.006, purgeVolume_m3: 0.0015 },
  { meter: 'DN50', installVolume_m3: 0.009, purgeVolume_m3: 0.0023 },
  { meter: 'DN65', installVolume_m3: 0.014, purgeVolume_m3: 0.0035 },
  { meter: 'DN80', installVolume_m3: 0.021, purgeVolume_m3: 0.0053 },
  { meter: 'DN100', installVolume_m3: 0.032, purgeVolume_m3: 0.008 },
  { meter: 'DN150', installVolume_m3: 0.06, purgeVolume_m3: 0.015 },
  { meter: 'DN200', installVolume_m3: 0.1, purgeVolume_m3: 0.025 },
  { meter: 'DN250', installVolume_m3: 0.15, purgeVolume_m3: 0.038 },
  { meter: 'DN300', installVolume_m3: 0.21, purgeVolume_m3: 0.053 },
  { meter: 'DN350', installVolume_m3: 0.27, purgeVolume_m3: 0.068 },
  { meter: 'DN400', installVolume_m3: 0.34, purgeVolume_m3: 0.085 },
  { meter: 'DN450', installVolume_m3: 0.42, purgeVolume_m3: 0.105 },
  { meter: 'DN500', installVolume_m3: 0.5, purgeVolume_m3: 0.125 }
];

export const PIPE_LIBRARY = [
  {
    id: 'DN15',
    label: 'DN15 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.00024,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN20',
    label: 'DN20 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.00046,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN25',
    label: 'DN25 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.00064,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN32',
    label: 'DN32 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.0011,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN40',
    label: 'DN40 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.0015,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN50',
    label: 'DN50 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.0024,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN65',
    label: 'DN65 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.0038,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN80',
    label: 'DN80 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.0054,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN100',
    label: 'DN100 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.009,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN125',
    label: 'DN125 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.014,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN150',
    label: 'DN150 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.02,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN200',
    label: 'DN200 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.035,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN250',
    label: 'DN250 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.053,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN300',
    label: 'DN300 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.074,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN350',
    label: 'DN350 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.089,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN400',
    label: 'DN400 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.118,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: 'DN450',
    label: 'DN450 carbon steel tube',
    category: 'pipe',
    volumePerMeter_m3: 0.151,
    source: 'IGEM/UP/1 Table 4 — carbon steel pipe internal volume per metre.'
  },
  {
    id: '15mm Cu',
    label: '15 mm copper tube',
    category: 'pipe',
    volumePerMeter_m3: 0.00014,
    source: 'IGEM/UP/1 Table 4 — copper pipe internal volume per metre.'
  },
  {
    id: '22mm Cu',
    label: '22 mm copper tube',
    category: 'pipe',
    volumePerMeter_m3: 0.00032,
    source: 'IGEM/UP/1 Table 4 — copper pipe internal volume per metre.'
  },
  {
    id: '28mm Cu',
    label: '28 mm copper tube',
    category: 'pipe',
    volumePerMeter_m3: 0.00054,
    source: 'IGEM/UP/1 Table 4 — copper pipe internal volume per metre.'
  },
  {
    id: '35mm Cu',
    label: '35 mm copper tube',
    category: 'pipe',
    volumePerMeter_m3: 0.00084,
    source: 'IGEM/UP/1 Table 4 — copper pipe internal volume per metre.'
  },
  {
    id: '42mm Cu',
    label: '42 mm copper tube',
    category: 'pipe',
    volumePerMeter_m3: 0.0012,
    source: 'IGEM/UP/1 Table 4 — copper pipe internal volume per metre.'
  },
  {
    id: '54mm Cu',
    label: '54 mm copper tube',
    category: 'pipe',
    volumePerMeter_m3: 0.0021,
    source: 'IGEM/UP/1 Table 4 — copper pipe internal volume per metre.'
  },
  {
    id: '67mm Cu',
    label: '67 mm copper tube',
    category: 'pipe',
    volumePerMeter_m3: 0.0033,
    source: 'IGEM/UP/1 Table 4 — copper pipe internal volume per metre.'
  }
];

export const PURGE_HOSES = [
  {
    id: 'Purge hose 20mm',
    label: '20 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.00046,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  },
  {
    id: 'Purge hose 25mm',
    label: '25 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.00064,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  },
  {
    id: 'Purge hose 32mm',
    label: '32 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.0011,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  },
  {
    id: 'Purge hose 40mm',
    label: '40 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.0015,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  },
  {
    id: 'Purge hose 50mm',
    label: '50 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.0024,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  },
  {
    id: 'Purge hose 65mm',
    label: '65 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.0038,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  },
  {
    id: 'Purge hose 80mm',
    label: '80 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.0054,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  },
  {
    id: 'Purge hose 100mm',
    label: '100 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.009,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  },
  {
    id: 'Purge hose 125mm',
    label: '125 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.014,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  },
  {
    id: 'Purge hose 150mm',
    label: '150 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.02,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  },
  {
    id: 'Purge hose 200mm',
    label: '200 mm purge hose',
    category: 'purge-hose',
    volumePerMeter_m3: 0.035,
    source: 'IGEM/UP/1 Table 4 — flexible purge hose internal volume per metre.'
  }
];

export const PIPE_SEGMENT_LIBRARY = [...PIPE_LIBRARY, ...PURGE_HOSES];

export const TABLE6 = [
  { gauge: 'Water SG', range: '0-120', GRM: 0.5, TTD_Max: 30 },
  { gauge: 'High SG', range: '0-200', GRM: 1.0, TTD_Max: 45 },
  { gauge: 'Elec 1 dp', range: '0-200', GRM: 0.5, TTD_Max: 30 },
  { gauge: 'Elec 2 dp', range: '0-200', GRM: 0.1, TTD_Max: 15 },
  { gauge: 'Elec 1dp', range: '0-2000', GRM: 0.5, TTD_Max: 30 },
  { gauge: 'Elec 0dp', range: '0-20000', GRM: 5.0, TTD_Max: 60 },
  { gauge: 'Mercury', range: '0-1000', GRM: 7.0, TTD_Max: 60 }
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
  { dn: 'DN1200', f1: 1.7, f2: 116.0, f3: 6960.0, f4: NaN }
];

export const GAS_FACTORS_F1 = [
  { gas: 'Natural', F1_gas: 42.0, F1_n2: 67.0 },
  { gas: 'Propane', F1_gas: 102.0, F1_n2: 221.0 },
  { gas: 'Butane', F1_gas: 128.0, F1_n2: 305.0 },
  { gas: 'Lpg/Air (Sng)', F1_gas: 45.0, F1_n2: 60.0 },
  { gas: 'Lpg/Air (Smg)', F1_gas: 28.0, F1_n2: 33.0 },
  { gas: 'Coal Gas', F1_gas: 20.0, F1_n2: 31.0 }
];

export const OPERATING_FACTORS_F3 = [
  { gas: 'Natural', F3_gas: 0.059, F3_n2: 0.094 },
  { gas: 'Propane', F3_gas: 0.059, F3_n2: 0.126 },
  { gas: 'Butane', F3_gas: 0.059, F3_n2: 0.134 },
  { gas: 'Lpg/Air (Sng)', F3_gas: 0.059, F3_n2: 0.078 },
  { gas: 'Lpg/Air (Smg)', F3_gas: 0.059, F3_n2: 0.069 },
  { gas: 'Coal Gas', F3_gas: 0.059, F3_n2: 0.09 }
];

const mapFromMeters = (meters) =>
  Object.fromEntries(meters.map((m) => [m.meter, { install: m.installVolume_m3, purge: m.purgeVolume_m3 }]));

export const PIPE_MAP = Object.fromEntries(PIPE_SEGMENT_LIBRARY.map((entry) => [entry.id, entry]));
export const DIAPHRAGM_METER_MAP = mapFromMeters(DIAPHRAGM_METERS);
export const ROTARY_METER_MAP = mapFromMeters(ROTARY_METERS);
export const F1_MAP = Object.fromEntries(GAS_FACTORS_F1.map((g) => [g.gas.toLowerCase(), { gas: g.F1_gas, n2: g.F1_n2 }]));
export const F3_MAP = Object.fromEntries(OPERATING_FACTORS_F3.map((g) => [g.gas.toLowerCase(), { gas: g.F3_gas, n2: g.F3_n2 }]));
export const TABLE6_MAP = Object.fromEntries(
  TABLE6.map((entry) => [entry.gauge, { range: entry.range, GRM: entry.GRM, TTD_Max: entry.TTD_Max }])
);
export const TABLE12_MAP = Object.fromEntries(TABLE12.map((e) => [e.dn, { f1: e.f1, f2: e.f2, f3: e.f3, f4: e.f4 }]));

export const DEFAULT_PURGE_MULTIPLIER = 1.5;

export function getPipeSegment(dn) {
  const entry = PIPE_MAP[dn];
  if (!entry) throw new Error(`Unknown pipe or purge hose: ${dn}`);
  return entry;
}

export function pipeInstallVolume(dn, length_m) {
  const entry = getPipeSegment(dn);
  if (length_m == null) throw new Error(`Length required for pipe ${dn}`);
  return entry.volumePerMeter_m3 * Number(length_m);
}

export function pipePurgeVolume(dn, length_m, purgeMultiplier = DEFAULT_PURGE_MULTIPLIER) {
  return pipeInstallVolume(dn, length_m) * purgeMultiplier;
}

const getMeterVolumes = (map, meterName) => {
  if (!meterName || meterName.toLowerCase() === 'no meter') {
    return { install: 0, purge: 0 };
  }
  const entry = map[meterName];
  if (!entry) throw new Error(`Unknown meter: ${meterName}`);
  const purge = entry.purge && entry.purge > 0 ? entry.purge : entry.install * DEFAULT_PURGE_MULTIPLIER;
  return { install: entry.install, purge };
};

/**
 * Compute totals for an installation.
 * @param {Array<{dn:string, length_m:number}>} pipes - list of pipe segments.
 * @param {string|null} diaphragmMeter - selected diaphragm meter.
 * @param {string|null} rotaryMeter - selected rotary meter.
 * @param {number} purgeMultiplier - optional override for pipe purge multiplier.
 */
export function computeTotals({
  pipes = [],
  diaphragmMeter = null,
  rotaryMeter = null,
  purgeMultiplier = DEFAULT_PURGE_MULTIPLIER
} = {}) {
  const pipeInstall = pipes.reduce((sum, seg) => sum + pipeInstallVolume(seg.dn, seg.length_m), 0);
  const pipePurge = pipes.reduce((sum, seg) => sum + pipePurgeVolume(seg.dn, seg.length_m, purgeMultiplier), 0);

  const diaphragmVolumes = getMeterVolumes(DIAPHRAGM_METER_MAP, diaphragmMeter);
  const rotaryVolumes = getMeterVolumes(ROTARY_METER_MAP, rotaryMeter);
  const diaphragmPurgeAllowance = diaphragmVolumes.purge * DIAPHRAGM_PURGE_MULTIPLIER;

  const systemComponentsVolume = pipeInstall + diaphragmVolumes.install + rotaryVolumes.install;
  const fittingsAllowance = systemComponentsVolume * 0.1;
  const estimatedSystemVolume = systemComponentsVolume + fittingsAllowance;

  return {
    installVolume_m3: pipeInstall + diaphragmVolumes.install + rotaryVolumes.install,
    purgeVolume_m3: pipePurge + diaphragmPurgeAllowance + rotaryVolumes.purge,
    fittingsAllowance_m3: fittingsAllowance,
    estimatedSystemVolume_m3: estimatedSystemVolume,
    breakdown: {
      pipeInstall_m3: pipeInstall,
      pipePurge_m3: pipePurge,
      diaphragmInstall_m3: diaphragmVolumes.install,
      diaphragmPurge_m3: diaphragmPurgeAllowance,
      rotaryInstall_m3: rotaryVolumes.install,
      rotaryPurge_m3: rotaryVolumes.purge
    }
  };
}

export const STANDARD_REFERENCE_TABLES = [
  {
    id: 'diaphragm-meter-table',
    title: 'IGEM/UP/1 Table 3 — Diaphragm meter allowances',
    summary:
      `Volume allowances for diaphragm meters used when calculating installation volumes and purge requirements for meter sets. The purge allowance column is multiplied by ${DIAPHRAGM_PURGE_MULTIPLIER} when estimating purge gas volume.`,
    columns: [
      { key: 'meter', label: 'Meter designation' },
      { key: 'installVolume_m3', label: 'Installation allowance (m³)' },
      { key: 'purgeVolume_m3', label: 'Table 3 purge allowance (m³)' }
    ],
    rows: DIAPHRAGM_METERS
  },
  {
    id: 'rotary-meter-table',
    title: 'IGEM/UP/1 Table 3 — Rotary meter allowances',
    summary:
      'Rotary meter installation and purge allowances used when the installation includes rotary or turbine style meters.',
    columns: [
      { key: 'meter', label: 'Meter designation' },
      { key: 'installVolume_m3', label: 'Installation allowance (m³)' },
      { key: 'purgeVolume_m3', label: 'Table 3 purge allowance (m³)' }
    ],
    rows: ROTARY_METERS
  },
  {
    id: 'pipe-and-hose-table',
    title: 'IGEM/UP/1 Table 4 — Pipe and purge hose volumes',
    summary:
      'Internal volume per metre for carbon steel, copper and purge hose sections. These values build the installation volume for the pipe schedule.',
    columns: [
      { key: 'label', label: 'Size' },
      { key: 'category', label: 'Component type' },
      { key: 'volumePerMeter_m3', label: 'Volume per metre (m³)' }
    ],
    rows: PIPE_SEGMENT_LIBRARY
  },
  {
    id: 'pressure-gauge-table',
    title: 'IGEM/UP/1 Table 6 — Pressure gauge selection',
    summary:
      'Recommended pressure gauges, ranges and multipliers for tightness testing across the IGEM/UP/1 procedure.',
    columns: [
      { key: 'gauge', label: 'Instrument type' },
      { key: 'range', label: 'Range (mbar)' },
      { key: 'GRM', label: 'Gauge reading multiplier (GRM)' },
      { key: 'TTD_Max', label: 'Max tightness test duration (min)' }
    ],
    rows: TABLE6
  },
  {
    id: 'purge-factors-table',
    title: 'IGEM/UP/1 Table 12 — Purge factors for large pipework',
    summary:
      'Scaling factors applied when calculating purge volumes for large diameter pipe systems where the standard multipliers require adjustment.',
    columns: [
      { key: 'dn', label: 'Nominal diameter' },
      { key: 'f1', label: 'Factor f1' },
      { key: 'f2', label: 'Factor f2' },
      { key: 'f3', label: 'Factor f3' },
      { key: 'f4', label: 'Factor f4' }
    ],
    rows: TABLE12
  },
  {
    id: 'gas-factor-f1-table',
    title: 'IGEM/UP/1 gas factor F1 reference',
    summary:
      'Gas factor F1 for common fuel gases and nitrogen, used when determining purge flow rates and volumes.',
    columns: [
      { key: 'gas', label: 'Gas family' },
      { key: 'F1_gas', label: 'F1 (gas purge)' },
      { key: 'F1_n2', label: 'F1 (nitrogen purge)' }
    ],
    rows: GAS_FACTORS_F1
  },
  {
    id: 'gas-factor-f3-table',
    title: 'IGEM/UP/1 operating factor F3 reference',
    summary:
      'Operating factor F3 used alongside F1 when planning purge durations for natural gas and LPG variants.',
    columns: [
      { key: 'gas', label: 'Gas family' },
      { key: 'F3_gas', label: 'F3 (gas purge)' },
      { key: 'F3_n2', label: 'F3 (nitrogen purge)' }
    ],
    rows: OPERATING_FACTORS_F3
  }
];
