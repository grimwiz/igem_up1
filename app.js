(() => {
  'use strict';

  const STORAGE_KEY = 'igem-up1-procedure';
  const INPUT_SELECTOR =
    'input[type="text"], input[type="number"], input[type="date"], textarea, select, input[type="checkbox"]';

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

  const calculateTestPlan = () => {
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
    const gasType = gasTypeInput ? gasTypeInput.options[gasTypeInput.selectedIndex].text : 'Unknown';

    if (!Number.isFinite(designPressure) || !Number.isFinite(systemVolume)) {
      summary.innerHTML =
        '<p>Please provide the design or operating pressure and the estimated system volume to generate recommendations.</p>';
      details.innerHTML =
        '<p>Set the operating pressure in the Pipework Overview and enter an estimated system volume. Optional fields help refine the stabilisation and temperature allowances.</p>';
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
      ${Number.isFinite(stabilisationMinutes) ? `<p><strong>Suggested stabilisation time:</strong> ${formatNumber(stabilisationMinutes, 1)} minutes, derived from fill rate.</p>` : ''}
      ${temperatureNarrative ? `<p><strong>Temperature effect:</strong> ${temperatureNarrative}</p>` : ''}
      <p><strong>Gas type context:</strong> ${gasType}.</p>
    `;

    const detailedRows = [
      ['Design pressure (mbar)', formatNumber(designPressure, 2)],
      ['Operating pressure (mbar)', Number.isFinite(operatingPressure) ? formatNumber(operatingPressure, 2) : 'Not provided'],
      ['System volume (m³)', formatNumber(systemVolume, 3)],
      ['Expected fill rate (m³/h)', Number.isFinite(fillRate) ? formatNumber(fillRate, 2) : 'Not provided'],
      ['Start temperature (°C)', Number.isFinite(startTemp) ? formatNumber(startTemp, 1) : 'Not provided'],
      ['End temperature (°C)', Number.isFinite(endTemp) ? formatNumber(endTemp, 1) : 'Not provided'],
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
        ${Number.isFinite(stabilisationMinutes) ? `<li>Suggested stabilisation time: ${formatNumber(stabilisationMinutes, 1)} minutes.</li>` : ''}
        ${Number.isFinite(temperatureCompensation) ? `<li>Temperature-induced apparent pressure change: ±${formatNumber(Math.abs(temperatureCompensation), 2)} mbar.</li>` : ''}
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
  };

  const exportProcedure = () => {
    const blob = new Blob([JSON.stringify(serialiseFormData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'igem-up1-procedure.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (objectData) => {
    if (!objectData || typeof objectData !== 'object') {
      throw new Error('The provided JSON does not contain form data.');
    }
    applyInputData(objectData);
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
    const eventName = input.type === 'checkbox' ? 'change' : 'input';
    input.addEventListener(eventName, saveState);
    if (eventName === 'change') {
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

  loadState();
  calculateTestPlan();
  registerServiceWorker();
})();
