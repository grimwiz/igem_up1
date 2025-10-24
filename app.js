import {
  PIPE_MAP,
  HOSE_MAP,
  DIAPHRAGM_METERS,
  ROTARY_METERS,
  TABLE6,
  TABLE6_MAP,
  TABLE12_MAP,
  F3_MAP,
  computeTotals,
  DEFAULT_PURGE_MULTIPLIER,
  GAS_SIZING_DATA_VERSION,
  pipeInstallVolume,
  pipePurgeVolume
} from './gasSizing.js';

const STORAGE_KEY = 'igem-up1-procedure';
const APP_VERSION = '1.2.0';
const INPUT_SELECTOR =
  'input[type="text"], input[type="number"], input[type="date"], input[type="hidden"], textarea, select, input[type="checkbox"]';

const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .catch((error) => console.error('Service worker registration failed:', error));
    });
  }
};

const inputs = Array.from(document.querySelectorAll(INPUT_SELECTOR));

const dispatchDataUpdated = () => {
  document.dispatchEvent(new Event('procedure-data-updated'));
};

const setVersionInfo = () => {
  const appVersion = document.getElementById('app-version');
  if (appVersion) {
    appVersion.textContent = APP_VERSION;
  }

  const dataVersion = document.getElementById('data-version');
  if (dataVersion) {
    dataVersion.textContent = GAS_SIZING_DATA_VERSION;
  }
};

const applyInputData = (data = {}) => {
  inputs.forEach((input) => {
    if (!input.id) return;
    if (input.type === 'checkbox') {
      input.checked = Boolean(data[input.id]);
    } else if (Object.prototype.hasOwnProperty.call(data, input.id)) {
      input.value = data[input.id] ?? '';
    } else if (input.tagName !== 'SELECT') {
      input.value = '';
    }
  });
  dispatchDataUpdated();
};

const serialiseFormData = () => {
  const data = {};
  inputs.forEach((input) => {
    if (!input.id) return;
    if (input.type === 'checkbox') {
      data[input.id] = input.checked;
    } else {
      data[input.id] = input.value;
    }
  });
  return data;
};

const buildExportPayload = () => ({
  ...serialiseFormData(),
  __metadata: {
    appVersion: APP_VERSION,
    gasSizingDataVersion: GAS_SIZING_DATA_VERSION,
    exportedAt: new Date().toISOString()
  }
});

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object') {
      applyInputData(parsed);
    }
  } catch (error) {
    console.error('Could not load saved state', error);
  }
};

const saveState = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialiseFormData()));
  } catch (error) {
    console.error('Could not persist state', error);
  }
};

const readNumber = (input) => {
  if (!input) return Number.NaN;
  const value = parseFloat(input.value);
  return Number.isFinite(value) ? value : Number.NaN;
};

const formatNumber = (value, decimals = 2) => {
  if (!Number.isFinite(value)) return '—';
  return Number(value).toFixed(decimals);
};

const formatVolume = (value) => formatNumber(value, 4);

const updateReadOnlyInput = (input, value) => {
  if (!input) return;
  const newValue = value ?? '';
  if (input.value !== newValue) {
    input.value = newValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

const normaliseLength = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }
  const numeric = parseFloat(String(value));
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
};

function initialisePipeCalculator() {
  const pipeRowsBody = document.getElementById('pipe-rows');
  const addPipeButton = document.getElementById('add-pipe-row');
  const diaphragmSelect = document.getElementById('diaphragm-meter-select');
  const rotarySelect = document.getElementById('rotary-meter-select');
  const hoseSelect = document.getElementById('purge-hose-size');
  const purgeMultiplierInput = document.getElementById('purge-multiplier');
  const summary = document.getElementById('pipe-volume-summary');
  const totalsBody = document.getElementById('pipe-volume-breakdown-body');
  const segmentBody = document.getElementById('pipe-segment-breakdown-body');
  const hiddenField = document.getElementById('pipe-configuration');
  const systemVolumeInput = document.getElementById('volume');
  const purgeVolumeInput = document.getElementById('purge-volume');

  if (
    !pipeRowsBody ||
    !addPipeButton ||
    !diaphragmSelect ||
    !rotarySelect ||
    !hoseSelect ||
    !purgeMultiplierInput ||
    !summary ||
    !totalsBody ||
    !segmentBody ||
    !hiddenField ||
    !systemVolumeInput
  ) {
    return;
  }

  const pipeOptions = Object.keys(PIPE_MAP);
  const sortMeterNames = (names) =>
    names
      .slice()
      .sort((a, b) => {
        const aIsNoMeter = a.toLowerCase() === 'no meter';
        const bIsNoMeter = b.toLowerCase() === 'no meter';
        if (aIsNoMeter && !bIsNoMeter) return -1;
        if (!aIsNoMeter && bIsNoMeter) return 1;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      });
  const formatMeterLabel = (value) => (value.toLowerCase() === 'no meter' ? 'No Meter' : value.toUpperCase());
  const diaphragmMeterOptions = sortMeterNames(DIAPHRAGM_METERS.map((entry) => entry.meter));
  const rotaryMeterOptions = sortMeterNames(ROTARY_METERS.map((entry) => entry.meter));
  const hoseOptions = Object.keys(HOSE_MAP)
    .filter((size) => Number.isFinite(HOSE_MAP[size]))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const populateMeterSelect = (select, options) => {
    select.innerHTML = options.map((meter) => `<option value="${meter}">${formatMeterLabel(meter)}</option>`).join('');
    if (!select.value) {
      const defaultMeter = options.find((option) => option.toLowerCase() === 'no meter') ?? options[0] ?? '';
      select.value = defaultMeter;
    }
  };

  populateMeterSelect(diaphragmSelect, diaphragmMeterOptions);
  populateMeterSelect(rotarySelect, rotaryMeterOptions);

  hoseSelect.innerHTML = [
    '<option value="">No purge hose</option>',
    ...hoseOptions.map((size) => `<option value="${size}">${size}</option>`)
  ].join('');

  if (!hoseSelect.value) {
    hoseSelect.value = '';
  }

  if (!purgeMultiplierInput.value) {
    purgeMultiplierInput.value = DEFAULT_PURGE_MULTIPLIER.toFixed(1);
  }

  let pipeSegments = [];
  const rowElements = [];

  const ensureAtLeastOneSegment = () => {
    if (!pipeOptions.length) return;
    if (!pipeSegments.length) {
      pipeSegments.push({ dn: pipeOptions[0], length_m: '' });
    }
  };

  const persistSegments = (triggerSave = true) => {
    if (!hiddenField) return;
    const serialisable = pipeSegments.map((segment) => ({
      dn: segment.dn,
      length_m: segment.length_m ?? ''
    }));
    const serialised = JSON.stringify(serialisable);
    if (serialised !== hiddenField.value) {
      hiddenField.value = serialised;
      if (triggerSave) {
        hiddenField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  const getSegmentsForTotals = () =>
    pipeSegments.map((segment) => ({ dn: segment.dn, length_m: normaliseLength(segment.length_m) }));

  const isMultiplierValid = () => {
    const raw = parseFloat(purgeMultiplierInput.value);
    return Number.isFinite(raw) && raw > 0;
  };

  const getPurgeMultiplier = () => {
    const raw = parseFloat(purgeMultiplierInput.value);
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_PURGE_MULTIPLIER;
  };

  const createReadonlyInput = () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.tabIndex = -1;
    input.className = 'numeric-readonly';
    input.setAttribute('aria-live', 'off');
    input.setAttribute('aria-label', 'Calculated value');
    return input;
  };

  const updateAllRowVolumes = (multiplierOverride) => {
    rowElements.forEach((row) => row.updateVolumes(multiplierOverride));
  };

  const renderRows = () => {
    rowElements.length = 0;
    pipeRowsBody.innerHTML = '';
    ensureAtLeastOneSegment();

    pipeSegments.forEach((segment, index) => {
      if (!pipeOptions.includes(segment.dn)) {
        segment.dn = pipeOptions[0];
      }
      const row = document.createElement('tr');

      const dnCell = document.createElement('td');
      const dnSelect = document.createElement('select');
      pipeOptions.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        dnSelect.appendChild(opt);
      });
      dnSelect.value = segment.dn;
      dnSelect.addEventListener('change', () => {
        pipeSegments[index].dn = dnSelect.value;
        updateAllRowVolumes();
        persistSegments();
        updateSummary();
      });
      dnCell.appendChild(dnSelect);

      const lengthCell = document.createElement('td');
      const lengthInput = document.createElement('input');
      lengthInput.type = 'number';
      lengthInput.min = '0';
      lengthInput.step = '0.01';
      lengthInput.placeholder = '0.00';
      lengthInput.value = segment.length_m ?? '';
      lengthInput.addEventListener('input', () => {
        pipeSegments[index].length_m = lengthInput.value === '' ? '' : lengthInput.value;
        updateAllRowVolumes();
        persistSegments();
        updateSummary();
      });
      lengthCell.appendChild(lengthInput);

      const volumeCell = document.createElement('td');
      volumeCell.classList.add('numeric');
      const volumeInput = createReadonlyInput();
      volumeInput.setAttribute('aria-label', 'Pipe volume per metre');
      volumeCell.appendChild(volumeInput);

      const installCell = document.createElement('td');
      installCell.classList.add('numeric');
      const installInput = createReadonlyInput();
      installInput.setAttribute('aria-label', 'Installation volume for this pipe segment');
      installCell.appendChild(installInput);

      const purgeCell = document.createElement('td');
      purgeCell.classList.add('numeric');
      const purgeInput = createReadonlyInput();
      purgeInput.setAttribute('aria-label', 'Purge volume for this pipe segment');
      purgeCell.appendChild(purgeInput);

      const actionsCell = document.createElement('td');
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.textContent = 'Remove';
      removeButton.className = 'table-action-button';
      removeButton.disabled = pipeSegments.length <= 1;
      removeButton.title = pipeSegments.length <= 1 ? 'At least one segment is required' : '';
      removeButton.addEventListener('click', () => {
        if (pipeSegments.length <= 1) return;
        pipeSegments.splice(index, 1);
        renderRows();
        persistSegments();
        updateSummary();
      });
      actionsCell.appendChild(removeButton);

      const updateRowVolumes = (multiplierOverride) => {
        const multiplier = typeof multiplierOverride === 'number' ? multiplierOverride : getPurgeMultiplier();
        const lengthValue = normaliseLength(pipeSegments[index]?.length_m);
        let installVolume = Number.NaN;
        let purgeVolume = Number.NaN;
        try {
          installVolume = pipeInstallVolume(pipeSegments[index].dn, lengthValue);
          purgeVolume = pipePurgeVolume(pipeSegments[index].dn, lengthValue, multiplier);
        } catch (error) {
          console.error('Pipe segment calculation failed', error);
        }
        volumeInput.value = formatVolume(PIPE_MAP[pipeSegments[index].dn]);
        installInput.value = formatVolume(installVolume);
        purgeInput.value = formatVolume(purgeVolume);
      };

      row.appendChild(dnCell);
      row.appendChild(lengthCell);
      row.appendChild(volumeCell);
      row.appendChild(installCell);
      row.appendChild(purgeCell);
      row.appendChild(actionsCell);

      pipeRowsBody.appendChild(row);
      rowElements.push({ updateVolumes: updateRowVolumes });
      updateRowVolumes();
    });
  };

  const updateSummary = () => {
    const multiplierValid = isMultiplierValid();
    const multiplier = getPurgeMultiplier();
    const diaphragmSelection = diaphragmSelect.value;
    const diaphragmEntry = DIAPHRAGM_METERS.find((entry) => entry.meter === diaphragmSelection);
    const hasDiaphragm = Boolean(diaphragmEntry && diaphragmEntry.meter.toLowerCase() !== 'no meter');
    const diaphragmKey = hasDiaphragm ? diaphragmSelection : null;

    const rotarySelection = rotarySelect.value;
    const rotaryEntry = ROTARY_METERS.find((entry) => entry.meter === rotarySelection);
    const hasRotary = Boolean(rotaryEntry && rotaryEntry.meter.toLowerCase() !== 'no meter');
    const rotaryKey = hasRotary ? rotarySelection : null;
    const hoseSelection = hoseSelect.value;
    const hasHose = Boolean(hoseSelection && Number.isFinite(HOSE_MAP[hoseSelection]));
    const hoseKey = hasHose ? hoseSelection : null;
    purgeMultiplierInput.setAttribute(
      'aria-invalid',
      !multiplierValid && purgeMultiplierInput.value !== '' ? 'true' : 'false'
    );

    try {
      const pipesForTotals = getSegmentsForTotals();
      const totals = computeTotals({
        pipes: pipesForTotals,
        diaphragmMeter: diaphragmKey,
        rotaryMeter: rotaryKey,
        purgeHoseSize: hoseKey,
        purgeMultiplier: multiplier
      });
      const breakdown = totals.breakdown;
      const systemVolumeBase =
        breakdown.pipeInstall_m3 +
        breakdown.diaphragmInstall_m3 +
        breakdown.rotaryInstall_m3 +
        (Number.isFinite(breakdown.purgeHose_m3) ? breakdown.purgeHose_m3 : 0);
      const fittingsAllowance = totals.fittingsAllowance_m3 ?? systemVolumeBase * 0.1;
      const estimatedSystemVolume = totals.estimatedSystemVolume_m3 ?? systemVolumeBase + fittingsAllowance;

      if (systemVolumeInput) {
        const newValue = Number.isFinite(estimatedSystemVolume) ? estimatedSystemVolume.toFixed(4) : '';
        if (systemVolumeInput.value !== newValue) {
          systemVolumeInput.value = newValue;
          systemVolumeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      if (purgeVolumeInput) {
        const purgeValue = Number.isFinite(totals.purgeVolume_m3) ? totals.purgeVolume_m3.toFixed(4) : '';
        if (purgeVolumeInput.value !== purgeValue) {
          purgeVolumeInput.value = purgeValue;
          purgeVolumeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      updateAllRowVolumes(multiplier);

      const multiplierSentence = multiplierValid
        ? `Pipe purge uses ${formatNumber(multiplier, 2)} × the installed pipe volume as per IGEM/UP/1 Sheet 1.`
        : `Default ${formatNumber(DEFAULT_PURGE_MULTIPLIER, 2)} × pipe purge factor applied because the override is empty or invalid.`;
      const meterNarrative = [
        hasDiaphragm
          ? `Diaphragm meter ${diaphragmSelection.toUpperCase()} contributes ${formatVolume(
              breakdown.diaphragmInstall_m3
            )} m³ (install) and ${formatVolume(breakdown.diaphragmPurge_m3)} m³ (purge) using Table 3 values.`
          : 'No diaphragm meter selected, so no diaphragm allowance is included.',
        hasRotary
          ? `Rotary meter ${rotarySelection.toUpperCase()} contributes ${formatVolume(breakdown.rotaryInstall_m3)} m³ (install) and ${formatVolume(
              breakdown.rotaryPurge_m3
            )} m³ (purge) using Table 3 values.`
          : 'No rotary meter selected, so no rotary allowance is included.'
      ].join(' ');
      const hoseSentence = hasHose
        ? `${hoseSelection} purge hose allowance adds ${formatVolume(breakdown.purgeHose_m3)} m³ from Table 4.`
        : 'No purge hose allowance applied.';

      summary.innerHTML = `
        <p><strong>Total installation volume:</strong> ${formatVolume(totals.installVolume_m3)} m³ (pipes ${formatVolume(
          breakdown.pipeInstall_m3
        )} m³ + diaphragm ${formatVolume(breakdown.diaphragmInstall_m3)} m³ + rotary ${formatVolume(
          breakdown.rotaryInstall_m3
        )} m³).</p>
        <p><strong>Total purge volume:</strong> ${formatVolume(totals.purgeVolume_m3)} m³ (pipes ${formatVolume(
          breakdown.pipePurge_m3
        )} m³ + diaphragm ${formatVolume(breakdown.diaphragmPurge_m3)} m³ + rotary ${formatVolume(
          breakdown.rotaryPurge_m3
        )} m³ + hose ${formatVolume(breakdown.purgeHose_m3)} m³).</p>
        <p><strong>Estimated system volume:</strong> ${formatVolume(estimatedSystemVolume)} m³ including ${formatVolume(
          fittingsAllowance
        )} m³ (10% fittings allowance).</p>
        <p>${multiplierSentence}</p>
        <p>${meterNarrative} ${hoseSentence}</p>
      `;

      const breakdownRows = [
        ['Pipe installation (Table 4)', formatVolume(breakdown.pipeInstall_m3)],
        ['Pipe purge (factor × install)', formatVolume(breakdown.pipePurge_m3)],
        ['Diaphragm installation (Table 3)', formatVolume(breakdown.diaphragmInstall_m3)],
        ['Diaphragm purge (Table 3)', formatVolume(breakdown.diaphragmPurge_m3)],
        ['Rotary installation (Table 3)', formatVolume(breakdown.rotaryInstall_m3)],
        ['Rotary purge (Table 3)', formatVolume(breakdown.rotaryPurge_m3)],
        ['Purge hose allowance', formatVolume(breakdown.purgeHose_m3)],
        ['Fittings allowance (10%)', formatVolume(fittingsAllowance)],
        ['Estimated system volume', formatVolume(estimatedSystemVolume)],
        ['Total installation', formatVolume(totals.installVolume_m3)],
        ['Total purge', formatVolume(totals.purgeVolume_m3)]
      ];
      totalsBody.innerHTML = breakdownRows
        .map((row) => `<tr><td>${row[0]}</td><td class="numeric">${row[1]}</td></tr>`)
        .join('');

      segmentBody.innerHTML = pipesForTotals
        .map((segment) => {
          let install = Number.NaN;
          let purge = Number.NaN;
          try {
            install = pipeInstallVolume(segment.dn, segment.length_m);
            purge = pipePurgeVolume(segment.dn, segment.length_m, multiplier);
          } catch (error) {
            console.error('Segment breakdown calculation failed', error);
          }
          return `
            <tr>
              <td>${segment.dn}</td>
              <td class="numeric">${formatNumber(segment.length_m, 2)}</td>
              <td class="numeric">${formatVolume(install)}</td>
              <td class="numeric">${formatVolume(purge)}</td>
            </tr>
          `;
        })
        .join('');
    } catch (error) {
      summary.innerHTML = `<p>Unable to calculate volumes: ${error instanceof Error ? error.message : 'Unknown error'}.</p>`;
      totalsBody.innerHTML = '';
      segmentBody.innerHTML = '';
      console.error('Volume calculation failed', error);
    }
  };

  const restoreFromHidden = () => {
    if (!hiddenField) return;
    if (!hiddenField.value) {
      pipeSegments = [];
      ensureAtLeastOneSegment();
      renderRows();
      persistSegments(false);
      updateSummary();
      return;
    }
    try {
      const parsed = JSON.parse(hiddenField.value);
      if (Array.isArray(parsed)) {
        pipeSegments = parsed
          .map((entry) => ({
            dn: pipeOptions.includes(entry.dn) ? entry.dn : pipeOptions[0],
            length_m:
              entry.length_m === null || entry.length_m === undefined
                ? ''
                : String(entry.length_m)
          }))
          .filter((segment) => segment.dn);
      } else {
        pipeSegments = [];
      }
    } catch (error) {
      console.error('Could not parse stored pipe configuration', error);
      pipeSegments = [];
    }
    ensureAtLeastOneSegment();
    renderRows();
    updateSummary();
  };

  addPipeButton.addEventListener('click', () => {
    pipeSegments.push({ dn: pipeOptions[0], length_m: '' });
    renderRows();
    persistSegments();
    updateSummary();
  });

  diaphragmSelect.addEventListener('change', () => {
    updateSummary();
  });

  rotarySelect.addEventListener('change', () => {
    updateSummary();
  });

  hoseSelect.addEventListener('change', () => {
    updateSummary();
  });

  purgeMultiplierInput.addEventListener('input', () => {
    updateSummary();
  });

  document.addEventListener('procedure-data-updated', restoreFromHidden);
  restoreFromHidden();
}

function initialisePurgeHelpers() {
  const purgePipeSelect = document.getElementById('purge-pipe-diameter');
  const purgeFlowInput = document.getElementById('purge-max-flow-rate');
  const purgeTimeInput = document.getElementById('purge-time-minutes');
  const purgeVolumeInput = document.getElementById('purge-volume');
  const gasTypeSelect = document.getElementById('gas-type');
  const f3GasInput = document.getElementById('operating-factor-f3-gas');
  const f3N2Input = document.getElementById('operating-factor-f3-n2');
  const gaugeSelect = document.getElementById('gauge-choice');
  const gaugeRangeInput = document.getElementById('gauge-range');
  const gaugeGrmInput = document.getElementById('gauge-grm');
  const gaugeTtdInput = document.getElementById('gauge-ttd-max');

  if (purgePipeSelect && purgeFlowInput && purgeTimeInput) {
    const purgePipeOptions = Object.keys(TABLE12_MAP).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    if (!purgePipeSelect.options.length) {
      purgePipeSelect.innerHTML = purgePipeOptions.map((dn) => `<option value="${dn}">${dn}</option>`).join('');
    }
    if (!purgePipeSelect.value && purgePipeOptions.length) {
      purgePipeSelect.value = purgePipeOptions[0];
    }

    const parsePurgeVolume = () => {
      if (!purgeVolumeInput) return Number.NaN;
      const value = parseFloat(purgeVolumeInput.value);
      return Number.isFinite(value) && value >= 0 ? value : Number.NaN;
    };

    const updatePurgeOutputs = () => {
      const selection = purgePipeSelect.value;
      const entry = TABLE12_MAP[selection];
      const maxFlow = entry && Number.isFinite(entry.f3) ? entry.f3 : Number.NaN;
      const totalVolume = parsePurgeVolume();

      if (!Number.isFinite(maxFlow)) {
        updateReadOnlyInput(purgeFlowInput, '—');
      } else {
        updateReadOnlyInput(purgeFlowInput, formatNumber(maxFlow, 2));
      }

      if (!Number.isFinite(maxFlow) || maxFlow <= 0 || !Number.isFinite(totalVolume)) {
        updateReadOnlyInput(purgeTimeInput, '—');
        return;
      }

      const purgeTimeSeconds = (3600 * totalVolume) / maxFlow;
      updateReadOnlyInput(purgeTimeInput, formatNumber(purgeTimeSeconds, 2));
    };

    purgePipeSelect.addEventListener('change', updatePurgeOutputs);
    document.addEventListener('procedure-data-updated', updatePurgeOutputs);
    if (purgeVolumeInput) {
      purgeVolumeInput.addEventListener('input', updatePurgeOutputs);
    }
    updatePurgeOutputs();
  }

  if (f3GasInput && f3N2Input) {
    const mapGasTypeToF3Key = (value) => {
      switch (String(value || '').toLowerCase()) {
        case 'natural':
        case 'biomethane':
          return 'natural';
        case 'propane':
        case 'lpg':
          return 'propane';
        case 'butane':
          return 'butane';
        case 'lpg-air-sng':
          return 'lpg/air (sng)';
        case 'lpg-air-smg':
          return 'lpg/air (smg)';
        case 'coal-gas':
          return 'coal gas';
        default:
          return null;
      }
    };

    const updateOperatingFactors = () => {
      const gasKey = mapGasTypeToF3Key(gasTypeSelect ? gasTypeSelect.value : null);
      const entry = gasKey ? F3_MAP[gasKey] : null;
      if (!entry) {
        updateReadOnlyInput(f3GasInput, '—');
        updateReadOnlyInput(f3N2Input, '—');
        return;
      }
      updateReadOnlyInput(f3GasInput, formatNumber(entry.gas, 3));
      updateReadOnlyInput(f3N2Input, formatNumber(entry.n2, 3));
    };

    if (gasTypeSelect) {
      gasTypeSelect.addEventListener('change', updateOperatingFactors);
      gasTypeSelect.addEventListener('input', updateOperatingFactors);
    }
    document.addEventListener('procedure-data-updated', updateOperatingFactors);
    updateOperatingFactors();
  }

  if (gaugeSelect && gaugeRangeInput && gaugeGrmInput && gaugeTtdInput) {
    if (!gaugeSelect.options.length) {
      gaugeSelect.innerHTML = TABLE6.map((entry) => `<option value="${entry.gauge}">${entry.gauge}</option>`).join('');
    }
    if (!gaugeSelect.value && TABLE6.length) {
      gaugeSelect.value = TABLE6[0].gauge;
    }

    const updateGaugeOutputs = () => {
      const selection = gaugeSelect.value;
      const entry = TABLE6_MAP[selection];
      if (!entry) {
        updateReadOnlyInput(gaugeRangeInput, '');
        updateReadOnlyInput(gaugeGrmInput, '');
        updateReadOnlyInput(gaugeTtdInput, '');
        return;
      }
      updateReadOnlyInput(gaugeRangeInput, entry.range ?? '');
      updateReadOnlyInput(gaugeGrmInput, Number.isFinite(entry.GRM) ? formatNumber(entry.GRM, 1) : '—');
      updateReadOnlyInput(gaugeTtdInput, Number.isFinite(entry.TTD_Max) ? formatNumber(entry.TTD_Max, 0) : '—');
    };

    gaugeSelect.addEventListener('change', updateGaugeOutputs);
    document.addEventListener('procedure-data-updated', updateGaugeOutputs);
    updateGaugeOutputs();
  }
}

function calculateTestPlan() {
  const summary = document.getElementById('test-calculation-summary');
  const details = document.getElementById('test-calculation-details-body');
  if (!summary || !details) return;

  const designInput = document.getElementById('design-pressure');
  const operatingInput = document.getElementById('operating-pressure');
  const volumeInput = document.getElementById('volume');
  const fillRateInput = document.getElementById('test-fill-rate');
  const startTempInput = document.getElementById('test-temp-start');
  const endTempInput = document.getElementById('test-temp-end');
  const gasTypeInput = document.getElementById('gas-type');

  let designPressure = readNumber(designInput);
  const operatingPressure = readNumber(operatingInput);
  if (!Number.isFinite(designPressure)) {
    designPressure = operatingPressure;
  }

  const systemVolume = readNumber(volumeInput);
  const fillRate = readNumber(fillRateInput);
  const startTemp = readNumber(startTempInput);
  const endTemp = readNumber(endTempInput);
  const gasType = gasTypeInput ? gasTypeInput.options[gasTypeInput.selectedIndex]?.text ?? 'Unknown' : 'Unknown';

  if (!Number.isFinite(designPressure) || !Number.isFinite(systemVolume)) {
    summary.innerHTML =
      '<p>Please provide the design or operating pressure to generate recommendations. The estimated system volume is calculated automatically from the pipe schedule.</p>';
    details.innerHTML =
      '<p>Set the operating pressure in the Pipework Overview. Build the pipe schedule above to calculate the estimated system volume. Optional fields help refine the stabilisation and temperature allowances.</p>';
    return;
  }

  const pressureThreshold = 75;
  const lowPressure = designPressure <= pressureThreshold;
  const algorithmLogic = lowPressure
    ? `Low-pressure algorithm applied because design pressure (${formatNumber(designPressure, 1)} mbar) is ≤ ${pressureThreshold} mbar.`
    : `Medium/high-pressure algorithm applied because design pressure (${formatNumber(designPressure, 1)} mbar) exceeds ${pressureThreshold} mbar.`;

  const strengthTestPressure = lowPressure ? Math.max(designPressure * 1.5, 150) : Math.max(designPressure * 1.5, 1000);

  let tightnessTestPressure = lowPressure ? Math.max(designPressure, 20) : Math.max(designPressure * 1.1, 300);
  tightnessTestPressure = Math.min(tightnessTestPressure, strengthTestPressure * 0.9);

  let holdTimeMinutes;
  if (systemVolume <= 0.03) {
    holdTimeMinutes = 5;
  } else if (systemVolume <= 0.1) {
    holdTimeMinutes = 10;
  } else {
    holdTimeMinutes = 20 + (systemVolume - 0.1) * 30;
  }
  holdTimeMinutes = Math.max(5, Math.min(holdTimeMinutes, 180));

  let stabilisationMinutes = Number.NaN;
  if (Number.isFinite(systemVolume) && Number.isFinite(fillRate) && fillRate > 0) {
    stabilisationMinutes = Math.max(10, (systemVolume / fillRate) * 60 + 5);
  }

  let temperatureCompensation = Number.NaN;
  let temperatureNarrative = '';
  if (Number.isFinite(startTemp) && Number.isFinite(endTemp)) {
    const deltaTemp = endTemp - startTemp;
    const absoluteStart = startTemp + 273.15;
    if (absoluteStart > 0) {
      temperatureCompensation = tightnessTestPressure * (deltaTemp / absoluteStart);
      temperatureNarrative =
        deltaTemp === 0
          ? 'No ambient temperature change detected during the test window.'
          : `Temperature ${deltaTemp > 0 ? 'increase' : 'decrease'} of ${formatNumber(Math.abs(deltaTemp), 1)} °C would cause an apparent pressure ${
              deltaTemp > 0 ? 'rise' : 'fall'
            } of approximately ${formatNumber(Math.abs(temperatureCompensation), 2)} mbar.`;
    }
  }

  summary.innerHTML = `
    <p><strong>Algorithm used:</strong> ${algorithmLogic}</p>
    <p><strong>Recommended strength test pressure:</strong> ${formatNumber(strengthTestPressure, 1)} mbar.</p>
    <p><strong>Recommended tightness test pressure:</strong> ${formatNumber(tightnessTestPressure, 1)} mbar.</p>
    <p><strong>Minimum hold time:</strong> ${formatNumber(holdTimeMinutes, 1)} minutes based on system volume.</p>
    ${
      Number.isFinite(stabilisationMinutes)
        ? `<p><strong>Suggested stabilisation time:</strong> ${formatNumber(stabilisationMinutes, 1)} minutes, derived from fill rate.</p>`
        : ''
    }
    ${temperatureNarrative ? `<p><strong>Temperature effect:</strong> ${temperatureNarrative}</p>` : ''}
    <p><strong>Gas type context:</strong> ${gasType}.</p>
  `;

  const detailedRows = [
    ['Design pressure (mbar)', formatNumber(designPressure, 2)],
    ['Operating pressure (mbar)', Number.isFinite(operatingPressure) ? formatNumber(operatingPressure, 2) : 'Not provided'],
    ['Estimated system volume (m³)', formatNumber(systemVolume, 3)],
    ['Expected fill rate (m³/h)', Number.isFinite(fillRate) ? formatNumber(fillRate, 2) : 'Not provided'],
    ['Start temperature (°C)', Number.isFinite(startTemp) ? formatNumber(startTemp, 1) : 'Not provided'],
    ['End temperature (°C)', Number.isFinite(endTemp) ? formatNumber(endTemp, 1) : 'Not provided']
  ];

  const calculationSteps = `
    <ol>
      <li>Determine pressure category by comparing design pressure with ${pressureThreshold} mbar.</li>
      <li>Strength test pressure = max(1.5 × design pressure, ${lowPressure ? '150' : '1000'} mbar).</li>
      <li>Tightness test pressure limited to 90% of strength recommendation and at least ${
        lowPressure ? 'the design pressure or 20 mbar' : '10% above design pressure and ≥300 mbar'
      }.</li>
      <li>Hold time set from volume bands: ≤0.03 m³ → 5 min, 0.03–0.1 m³ → 10 min, additional 30 min per extra m³ beyond 0.1 m³.</li>
      <li>${
        Number.isFinite(stabilisationMinutes)
          ? 'Stabilisation time = ((volume ÷ fill rate) × 60) + 5 minutes, minimum 10 minutes.'
          : 'Provide a fill rate to calculate the stabilisation time.'
      }</li>
      <li>${
        Number.isFinite(temperatureCompensation)
          ? 'Temperature compensation uses ΔP = P × ΔT ÷ (T₁ + 273.15).'
          : 'Enter start and end temperatures to estimate apparent pressure change from temperature variation.'
      }</li>
    </ol>
  `;

  const resultList = `
    <ul>
      <li>Strength test pressure: ${formatNumber(strengthTestPressure, 1)} mbar.</li>
      <li>Tightness test pressure: ${formatNumber(tightnessTestPressure, 1)} mbar.</li>
      <li>Minimum hold time: ${formatNumber(holdTimeMinutes, 1)} minutes.</li>
      ${
        Number.isFinite(stabilisationMinutes)
          ? `<li>Suggested stabilisation time: ${formatNumber(stabilisationMinutes, 1)} minutes.</li>`
          : ''
      }
      ${
        Number.isFinite(temperatureCompensation)
          ? `<li>Temperature-induced apparent pressure change: ±${formatNumber(Math.abs(temperatureCompensation), 2)} mbar.</li>`
          : ''
      }
    </ul>
  `;

  details.innerHTML = `
    <h4>Initial data</h4>
    <table>
      <thead>
        <tr><th>Variable</th><th>Value</th></tr>
      </thead>
      <tbody>
        ${detailedRows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('')}
      </tbody>
    </table>
    <h4>Calculations</h4>
    ${calculationSteps}
    <h4>Results</h4>
    ${resultList}
  `;
}

const exportProcedure = () => {
  const payload = buildExportPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `igem-up1-procedure-v${APP_VERSION}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const handleImportData = (objectData) => {
  if (!objectData || typeof objectData !== 'object') {
    throw new Error('The provided JSON does not contain form data.');
  }
  const { __metadata: metadata, ...formData } = objectData;
  if (metadata && typeof metadata === 'object') {
    console.info('Imported procedure metadata', metadata);
  }
  applyInputData(formData);
  saveState();
  calculateTestPlan();
};

const importInput = document.getElementById('import-file');
if (importInput) {
  importInput.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target?.result || ''));
        handleImportData(parsed);
      } catch (error) {
        alert(`Unable to load procedure: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Import failed', error);
      } finally {
        importInput.value = '';
      }
    };
    reader.readAsText(file);
  });
}

inputs.forEach((input) => {
  if (!input) return;
  const primaryEvent = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
  input.addEventListener(primaryEvent, saveState);
  if (primaryEvent === 'change') {
    input.addEventListener('input', saveState);
  }
});

const calculateButton = document.getElementById('calculate-test-plan');
if (calculateButton) {
  calculateButton.addEventListener('click', () => {
    calculateTestPlan();
    saveState();
  });
}

const designPressureInput = document.getElementById('design-pressure');
const operatingPressureInput = document.getElementById('operating-pressure');
if (designPressureInput && operatingPressureInput) {
  const syncDesignPlaceholder = () => {
    if (!designPressureInput.value) {
      const op = parseFloat(operatingPressureInput.value);
      designPressureInput.placeholder = Number.isFinite(op)
        ? `Using operating pressure (${op.toFixed(1)} mbar)`
        : 'Automatically use operating pressure if blank';
    } else {
      designPressureInput.placeholder = 'Design pressure overrides operating pressure';
    }
  };
  operatingPressureInput.addEventListener('input', () => {
    syncDesignPlaceholder();
    saveState();
  });
  designPressureInput.addEventListener('input', syncDesignPlaceholder);
  syncDesignPlaceholder();
}

const popover = document.createElement('div');
popover.className = 'popover-bubble hidden';
popover.setAttribute('role', 'status');
popover.setAttribute('aria-live', 'polite');
popover.setAttribute('aria-hidden', 'true');
document.body.appendChild(popover);

let activePopoverTrigger = null;

const positionPopover = (target) => {
  if (!target) return;
  popover.classList.remove('hidden');
  popover.textContent = target.getAttribute('data-popover') || '';
  popover.setAttribute('aria-hidden', 'false');
  popover.style.top = '0px';
  popover.style.left = '0px';
  const popRect = popover.getBoundingClientRect();
  const { width, height } = popRect;
  const rect = target.getBoundingClientRect();
  const padding = 12;
  const left = Math.min(window.innerWidth - width - padding, Math.max(padding, rect.left + rect.width / 2 - width / 2));
  const top = Math.min(window.innerHeight - height - padding, Math.max(padding, rect.bottom + 10));
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
};

const hidePopover = () => {
  popover.classList.add('hidden');
  popover.textContent = '';
  popover.setAttribute('aria-hidden', 'true');
  activePopoverTrigger = null;
};

const showPopover = (target) => {
  if (!target) return;
  activePopoverTrigger = target;
  positionPopover(target);
};

document.querySelectorAll('.info-icon').forEach((icon) => {
  icon.addEventListener('mouseenter', () => showPopover(icon));
  icon.addEventListener('mouseleave', () => {
    if (document.activeElement !== icon) {
      hidePopover();
    }
  });
  icon.addEventListener('focus', () => showPopover(icon));
  icon.addEventListener('blur', hidePopover);
  icon.addEventListener('click', (event) => {
    event.preventDefault();
    if (activePopoverTrigger === icon && !popover.classList.contains('hidden')) {
      hidePopover();
    } else {
      showPopover(icon);
    }
  });
  icon.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hidePopover();
      icon.blur();
    }
  });
});

window.addEventListener('scroll', () => {
  if (activePopoverTrigger) {
    positionPopover(activePopoverTrigger);
  }
});

window.addEventListener('resize', () => {
  if (activePopoverTrigger) {
    positionPopover(activePopoverTrigger);
  }
});

document.addEventListener('procedure-data-updated', () => {
  if (designPressureInput && operatingPressureInput) {
    const event = new Event('input');
    operatingPressureInput.dispatchEvent(event);
    designPressureInput.dispatchEvent(event);
  }
});

const yearPlaceholder = document.getElementById('year');
if (yearPlaceholder) {
  yearPlaceholder.textContent = new Date().getFullYear();
}

const printButton = document.getElementById('print-procedure');
if (printButton) {
  printButton.addEventListener('click', () => window.print());
}

const exportButton = document.getElementById('export-procedure');
if (exportButton) {
  exportButton.addEventListener('click', exportProcedure);
}

const importButton = document.getElementById('import-procedure');
if (importButton && importInput) {
  importButton.addEventListener('click', () => importInput.click());
}

const queryMode = new URLSearchParams(window.location.search).get('mode');
if (queryMode === 'new') {
  localStorage.removeItem(STORAGE_KEY);
  applyInputData({});
  history.replaceState(null, '', window.location.pathname);
} else if (queryMode === 'load' && importInput) {
  history.replaceState(null, '', window.location.pathname);
  setTimeout(() => importInput.click(), 150);
}

setVersionInfo();
initialisePipeCalculator();
initialisePurgeHelpers();
loadState();
calculateTestPlan();
registerServiceWorker();
