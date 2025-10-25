import {
  PIPE_SEGMENT_LIBRARY,
  PIPE_SIZES,
  PURGE_HOSE_SIZES,
  DIAPHRAGM_METERS,
  ROTARY_METERS,
  TABLE6,
  TABLE6_MAP,
  TABLE12_MAP,
  F1_MAP,
  F3_MAP,
  computeTotals,
  DEFAULT_PURGE_MULTIPLIER,
  GAS_SIZING_DATA_VERSION,
  pipeInstallVolume,
  pipePurgeVolume,
  STANDARD_REFERENCE_TABLES,
  GAS_TYPE_OPTIONS,
  DIAPHRAGM_PURGE_MULTIPLIER
} from './gasSizing.js';

const STORAGE_KEY = 'igem-up1-procedure';
const APP_VERSION = '1.4.0';
const INPUT_SELECTOR =
  'input[type="text"], input[type="number"], input[type="date"], input[type="hidden"], textarea, select, input[type="checkbox"]';

const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        if (registration && typeof registration.update === 'function') {
          registration.update();
        }
      })
      .catch((error) => console.error('Service worker registration failed:', error));
  });
};

const inputs = Array.from(document.querySelectorAll(INPUT_SELECTOR));

const shouldPersistInput = (input) => {
  if (!input || !input.id) return false;
  if (input.dataset.persist === 'never') return false;
  if (input.readOnly && input.dataset.persist !== 'always') return false;
  return true;
};

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
    if (!input || !input.id) return;
    if (input.dataset.persist === 'never') return;
    if (input.readOnly && input.dataset.persist !== 'always') return;
    if (input.type === 'checkbox') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });

  inputs.forEach((input) => {
    if (!input || !input.id) return;
    if (input.dataset.persist === 'never') return;
    if (input.readOnly && input.dataset.persist !== 'always') return;
    if (input.type === 'checkbox') {
      input.checked = Boolean(data[input.id]);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(data, input.id)) {
      input.value = data[input.id] ?? '';
    }
  });

  dispatchDataUpdated();
};

const serialiseFormData = () => {
  const data = {};
  inputs.forEach((input) => {
    if (!shouldPersistInput(input)) return;
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

const countDecimalPlaces = (value) => {
  if (!Number.isFinite(value)) return 0;
  const valueString = value.toString();
  if (!/e/i.test(valueString)) {
    const [, fractional] = valueString.split('.');
    return fractional ? fractional.length : 0;
  }
  const [mantissa, exponentPart] = valueString.split('e');
  const exponent = parseInt(exponentPart, 10);
  if (Number.isNaN(exponent)) {
    const [, fractional] = mantissa.split('.');
    return fractional ? fractional.length : 0;
  }
  const [, fractional] = mantissa.split('.');
  const mantissaDecimals = fractional ? fractional.length : 0;
  return Math.max(0, mantissaDecimals - exponent);
};

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

const formatMinutesValue = (value) => (Number.isFinite(value) ? formatNumber(value, 2) : '—');

const updateTtdCalculations = () => {
  const step11Source = document.getElementById('calculated-purge-volume');
  const step11Display = document.getElementById('ttd-step11');
  const roomVolumeInput = document.getElementById('ttd-room-volume');
  const outputs = {
    gasTypeA: document.getElementById('ttd-gas-type-a'),
    gasTypeCD: document.getElementById('ttd-gas-type-cd'),
    gasTypeAIn: document.getElementById('ttd-gas-type-a-in'),
    n2TypeA: document.getElementById('ttd-n2-type-a'),
    n2TypeCD: document.getElementById('ttd-n2-type-cd'),
    n2TypeAIn: document.getElementById('ttd-n2-type-a-in')
  };

  if (!step11Display || !roomVolumeInput) {
    return;
  }

  const step11Value = readNumber(step11Source);
  updateReadOnlyInput(step11Display, Number.isFinite(step11Value) ? formatNumber(step11Value, 4) : '—');

  const gaugeSelect = document.getElementById('gauge-choice');
  const gasTypeSelect = document.getElementById('gas-type-f1');

  const gaugeEntry = gaugeSelect ? TABLE6_MAP[gaugeSelect.value] : null;
  const grm = gaugeEntry && Number.isFinite(gaugeEntry.GRM) ? gaugeEntry.GRM : Number.NaN;

  const gasKey = gasTypeSelect ? gasTypeSelect.value.toLowerCase() : '';
  const gasFactors = gasKey ? F1_MAP[gasKey] : null;

  const gasFactorGas = gasFactors && Number.isFinite(gasFactors?.gas) ? gasFactors.gas : Number.NaN;
  const gasFactorN2 = gasFactors && Number.isFinite(gasFactors?.n2) ? gasFactors.n2 : Number.NaN;

  const baseGas = Number.isFinite(step11Value) && Number.isFinite(grm) && Number.isFinite(gasFactorGas)
    ? gasFactorGas * grm * step11Value
    : Number.NaN;
  const baseN2 = Number.isFinite(step11Value) && Number.isFinite(grm) && Number.isFinite(gasFactorN2)
    ? gasFactorN2 * grm * step11Value
    : Number.NaN;

  const existingCdGas = Number.isFinite(baseGas) ? baseGas * 0.047 : Number.NaN;
  const existingCdN2 = Number.isFinite(baseN2) ? baseN2 * 0.047 : Number.NaN;

  const roomVolume = readNumber(roomVolumeInput);
  const roomFactor = Number.isFinite(roomVolume) && roomVolume > 0 ? 1 / roomVolume : Number.NaN;

  const inTypeAGas = Number.isFinite(baseGas) && Number.isFinite(roomFactor) ? baseGas * 2.8 * roomFactor : Number.NaN;
  const inTypeAN2 = Number.isFinite(baseN2) && Number.isFinite(roomFactor) ? baseN2 * 2.8 * roomFactor : Number.NaN;

  const setOutput = (element, value) => {
    if (!element) return;
    updateReadOnlyInput(element, formatMinutesValue(value));
  };

  setOutput(outputs.gasTypeA, baseGas);
  setOutput(outputs.n2TypeA, baseN2);
  setOutput(outputs.gasTypeCD, existingCdGas);
  setOutput(outputs.n2TypeCD, existingCdN2);
  setOutput(outputs.gasTypeAIn, inTypeAGas);
  setOutput(outputs.n2TypeAIn, inTypeAN2);

  const breakdownBody = document.getElementById('ttd-breakdown-body');
  if (breakdownBody) {
    const rows = [
      {
        label: 'Step 12 – Base TTD factor (gas) = F₁(gas) × GRM × Step 11',
        gas: baseGas,
        n2: Number.NaN
      },
      {
        label: 'Step 13 – Base TTD factor (N₂) = F₁(N₂) × GRM × Step 11',
        gas: Number.NaN,
        n2: baseN2
      },
      {
        label: 'Step 14 – Existing Type C & D (gas) = Step 12 × 0.047',
        gas: existingCdGas,
        n2: Number.NaN
      },
      {
        label: 'Step 15 – Existing Type C & D (N₂) = Step 13 × 0.047',
        gas: Number.NaN,
        n2: existingCdN2
      },
      {
        label: 'Step 16 – Existing in Type A (gas) = Step 12 × 2.8 ÷ Room volume',
        gas: inTypeAGas,
        n2: Number.NaN
      },
      {
        label: 'Step 17 – Existing in Type A (N₂) = Step 13 × 2.8 ÷ Room volume',
        gas: Number.NaN,
        n2: inTypeAN2
      }
    ];

    breakdownBody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${row.label}</td>
            <td class="numeric">${formatMinutesValue(row.gas)}</td>
            <td class="numeric">${formatMinutesValue(row.n2)}</td>
          </tr>
        `
      )
      .join('');
  }
};

const formatReferenceValue = (value, key, decimalsOverride = null) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—';
    if (typeof decimalsOverride === 'number') {
      return formatNumber(value, decimalsOverride);
    }
    if (/volumePerMeter|Volume/.test(key)) {
      return formatVolume(value);
    }
    if (/range|TTD/i.test(key)) {
      return formatNumber(value, 0);
    }
    if (/F[13]_/.test(key)) {
      return formatNumber(value, 3);
    }
    if (Number.isInteger(value)) {
      return formatNumber(value, 0);
    }
    return formatNumber(value, Math.abs(value) < 10 ? 3 : 2);
  }
  if (key === 'category') {
    if (value === 'pipe') return 'Pipework';
    if (value === 'purge-hose') return 'Purge hose';
  }
  return String(value);
};

function renderReferenceTables() {
  const container = document.getElementById('igem-reference-table-container');
  if (!container) return;

  container.innerHTML = '';

  STANDARD_REFERENCE_TABLES.forEach((table) => {
    const details = document.createElement('details');
    details.id = table.id;

    const summary = document.createElement('summary');
    summary.textContent = table.title;
    details.appendChild(summary);

    if (table.summary) {
      const description = document.createElement('p');
      description.textContent = table.summary;
      description.className = 'reference-table-summary';
      details.appendChild(description);
    }

    const body = document.createElement('div');
    body.className = 'reference-table-body';
    details.appendChild(body);

    const renderTable = () => {
      if (body.dataset.rendered === 'true') return;

      const decimalsByColumn = table.columns.reduce((acc, column) => {
        const maxDecimals = table.rows.reduce((max, row) => {
          const rawValue = row[column.key];
          if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
            return Math.max(max, countDecimalPlaces(rawValue));
          }
          return max;
        }, 0);
        acc[column.key] = maxDecimals;
        return acc;
      }, {});

      const tableElement = document.createElement('table');
      tableElement.className = 'reference-data-table';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      table.columns.forEach((column) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = column.label;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      tableElement.appendChild(thead);

      const tbody = document.createElement('tbody');
      table.rows.forEach((row) => {
        const tr = document.createElement('tr');
        table.columns.forEach((column) => {
          const td = document.createElement('td');
          const rawValue = row[column.key];
          const decimals = decimalsByColumn[column.key];
          const displayValue = column.format
            ? column.format(rawValue, row)
            : formatReferenceValue(rawValue, column.key, decimals);
          td.textContent = displayValue;
          if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
            td.classList.add('numeric');
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tableElement.appendChild(tbody);

      body.appendChild(tableElement);
      body.dataset.rendered = 'true';
    };

    details.addEventListener('toggle', () => {
      if (details.open) {
        renderTable();
      }
    });

    container.appendChild(details);
  });
}

function initialisePipeCalculator() {
  const pipeRowsBody = document.getElementById('pipe-rows');
  const addPipeButton = document.getElementById('add-pipe-row');
  const diaphragmSelect = document.getElementById('diaphragm-meter-select');
  const rotarySelect = document.getElementById('rotary-meter-select');
  const purgeMultiplierInput = document.getElementById('purge-multiplier');
  const summary = document.getElementById('pipe-volume-summary');
  const installationBody = document.getElementById('installation-breakdown-body');
  const purgeBody = document.getElementById('purge-breakdown-body');
  const diaphragmInstallCell = document.getElementById('diaphragm-meter-install');
  const diaphragmPurgeCell = document.getElementById('diaphragm-meter-purge');
  const rotaryInstallCell = document.getElementById('rotary-meter-install');
  const rotaryPurgeCell = document.getElementById('rotary-meter-purge');
  const hiddenField = document.getElementById('pipe-configuration');
  const systemVolumeInput = document.getElementById('calculated-system-volume');
  const purgeVolumeInput = document.getElementById('calculated-purge-volume');
  const purgeHoseSelect = document.getElementById('purge-hose-size');
  const purgeHoseLengthInput = document.getElementById('purge-hose-length');
  const purgeHosePurgeInput = document.getElementById('purge-hose-purge-volume');

  if (
    !pipeRowsBody ||
    !addPipeButton ||
    !diaphragmSelect ||
    !rotarySelect ||
    !purgeMultiplierInput ||
    !summary ||
    !installationBody ||
    !purgeBody ||
    !diaphragmInstallCell ||
    !diaphragmPurgeCell ||
    !rotaryInstallCell ||
    !rotaryPurgeCell ||
    !hiddenField ||
    !systemVolumeInput ||
    !purgeHoseSelect ||
    !purgeHoseLengthInput ||
    !purgeHosePurgeInput
  ) {
    return;
  }

  const diaphragmAllowanceElements = {
    install: diaphragmInstallCell,
    purge: diaphragmPurgeCell
  };

  const rotaryAllowanceElements = {
    install: rotaryInstallCell,
    purge: rotaryPurgeCell
  };

  const resetMeterAllowanceTable = (elements) => {
    if (elements.install) {
      elements.install.textContent = '';
    }
    if (elements.purge) {
      elements.purge.textContent = '';
    }
  };

  const updateMeterAllowanceTable = (elements, selection, installVolume, purgeVolume) => {
    const selectedValue = (selection || '').toLowerCase();
    const hasSelection = Boolean(selection) && selectedValue !== 'no meter';
    if (!hasSelection) {
      resetMeterAllowanceTable(elements);
      return;
    }
    if (elements.install) {
      elements.install.textContent = formatVolume(installVolume);
    }
    if (elements.purge) {
      elements.purge.textContent = formatVolume(purgeVolume);
    }
  };
  const sortedSegments = PIPE_SIZES.slice().sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
  );
  const pipeOptions = sortedSegments.map((entry) => entry.id);
  const sortedPurgeHoses = PURGE_HOSE_SIZES.slice().sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
  );
  const purgeHoseOptions = sortedPurgeHoses.map((entry) => entry.id);
  purgeHoseSelect.innerHTML = sortedPurgeHoses
    .map((entry) => `<option value="${entry.id}">${entry.label}</option>`)
    .join('');
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
  const formatMeterLabel = (value) => {
    if (!value) return 'None';
    return value.toLowerCase() === 'no meter' ? 'None' : value.toUpperCase();
  };
  const diaphragmMeterOptions = sortMeterNames(DIAPHRAGM_METERS.map((entry) => entry.meter));
  const rotaryMeterOptions = sortMeterNames(ROTARY_METERS.map((entry) => entry.meter));
  const defaultDiaphragmValue =
    diaphragmMeterOptions.find((option) => option.toLowerCase() === 'no meter') ?? diaphragmMeterOptions[0] ?? '';
  const defaultRotaryValue =
    rotaryMeterOptions.find((option) => option.toLowerCase() === 'no meter') ?? rotaryMeterOptions[0] ?? '';
  const populateMeterSelect = (select, options, defaultValue) => {
    select.innerHTML = options.map((meter) => `<option value="${meter}">${formatMeterLabel(meter)}</option>`).join('');
    if (defaultValue && options.includes(defaultValue)) {
      select.value = defaultValue;
    } else if (options.length) {
      select.value = options[0];
    } else {
      select.value = '';
    }
  };

  populateMeterSelect(diaphragmSelect, diaphragmMeterOptions, defaultDiaphragmValue);
  populateMeterSelect(rotarySelect, rotaryMeterOptions, defaultRotaryValue);

  let ensureMeterDefaults = () => {};

  if (!purgeMultiplierInput.value) {
    purgeMultiplierInput.value = DEFAULT_PURGE_MULTIPLIER.toFixed(1);
  }

  let pipeSegments = [];
  const rowElements = [];
  let purgeHoseState = {
    dn: purgeHoseOptions[0] ?? null,
    length_m: ''
  };

  if (purgeHoseState.dn) {
    purgeHoseSelect.value = purgeHoseState.dn;
  }

  const ensureAtLeastOneSegment = () => {
    if (!pipeOptions.length) return;
    if (!pipeSegments.length) {
      pipeSegments.push({ dn: pipeOptions[0], length_m: '' });
    }
  };

  const persistSegments = (triggerSave = true) => {
    if (!hiddenField) return;
    const serialisable = {
      pipes: pipeSegments.map((segment) => ({
        dn: segment.dn,
        length_m: segment.length_m ?? ''
      })),
      purgeHose:
        purgeHoseState && purgeHoseState.dn
          ? { dn: purgeHoseState.dn, length_m: purgeHoseState.length_m ?? '' }
          : null
    };
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

  const getPurgeHoseForTotals = () => {
    if (!purgeHoseState || !purgeHoseState.dn) return null;
    return { dn: purgeHoseState.dn, length_m: normaliseLength(purgeHoseState.length_m) };
  };

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

  const updatePurgeHoseRow = (multiplierOverride) => {
    const multiplier = typeof multiplierOverride === 'number' ? multiplierOverride : getPurgeMultiplier();
    const lengthValue = normaliseLength(purgeHoseState?.length_m);
    let purgeVolume = 0;
    if (purgeHoseState?.dn) {
      try {
        purgeVolume = pipePurgeVolume(purgeHoseState.dn, lengthValue, multiplier);
      } catch (error) {
        console.error('Purge hose calculation failed', error);
        purgeVolume = Number.NaN;
      }
    }
    purgeHosePurgeInput.value = formatVolume(purgeVolume);
  };

  const updateAllRowVolumes = (multiplierOverride) => {
    rowElements.forEach((row) => row.updateVolumes(multiplierOverride));
    updatePurgeHoseRow(multiplierOverride);
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
      sortedSegments.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option.id;
        opt.textContent = option.label;
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
        installInput.value = formatVolume(installVolume);
        purgeInput.value = formatVolume(purgeVolume);
      };

      row.appendChild(dnCell);
      row.appendChild(lengthCell);
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
    purgeMultiplierInput.setAttribute(
      'aria-invalid',
      !multiplierValid && purgeMultiplierInput.value !== '' ? 'true' : 'false'
    );

    try {
      const pipesForTotals = getSegmentsForTotals();
      const purgeHoseTotals = getPurgeHoseForTotals();
      const totals = computeTotals({
        pipes: pipesForTotals,
        purgeHose: purgeHoseTotals,
        diaphragmMeter: diaphragmKey,
        rotaryMeter: rotaryKey,
        purgeMultiplier: multiplier
      });
      const breakdown = totals.breakdown;
      const pipeInstallTotal = breakdown.pipeInstall_m3;
      const meterInstallTotal = breakdown.meterInstallTotal_m3;
      const fittingsAllowance = totals.fittingsAllowance_m3;
      const systemBaseVolume = totals.systemComponentsVolume_m3 ?? pipeInstallTotal + meterInstallTotal;
      const estimatedSystemVolume = totals.estimatedSystemVolume_m3;
      const pipePurgeTotal = breakdown.pipePurge_m3;
      const purgeHosePurge = breakdown.purgeHosePurge_m3;
      const meterPurgeTotal =
        breakdown.meterPurge_m3 ?? breakdown.diaphragmPurge_m3 + breakdown.rotaryPurge_m3;
      const purgeBeforeFittings = breakdown.purgeBeforeFittings_m3;
      const purgeFittingsAllowance =
        breakdown.purgeFittingsAllowance_m3 ?? totals.purgeVolume_m3 - purgeBeforeFittings;

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
        ? `Pipe and purge hose purge calculations use a factor of ${formatNumber(multiplier, 2)} applied to the Table 4 lengths.`
        : `Default ${formatNumber(DEFAULT_PURGE_MULTIPLIER, 2)} purge factor applied to pipe and purge hose lengths because the override is empty or invalid.`;
      const meterNarrativeParts = [];
      if (hasDiaphragm) {
        meterNarrativeParts.push(
          `Diaphragm meter ${formatMeterLabel(diaphragmSelection || 'No Meter')} adds ${formatVolume(
            breakdown.diaphragmInstall_m3
          )} m³ installation allowance and ${formatVolume(breakdown.diaphragmPurge_m3)} m³ purge allowance from Table 3.`
        );
      } else {
        meterNarrativeParts.push('No diaphragm meter selected, so no diaphragm allowance is included.');
      }
      if (hasRotary) {
        meterNarrativeParts.push(
          `Rotary meter ${formatMeterLabel(rotarySelection || 'No Meter')} adds ${formatVolume(
            breakdown.rotaryInstall_m3
          )} m³ installation allowance and ${formatVolume(breakdown.rotaryPurge_m3)} m³ purge allowance from Table 3.`
        );
      } else {
        meterNarrativeParts.push('No rotary meter selected, so no rotary allowance is included.');
      }
      const meterNarrative = meterNarrativeParts.join(' ');

      updateMeterAllowanceTable(
        diaphragmAllowanceElements,
        diaphragmSelection,
        breakdown.diaphragmInstall_m3,
        breakdown.diaphragmPurge_m3
      );
      updateMeterAllowanceTable(
        rotaryAllowanceElements,
        rotarySelection,
        breakdown.rotaryInstall_m3,
        breakdown.rotaryPurge_m3
      );

      summary.innerHTML = `
        <p><strong>Total systems volume (incl. fittings):</strong> ${formatVolume(estimatedSystemVolume)} m³.</p>
        <p><strong>Total purge volume:</strong> ${formatVolume(totals.purgeVolume_m3)} m³.</p>
        <p>${multiplierSentence} Meter purge allowances use the Table 3 values (diaphragm figures multiplied by ${formatNumber(
          DIAPHRAGM_PURGE_MULTIPLIER,
          0
        )}). Purge hoses do not contribute to installation volume.</p>
        <p>${meterNarrative} See the breakdown for the step-by-step calculations.</p>
      `;

      const installationRows = [
        ['Step 1 – Pipe installation (Table 4)', formatVolume(pipeInstallTotal)],
        ['Step 2 – Meter installation (Table 3)', formatVolume(meterInstallTotal)],
        ['Step 3 – Base system volume = Step 1 + Step 2', formatVolume(systemBaseVolume)],
        ['Step 4 – Fittings allowance (10% of Step 1)', formatVolume(fittingsAllowance)],
        ['Step 5 – Total systems volume = Step 3 + Step 4', formatVolume(estimatedSystemVolume)]
      ];
      installationBody.innerHTML = installationRows
        .map((row) => `<tr><td>${row[0]}</td><td class="numeric">${row[1]}</td></tr>`)
        .join('');

      const defaultMultiplierLabel = formatNumber(DEFAULT_PURGE_MULTIPLIER, 2);
      const step6Label =
        multiplier === DEFAULT_PURGE_MULTIPLIER
          ? `Step 6 – Pipe purge contribution (Step 1 × ${defaultMultiplierLabel})`
          : `Step 6 – Pipe purge contribution (Step 1 × ${defaultMultiplierLabel}; override ${formatNumber(
              multiplier,
              2
            )})`;

      const purgeRows = [
        [step6Label, formatVolume(pipePurgeTotal)],
        [
          `Step 7 – Purge hose purge contribution (length × volume/m × ${formatNumber(multiplier, 2)})`,
          formatVolume(purgeHosePurge)
        ],
        [
          `Step 8 – Meter purge contribution (Table 3 × ${formatNumber(
            DIAPHRAGM_PURGE_MULTIPLIER,
            0
          )} for diaphragm meters)`,
          formatVolume(meterPurgeTotal)
        ],
        ['Step 9 – Total purge before fittings = Step 6 + Step 7 + Step 8', formatVolume(purgeBeforeFittings)],
        [`Step 10 – Fittings allowance (10% of Step 6 × 1.50)`, formatVolume(purgeFittingsAllowance)],
        ['Step 11 – Total purge volume = Step 9 + Step 10', formatVolume(totals.purgeVolume_m3)]
      ];
      purgeBody.innerHTML = purgeRows
        .map((row) => `<tr><td>${row[0]}</td><td class="numeric">${row[1]}</td></tr>`)
        .join('');

      updateTtdCalculations();

    } catch (error) {
      summary.innerHTML = `<p>Unable to calculate volumes: ${error instanceof Error ? error.message : 'Unknown error'}.</p>`;
      installationBody.innerHTML = '';
      purgeBody.innerHTML = '';
      resetMeterAllowanceTable(diaphragmAllowanceElements);
      resetMeterAllowanceTable(rotaryAllowanceElements);
      updateTtdCalculations();
      console.error('Volume calculation failed', error);
    }
  };

  ensureMeterDefaults = () => {
    let changed = false;
    if (!diaphragmSelect.value && defaultDiaphragmValue) {
      diaphragmSelect.value = defaultDiaphragmValue;
      changed = true;
    }
    if (!rotarySelect.value && defaultRotaryValue) {
      rotarySelect.value = defaultRotaryValue;
      changed = true;
    }
    if (changed) {
      updateSummary();
    }
  };

  const restoreFromHidden = () => {
    if (!hiddenField) return;
    if (!hiddenField.value) {
      pipeSegments = [];
      ensureAtLeastOneSegment();
      purgeHoseState = {
        dn: purgeHoseOptions[0] ?? null,
        length_m: ''
      };
      if (purgeHoseState.dn) {
        purgeHoseSelect.value = purgeHoseState.dn;
      }
      purgeHoseLengthInput.value = purgeHoseState.length_m ?? '';
      renderRows();
      persistSegments(false);
      updateSummary();
      return;
    }
    try {
      const parsed = JSON.parse(hiddenField.value);
      const fallbackDn = pipeOptions[0] ?? null;
      const normaliseSegments = (list) =>
        list
          .map((entry) => ({
            dn: pipeOptions.includes(entry.dn) ? entry.dn : fallbackDn,
            length_m:
              entry.length_m === null || entry.length_m === undefined
                ? ''
                : String(entry.length_m)
          }))
          .filter((segment) => segment.dn);

      if (Array.isArray(parsed)) {
        pipeSegments = normaliseSegments(parsed);
        purgeHoseState = {
          dn: purgeHoseOptions[0] ?? null,
          length_m: ''
        };
      } else if (parsed && typeof parsed === 'object') {
        const pipesList = Array.isArray(parsed.pipes) ? parsed.pipes : [];
        pipeSegments = normaliseSegments(pipesList);
        const storedHose = parsed.purgeHose;
        if (storedHose && purgeHoseOptions.includes(storedHose.dn)) {
          purgeHoseState = {
            dn: storedHose.dn,
            length_m:
              storedHose.length_m === null || storedHose.length_m === undefined
                ? ''
                : String(storedHose.length_m)
          };
        } else {
          purgeHoseState = {
            dn: purgeHoseOptions[0] ?? null,
            length_m: ''
          };
        }
      } else {
        pipeSegments = [];
        purgeHoseState = {
          dn: purgeHoseOptions[0] ?? null,
          length_m: ''
        };
      }
    } catch (error) {
      console.error('Could not parse stored pipe configuration', error);
      pipeSegments = [];
      purgeHoseState = {
        dn: purgeHoseOptions[0] ?? null,
        length_m: ''
      };
    }
    ensureAtLeastOneSegment();
    if (purgeHoseState.dn) {
      purgeHoseSelect.value = purgeHoseState.dn;
    }
    purgeHoseLengthInput.value = purgeHoseState.length_m ?? '';
    renderRows();
    persistSegments(false);
    updateSummary();
  };

  addPipeButton.addEventListener('click', () => {
    if (!pipeOptions.length) return;
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

  purgeMultiplierInput.addEventListener('input', () => {
    updateSummary();
  });

  purgeHoseSelect.addEventListener('change', () => {
    purgeHoseState.dn = purgeHoseSelect.value;
    updateAllRowVolumes();
    persistSegments();
    updateSummary();
  });

  purgeHoseLengthInput.addEventListener('input', () => {
    purgeHoseState.length_m = purgeHoseLengthInput.value === '' ? '' : purgeHoseLengthInput.value;
    updateAllRowVolumes();
    persistSegments();
    updateSummary();
  });

  document.addEventListener('procedure-data-updated', restoreFromHidden);
  document.addEventListener('procedure-data-updated', ensureMeterDefaults);
  restoreFromHidden();
  ensureMeterDefaults();
}

function initialisePurgeHelpers() {
  const purgePipeSelect = document.getElementById('purge-pipe-diameter');
  const purgeFlowInput = document.getElementById('purge-max-flow-rate');
  const purgeTimeInput = document.getElementById('purge-time-minutes');
  const purgeVolumeInput = document.getElementById('calculated-purge-volume');
  const gasTypeSelectF1 = document.getElementById('gas-type-f1');
  const gasTypeSelectF3 = document.getElementById('gas-type-f3');
  const f1GasInput = document.getElementById('gas-factor-f1-gas');
  const f1N2Input = document.getElementById('gas-factor-f1-n2');
  const f3GasInput = document.getElementById('operating-factor-f3-gas');
  const f3N2Input = document.getElementById('operating-factor-f3-n2');
  const gaugeSelect = document.getElementById('gauge-choice');
  const gaugeRangeInput = document.getElementById('gauge-range');
  const gaugeGrmInput = document.getElementById('gauge-grm');
  const gaugeTtdInput = document.getElementById('gauge-ttd-max');
  const roomVolumeInput = document.getElementById('ttd-room-volume');

  const ensureGasSelectOptions = (select) => {
    if (!select) return;
    if (!select.options.length) {
      select.innerHTML = GAS_TYPE_OPTIONS.map(
        (option) => `<option value="${option.value}">${option.label}</option>`
      ).join('');
    }
    const normaliseGasSelection = () => {
      if (!select) return;
      const currentValue = select.value;
      if (!currentValue) {
        if (GAS_TYPE_OPTIONS.length) {
          select.value = GAS_TYPE_OPTIONS[0].value;
        }
        return;
      }
      const exactMatch = GAS_TYPE_OPTIONS.find((option) => option.value === currentValue);
      if (exactMatch) return;
      const normalisedMatch = GAS_TYPE_OPTIONS.find(
        (option) => option.value.toLowerCase() === currentValue.toLowerCase()
      );
      if (normalisedMatch) {
        select.value = normalisedMatch.value;
        return;
      }
      const labelMatch = GAS_TYPE_OPTIONS.find(
        (option) => option.label.toLowerCase() === currentValue.toLowerCase()
      );
      if (labelMatch) {
        select.value = labelMatch.value;
        return;
      }
      if (GAS_TYPE_OPTIONS.length) {
        select.value = GAS_TYPE_OPTIONS[0].value;
      }
    };

    normaliseGasSelection();
    document.addEventListener('procedure-data-updated', normaliseGasSelection);
  };

  ensureGasSelectOptions(gasTypeSelectF1);
  ensureGasSelectOptions(gasTypeSelectF3);

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

  const normaliseGasTypeKey = (value) => String(value || '').toLowerCase();

  const updateGasFactors = () => {
    const gasKeyF1 = normaliseGasTypeKey(gasTypeSelectF1 ? gasTypeSelectF1.value : null);
    const gasKeyF3 = normaliseGasTypeKey(gasTypeSelectF3 ? gasTypeSelectF3.value : null);
    const f1Entry = gasKeyF1 ? F1_MAP[gasKeyF1] : null;
    const f3Entry = gasKeyF3 ? F3_MAP[gasKeyF3] : null;

    if (f1GasInput) {
      updateReadOnlyInput(
        f1GasInput,
        f1Entry && Number.isFinite(f1Entry.gas) ? formatNumber(f1Entry.gas, 1) : '—'
      );
    }
    if (f1N2Input) {
      updateReadOnlyInput(
        f1N2Input,
        f1Entry && Number.isFinite(f1Entry.n2) ? formatNumber(f1Entry.n2, 1) : '—'
      );
    }
    if (f3GasInput) {
      updateReadOnlyInput(
        f3GasInput,
        f3Entry && Number.isFinite(f3Entry.gas) ? formatNumber(f3Entry.gas, 3) : '—'
      );
    }
    if (f3N2Input) {
      updateReadOnlyInput(
        f3N2Input,
        f3Entry && Number.isFinite(f3Entry.n2) ? formatNumber(f3Entry.n2, 3) : '—'
      );
    }

    updateTtdCalculations();
  };

  if (gasTypeSelectF1) {
    gasTypeSelectF1.addEventListener('change', updateGasFactors);
    gasTypeSelectF1.addEventListener('input', updateGasFactors);
  }
  if (gasTypeSelectF3) {
    gasTypeSelectF3.addEventListener('change', updateGasFactors);
    gasTypeSelectF3.addEventListener('input', updateGasFactors);
  }
  document.addEventListener('procedure-data-updated', updateGasFactors);
  updateGasFactors();

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
        updateTtdCalculations();
        return;
      }
      updateReadOnlyInput(gaugeRangeInput, entry.range ?? '');
      updateReadOnlyInput(gaugeGrmInput, Number.isFinite(entry.GRM) ? formatNumber(entry.GRM, 1) : '—');
      updateReadOnlyInput(gaugeTtdInput, Number.isFinite(entry.TTD_Max) ? formatNumber(entry.TTD_Max, 0) : '—');
      updateTtdCalculations();
    };

    gaugeSelect.addEventListener('change', updateGaugeOutputs);
    document.addEventListener('procedure-data-updated', updateGaugeOutputs);
    updateGaugeOutputs();
  }

  if (roomVolumeInput) {
    roomVolumeInput.addEventListener('input', updateTtdCalculations);
  }

  document.addEventListener('procedure-data-updated', updateTtdCalculations);
  updateTtdCalculations();
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
  const gasTypeInput = document.getElementById('gas-type-f1');

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
    ['Total systems volume (m³)', formatNumber(systemVolume, 3)],
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
  if (!input || !shouldPersistInput(input)) return;
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
renderReferenceTables();
initialisePipeCalculator();
initialisePurgeHelpers();
loadState();
calculateTestPlan();
registerServiceWorker();
