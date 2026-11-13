/*
 * SPDX-FileCopyrightText: 2026 CERN.
 * SPDX-License-Identifier: MIT
 */

import "./RangeFacet.scss";

import _debounce from "lodash/debounce";
import PropTypes from "prop-types";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Overridable from "react-overridable";
import { Card, List } from "semantic-ui-react";
import { withState } from "../HOC";
import { AppContext } from "../ReactSearchKit";
import RangeDefaultFilters from "./RangeDefaultFilters";
import RangeCustomFilter from "./RangeCustomFilter";
import RangeHistogram from "./RangeHistogram";
import RangeSlider from "./RangeSlider";
import {
  RANGE_MODES,
  extractBuckets,
  findDefaultLabel,
  getHistogramData,
  parseFilterYears,
  getKey,
  normalizeFilterValue,
} from "./utils";
import { i18next } from "@translations/i18next";

const DEFAULT_RANGES = [];

function RangeFacet({
  agg,
  rangeSeparator,
  updateQueryState,
  currentQueryState,
  defaultRanges = DEFAULT_RANGES,
  enableCustomRange = false,
  currentResultsState,
  title,
  overridableId = "",
  histogramHeight = 100,
  dateRangeToLabel = i18next.t("to"),
  fromAriaLabel,
  toAriaLabel,
  applyAriaLabel,
  customRangeAriaLabel,
}) {
  const getBuckets = () => {
    const resultsAggregations = currentResultsState?.data?.aggregations;
    return extractBuckets(resultsAggregations, agg.aggName);
  };

  const getMinMax = () => {
    const buckets = getBuckets();
    const years = buckets
      .map((b) => Number(getKey(b)))
      .filter((v) => Number.isInteger(v));
    const min = years.length > 0 ? Math.min(...years) : 0;
    const max = years.length > 0 ? Math.max(...years) : 0;
    return { min, max };
  };

  const initialMinMax = getMinMax();
  const [range, setRange] = useState([initialMinMax.min, initialMinMax.max]);
  const [activeMode, setActiveMode] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  const currentQueryStateRef = useRef(currentQueryState);
  currentQueryStateRef.current = currentQueryState;

  const debouncedUpdateQuery = useMemo(
    () =>
      _debounce((newRange, dateRangeString) => {
        const latestQueryState = currentQueryStateRef.current;
        const [from, to] = [...newRange].sort();
        const filters = (latestQueryState.filters || []).filter(
          (f) => Array.isArray(f) && f[0] !== agg.aggName
        );

        // Use dateRangeString if provided (from custom filter), otherwise use year-only format
        const filterValue = dateRangeString || `${from}${rangeSeparator}${to}`;

        updateQueryState({
          ...latestQueryState,
          filters: [...filters, [agg.aggName, filterValue]],
        });
      }, 500),
    [agg.aggName, rangeSeparator, updateQueryState]
  );

  useEffect(() => {
    return () => {
      if (debouncedUpdateQuery?.cancel) {
        debouncedUpdateQuery.cancel();
      }
    };
  }, [debouncedUpdateQuery]);

  const syncStateWithFilters = () => {
    const { min, max } = getMinMax();

    const filter = (currentQueryState.filters || []).find(
      (f) => Array.isArray(f) && f[0] === agg.aggName
    );

    if (!filter) {
      setRange((prev) => (prev[0] === min && prev[1] === max ? prev : [min, max]));
      setActiveMode((prev) => (prev === null ? prev : null));
      setActiveFilter((prev) => (prev === null ? prev : null));
      return;
    }

    // Parse filter value - can be "YYYY to YYYY" or "YYYY-MM-DD to YYYY-MM-DD"
    const filterValue = filter[1];
    const normalizedFilterValue = normalizeFilterValue(
      filterValue,
      rangeSeparator,
      min,
      max
    );
    const parsedFilter = parseFilterYears(normalizedFilterValue, rangeSeparator);
    if (!parsedFilter) {
      setRange((prev) => (prev[0] === min && prev[1] === max ? prev : [min, max]));
      setActiveMode((prev) => (prev === null ? prev : null));
      setActiveFilter((prev) => (prev === null ? prev : null));
      return;
    }
    const clampedFrom = Math.max(parsedFilter.fromYear, min);
    const clampedTo = Math.min(parsedFilter.toYear, max);
    // If filter is outside histogram bounds, show full range (no selection)
    const from = clampedFrom <= clampedTo ? clampedFrom : min;
    const to = clampedFrom <= clampedTo ? clampedTo : max;

    const defaultLabel = findDefaultLabel(
      defaultRanges,
      normalizedFilterValue,
      min,
      max,
      rangeSeparator
    );
    const newActiveMode = defaultLabel ? RANGE_MODES.DEFAULT : RANGE_MODES.CUSTOM;
    setRange((prev) => (prev[0] === from && prev[1] === to ? prev : [from, to]));
    setActiveMode((prev) => (prev === newActiveMode ? prev : newActiveMode));
    setActiveFilter((prev) =>
      prev === normalizedFilterValue ? prev : normalizedFilterValue
    );
  };

  // componentDidMount equivalent
  useEffect(() => {
    syncStateWithFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate equivalent
  const prevFiltersRef = useRef(currentQueryState.filters);
  const prevAggNameRef = useRef(agg.aggName);
  const prevDefaultRangesRef = useRef(defaultRanges);
  const prevEnableCustomRangeRef = useRef(enableCustomRange);
  const prevRangeSeparatorRef = useRef(rangeSeparator);
  const prevResultsStateRef = useRef(currentResultsState);

  useEffect(() => {
    if (
      prevFiltersRef.current !== currentQueryState.filters ||
      prevAggNameRef.current !== agg.aggName ||
      prevDefaultRangesRef.current !== defaultRanges ||
      prevEnableCustomRangeRef.current !== enableCustomRange ||
      prevRangeSeparatorRef.current !== rangeSeparator ||
      prevResultsStateRef.current !== currentResultsState
    ) {
      syncStateWithFilters();
    }
    prevFiltersRef.current = currentQueryState.filters;
    prevAggNameRef.current = agg.aggName;
    prevDefaultRangesRef.current = defaultRanges;
    prevEnableCustomRangeRef.current = enableCustomRange;
    prevRangeSeparatorRef.current = rangeSeparator;
    prevResultsStateRef.current = currentResultsState;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentQueryState,
    agg,
    defaultRanges,
    enableCustomRange,
    rangeSeparator,
    currentResultsState,
  ]);

  const onRangeChange = (newRange, dateRangeString = null) => {
    const sorted = [...newRange].sort((a, b) => a - b);
    setRange(sorted);
    debouncedUpdateQuery(sorted, dateRangeString);
  };

  const onBarClick = (year) => {
    setActiveMode(null);
    onRangeChange([year, year]);
  };

  const clearRangeFilter = () => {
    const { min, max } = getMinMax();

    setRange([min, max]);
    setActiveFilter(null);

    const filters = (currentQueryState.filters || []).filter(
      (f) => Array.isArray(f) && f[0] !== agg.aggName
    );

    updateQueryState({
      ...currentQueryState,
      filters,
    });
  };

  const handleApply = (newActiveMode, newRange, dateRangeString) => {
    const [from, to] = [...newRange].sort((a, b) => a - b);
    const newActiveFilter = dateRangeString || `${from}${rangeSeparator}${to}`;
    setActiveMode(newActiveMode);
    setActiveFilter(newActiveFilter);
    onRangeChange(newRange, dateRangeString);
  };

  const onClear = () => {
    setActiveMode(null);
    setActiveFilter(null);
    clearRangeFilter();
  };

  const onCustomActivate = () => {
    setActiveMode(RANGE_MODES.CUSTOM);
    setActiveFilter(null);
  };

  const { min, max } = getMinMax();
  const buckets = getBuckets();
  const data = getHistogramData(buckets, min, max);
  const hasActiveFilter = (currentQueryState?.filters || []).some(
    (f) => Array.isArray(f) && f[0] === agg.aggName
  );

  const hasResults = data.some((d) => d.count > 0);
  if (!data.length || !hasResults) return null;
  const containerCmp = (
    <>
      <RangeHistogram
        data={data}
        range={range}
        height={histogramHeight}
        onBarClick={onBarClick}
        overridableId={overridableId}
      />
      <RangeSlider
        min={min}
        max={max}
        value={range}
        onChange={(r) => handleApply(null, r, null)}
        overridableId={overridableId}
      />
      {(defaultRanges || enableCustomRange) && (
        <List>
          {defaultRanges && (
            <RangeDefaultFilters
              ranges={defaultRanges}
              min={min}
              max={max}
              rangeSeparator={rangeSeparator}
              activeFilter={activeFilter}
              activeMode={activeMode}
              onSelect={(r, s) => handleApply(RANGE_MODES.DEFAULT, r, s)}
              onClear={onClear}
              overridableId={overridableId}
            />
          )}
          {enableCustomRange && (
            <RangeCustomFilter
              min={min}
              max={max}
              value={range}
              rangeSeparator={rangeSeparator}
              activeMode={activeMode}
              activeFilter={activeFilter}
              onApply={(r, s) => handleApply(RANGE_MODES.CUSTOM, r, s)}
              onClear={onClear}
              onActivate={onCustomActivate}
              overridableId={overridableId}
              dateRangeToLabel={dateRangeToLabel}
              fromAriaLabel={fromAriaLabel}
              toAriaLabel={toAriaLabel}
              applyAriaLabel={applyAriaLabel}
              customRangeAriaLabel={customRangeAriaLabel}
            />
          )}
        </List>
      )}
    </>
  );
  return (
    <RangeFacetElement
      title={title}
      containerCmp={containerCmp}
      hasActiveFilter={hasActiveFilter}
      onClear={onClear}
      overridableId={overridableId}
    />
  );
}

RangeFacet.propTypes = {
  title: PropTypes.string.isRequired,
  agg: PropTypes.shape({
    aggName: PropTypes.string.isRequired,
  }).isRequired,
  defaultRanges: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["years", "months"]).isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
  enableCustomRange: PropTypes.bool,
  rangeSeparator: PropTypes.string.isRequired,
  currentQueryState: PropTypes.shape({
    filters: PropTypes.array,
  }).isRequired,
  currentResultsState: PropTypes.shape({
    data: PropTypes.shape({
      aggregations: PropTypes.object,
    }),
  }).isRequired,
  overridableId: PropTypes.string,
  histogramHeight: PropTypes.number,
  updateQueryState: PropTypes.func.isRequired,
  dateRangeToLabel: PropTypes.string,
  fromAriaLabel: PropTypes.string,
  toAriaLabel: PropTypes.string,
  applyAriaLabel: PropTypes.string,
  customRangeAriaLabel: PropTypes.string,
};

export default Overridable.component("RangeFacet", withState(RangeFacet));

const RangeFacetElement = ({
  title,
  containerCmp = null,
  hasActiveFilter,
  onClear,
  overridableId = "",
}) => {
  const { buildUID } = useContext(AppContext);

  return (
    containerCmp && (
      <Overridable
        id={buildUID("RangeFacet.element", overridableId)}
        title={title}
        hasActiveFilter={hasActiveFilter}
        onClear={onClear}
        containerCmp={containerCmp}
      >
        <Card>
          <Card.Content>
            <Card.Header>{title}</Card.Header>
          </Card.Content>
          <Card.Content>{containerCmp}</Card.Content>
        </Card>
      </Overridable>
    )
  );
};

RangeFacetElement.propTypes = {
  title: PropTypes.string.isRequired,
  containerCmp: PropTypes.node,
  hasActiveFilter: PropTypes.bool.isRequired,
  onClear: PropTypes.func.isRequired,
  overridableId: PropTypes.string,
};
