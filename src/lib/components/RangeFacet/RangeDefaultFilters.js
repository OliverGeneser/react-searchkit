/*
 * SPDX-FileCopyrightText: 2026 CERN.
 * SPDX-License-Identifier: MIT
 */

import { useContext, useEffect, useState } from "react";
import { Checkbox, List } from "semantic-ui-react";
import PropTypes from "prop-types";
import Overridable from "react-overridable";
import { RANGE_MODES, resolveDefaultRange, findDefaultLabel } from "./utils";
import { AppContext } from "../ReactSearchKit";

function RangeDefaultFilters({
  activeMode = null,
  activeFilter = null,
  ranges,
  min,
  max,
  rangeSeparator,
  onSelect,
  onClear,
  overridableId = "",
}) {
  const [activeLabel, setActiveLabel] = useState(null);

  const syncActiveLabel = () => {
    if (activeMode !== RANGE_MODES.DEFAULT || !activeFilter) {
      setActiveLabel(null);
      return;
    }

    const defaultLabel = findDefaultLabel(
      ranges,
      activeFilter,
      min,
      max,
      rangeSeparator
    );
    setActiveLabel(defaultLabel ?? null);
  };

  useEffect(() => {
    syncActiveLabel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    syncActiveLabel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, activeFilter, ranges, min, max, rangeSeparator]);

  const handleToggle = (range, checked) => {
    if (checked) {
      setActiveLabel(null);
      onClear();
      return;
    }

    const resolved = resolveDefaultRange(range, min, max, rangeSeparator);
    if (resolved) {
      setActiveLabel(range.label);
      onSelect(resolved.yearRange, resolved.dateRangeString);
    }
  };

  if (ranges.length === 0) return null;

  return (
    <RangeDefaultFiltersElement
      ranges={ranges}
      activeLabel={activeLabel}
      onToggle={handleToggle}
      overridableId={overridableId}
    />
  );
}
RangeDefaultFilters.propTypes = {
  ranges: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["years", "months"]).isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  rangeSeparator: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  activeMode: PropTypes.oneOf([RANGE_MODES.DEFAULT, RANGE_MODES.CUSTOM, null]),
  activeFilter: PropTypes.string,
  overridableId: PropTypes.string,
};

const RangeDefaultFiltersElement = ({
  ranges,
  activeLabel = null,
  onToggle,
  overridableId = "",
}) => {
  const { buildUID } = useContext(AppContext);

  return (
    <Overridable
      id={buildUID("RangeFacet.DefaultFilters.element", overridableId)}
      ranges={ranges}
      activeLabel={activeLabel}
    >
      <>
        {ranges.map((range) => {
          const checked = activeLabel === range.label;

          return (
            <List.Item key={range.label}>
              <Checkbox
                radio
                label={range.label}
                checked={checked}
                onChange={() => onToggle(range, checked)}
              />
            </List.Item>
          );
        })}
      </>
    </Overridable>
  );
};

RangeDefaultFiltersElement.propTypes = {
  ranges: PropTypes.array.isRequired,
  activeLabel: PropTypes.string,
  onToggle: PropTypes.func.isRequired,
  overridableId: PropTypes.string,
};

export default Overridable.component("RangeFacet.DefaultFilters", RangeDefaultFilters);
