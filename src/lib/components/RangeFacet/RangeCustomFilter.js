/*
 * SPDX-FileCopyrightText: 2026 CERN.
 * SPDX-License-Identifier: MIT
 */

import { useContext, useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";
import { Checkbox, Button, Input, Label, List } from "semantic-ui-react";
import PropTypes from "prop-types";
import Overridable from "react-overridable";
import { RANGE_MODES, VALUE_TYPES } from "./utils";
import { AppContext } from "../ReactSearchKit";
import { i18next } from "@translations/i18next";

// Masked input formatters: strip non-digits and auto-insert separators.
// As the user types, digits are reformatted on each keystroke:
//   "2025" → "2025", "20250" → "2025-0", "202503" → "2025-03",
//   "20250315" → "2025-03-15" (max 8 digits for dates).
const FORMAT_FNS = {
  [VALUE_TYPES.DATE]: (input) => {
    const digits = input.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  },
  [VALUE_TYPES.INT]: (input) => {
    return input.replace(/\D/g, "");
  },
};

const DEFAULT_HELP_TEXTS = {
  [VALUE_TYPES.DATE]: i18next.t("e.g. 2025 or 2025-03-15"),
  [VALUE_TYPES.INT]: null,
};

function RangeCustomFilter({
  min,
  max,
  value,
  activeMode = null,
  activeFilter = null,
  rangeSeparator,
  valueType = VALUE_TYPES.DATE,
  onApply,
  onClear,
  onActivate,
  overridableId = "",
  dateRangeToLabel,
  helpText,
  fromAriaLabel,
  toAriaLabel,
  applyAriaLabel,
  customRangeAriaLabel,
}) {
  const [checked, setChecked] = useState(false);
  const [fromValue, setFromValue] = useState(String(value[0] ?? min));
  const [toValue, setToValue] = useState(String(value[1] ?? max));
  const [error, setErrorState] = useState(null);
  const { buildUID } = useContext(AppContext);

  const prevActiveModeRef = useRef(activeMode);
  const prevActiveFilterRef = useRef(activeFilter);
  const prevValueRef = useRef(value);
  const prevMinRef = useRef(min);
  const prevMaxRef = useRef(max);
  const prevCheckedRef = useRef(checked);

  const clearState = () => {
    setChecked(false);
    setErrorState(null);
  };

  const syncFromProps = () => {
    // If custom mode is active and has a filter, keep the filter values
    if (activeMode === RANGE_MODES.CUSTOM && activeFilter) return;

    setFromValue(String(value[0] ?? min));
    setToValue(String(value[1] ?? max));
  };

  const syncActiveFilter = () => {
    if (activeMode !== RANGE_MODES.CUSTOM || !activeFilter) return;

    const parts = activeFilter.split(rangeSeparator);
    if (parts.length < 2) return;

    setChecked(true);
    setFromValue(parts[0].trim());
    setToValue(parts[1].trim());
    setErrorState(null);
  };

  // componentDidMount equivalent
  useEffect(() => {
    syncFromProps();
    syncActiveFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate equivalent
  useEffect(() => {
    const prevActiveMode = prevActiveModeRef.current;
    const prevActiveFilter = prevActiveFilterRef.current;
    const prevValue = prevValueRef.current;
    const prevMin = prevMinRef.current;
    const prevMax = prevMaxRef.current;
    const prevChecked = prevCheckedRef.current;

    if (prevActiveMode !== activeMode) {
      if (activeMode !== RANGE_MODES.CUSTOM && checked) {
        setChecked(false);
        setErrorState(null);
      }
    }

    if (prevActiveMode !== activeMode || prevActiveFilter !== activeFilter) {
      if (activeMode === RANGE_MODES.CUSTOM && activeFilter) {
        const parts = activeFilter.split(rangeSeparator);
        if (parts.length >= 2) {
          setChecked(true);
          setFromValue(parts[0].trim());
          setToValue(parts[1].trim());
          setErrorState(null);
        }
      }
    }

    if (activeMode !== RANGE_MODES.CUSTOM && checked && prevValue !== value) {
      setChecked(false);
      setErrorState(null);
    }

    if (
      prevValue !== value ||
      prevMin !== min ||
      prevMax !== max ||
      prevChecked !== checked
    ) {
      if (!(activeMode === RANGE_MODES.CUSTOM && activeFilter)) {
        setFromValue(String(value[0] ?? min));
        setToValue(String(value[1] ?? max));
      }
    }

    prevActiveModeRef.current = activeMode;
    prevActiveFilterRef.current = activeFilter;
    prevValueRef.current = value;
    prevMinRef.current = min;
    prevMaxRef.current = max;
    prevCheckedRef.current = checked;
  }, [activeMode, activeFilter, value, min, max, checked, rangeSeparator]);

  const formatValue = (input) => {
    const fn = FORMAT_FNS[valueType] || FORMAT_FNS[VALUE_TYPES.DATE];
    return fn(input);
  };

  const handleChange = (field) => (e) => {
    const formatted = formatValue(e.target.value);
    if (field === "fromValue") {
      setFromValue(formatted);
    } else {
      setToValue(formatted);
    }
    setErrorState(null);
  };

  // Normalize a date value by zero-padding parts (e.g. "2025-3" → "2025-03")
  const normalizeValue = (val) => {
    if (!val) return val;
    if (valueType === VALUE_TYPES.INT) return val;
    const parts = val.split("-");
    return parts
      .map((p, i) => (i === 0 ? p.padStart(4, "0") : p.padStart(2, "0")))
      .join("-");
  };

  // Clicking into an input auto-activates the custom radio
  const activateOnFocus = () => {
    if (!checked) {
      toggleChecked();
    }
  };

  // Parse a normalized date string (YYYY, YYYY-MM, or YYYY-MM-DD) into a DateTime.
  // For partial dates, fills in start-of-period or end-of-period defaults.
  const parseDate = (val, isStart) => {
    const dt = DateTime.fromISO(val);
    if (!dt.isValid) return dt;
    if (val.length === 4) return isStart ? dt.startOf("year") : dt.endOf("year");
    if (val.length === 7) return isStart ? dt.startOf("month") : dt.endOf("month");
    return dt;
  };

  const parseValue = (val, isStart) => {
    if (valueType === VALUE_TYPES.INT) {
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    }
    const dt = parseDate(val, isStart);
    return dt?.isValid ? dt : null;
  };

  const setError = (err) => {
    setErrorState(err);
    return false;
  };

  const validate = (fromVal, toVal) => {
    const isDate = valueType !== VALUE_TYPES.INT;

    if (!fromVal && !toVal) {
      return setError(i18next.t("Enter at least one value"));
    }

    if (fromVal) {
      if (isDate && fromVal.length < 4) {
        return setError(i18next.t("Year must be 4 digits"));
      }
      const from = parseValue(fromVal, true);
      if (from === null) {
        return setError(
          isDate ? i18next.t("Invalid date") : i18next.t("Invalid number")
        );
      }
    }

    if (toVal) {
      if (isDate && toVal.length < 4) {
        return setError(i18next.t("Year must be 4 digits"));
      }
      const to = parseValue(toVal, false);
      if (to === null) {
        return setError(
          isDate ? i18next.t("Invalid date") : i18next.t("Invalid number")
        );
      }
    }

    if (fromVal && toVal) {
      const from = parseValue(fromVal, true);
      const to = parseValue(toVal, false);
      if (from > to) {
        return setError(i18next.t("Start must be before end"));
      }
    }

    return true;
  };

  const applyRange = () => {
    if (!checked) return;

    // Normalize to zero-padded ISO format (e.g. "2025-3" → "2025-03")
    const normalizedFrom = normalizeValue(fromValue);
    const normalizedTo = normalizeValue(toValue);

    // Skip if values haven't changed
    const rangeString = `${normalizedFrom}${rangeSeparator}${normalizedTo}`;
    if (rangeString === activeFilter) return;

    if (!validate(normalizedFrom, normalizedTo)) return;

    // Extract years for slider range; fall back to min/max for open-ended ranges
    const fromYear = normalizedFrom ? parseInt(normalizedFrom.slice(0, 4), 10) : min;
    const toYear = normalizedTo ? parseInt(normalizedTo.slice(0, 4), 10) : max;

    onApply([fromYear, toYear], rangeString);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      applyRange();
    }
  };

  const toggleChecked = () => {
    // Disable the custom filter and clear the active filter
    if (checked) {
      clearState();
      onClear();
      return;
    }
    // Enable the custom filter
    onActivate();
    setChecked(true);
  };

  const resolvedHelpText = helpText ?? DEFAULT_HELP_TEXTS[valueType];

  return (
    <Overridable
      id={buildUID("RangeFacet.CustomFilter.element", overridableId)}
      checked={checked}
      error={error}
      activeFilter={activeFilter}
    >
      <List.Item className="searchkit-daterange-custom-item">
        <Checkbox
          radio
          checked={checked}
          onChange={toggleChecked}
          aria-label={customRangeAriaLabel}
        />
        <div className="searchkit-daterange-custom-body">
          <div className="searchkit-daterange-custom-filter">
            <Input
              size="mini"
              value={fromValue}
              onChange={handleChange("fromValue")}
              onFocus={activateOnFocus}
              onKeyDown={handleKeyDown}
              inputMode="numeric"
              dir="ltr"
              error={!!error}
              className="searchkit-daterange-masked-input"
              aria-label={fromAriaLabel}
            />
            <span>{dateRangeToLabel}</span>
            <Input
              size="mini"
              value={toValue}
              onChange={handleChange("toValue")}
              onFocus={activateOnFocus}
              onKeyDown={handleKeyDown}
              inputMode="numeric"
              dir="ltr"
              error={!!error}
              className="searchkit-daterange-masked-input"
              aria-label={toAriaLabel}
            />
            <Button
              type="button"
              primary
              size="mini"
              icon="search"
              disabled={!checked}
              onClick={applyRange}
              aria-label={applyAriaLabel}
            />
          </div>
          {resolvedHelpText && <label className="helptext">{resolvedHelpText}</label>}
          {error && <Label basic color="red" size="tiny" content={error} />}
        </div>
      </List.Item>
    </Overridable>
  );
}

RangeCustomFilter.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  value: PropTypes.array.isRequired,
  activeMode: PropTypes.oneOf([RANGE_MODES.DEFAULT, RANGE_MODES.CUSTOM, null]),
  activeFilter: PropTypes.string,
  rangeSeparator: PropTypes.string.isRequired,
  onApply: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onActivate: PropTypes.func.isRequired,
  overridableId: PropTypes.string,
  dateRangeToLabel: PropTypes.string,
  valueType: PropTypes.oneOf([VALUE_TYPES.DATE, VALUE_TYPES.INT]),
  helpText: PropTypes.string,
  fromAriaLabel: PropTypes.string,
  toAriaLabel: PropTypes.string,
  applyAriaLabel: PropTypes.string,
  customRangeAriaLabel: PropTypes.string,
};

export default RangeCustomFilter;
