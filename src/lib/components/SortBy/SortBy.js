/*
 * SPDX-FileCopyrightText: 2018-2022 CERN.
 * SPDX-FileCopyrightText: 2022 NYU.
 * SPDX-License-Identifier: MIT
 */

import PropTypes from "prop-types";
import { useContext, useMemo } from "react";
import Overridable from "react-overridable";
import { Dropdown } from "semantic-ui-react";
import { AppContext } from "../ReactSearchKit";
import { ShouldRender } from "../ShouldRender";
import { i18next } from "@translations/i18next";

function SortBy({
  values,
  updateQuerySortBy,
  currentSortBy,
  loading,
  totalResults,
  label = (cmp) => cmp,
  overridableId = "",
  ariaLabel,
  selectOnNavigation = false,
}) {
  const options = useMemo(() => values, [values]);

  const onChange = (value) => {
    if (value === currentSortBy) return;
    updateQuerySortBy(value);
  };

  return (
    <ShouldRender condition={currentSortBy !== null && !loading && totalResults > 0}>
      {label(
        <Element
          currentSortBy={currentSortBy}
          options={options}
          onValueChange={onChange}
          overridableId={overridableId}
          ariaLabel={ariaLabel}
          selectOnNavigation={selectOnNavigation}
        />
      )}
    </ShouldRender>
  );
}

SortBy.propTypes = {
  values: PropTypes.array.isRequired,
  label: PropTypes.func,
  overridableId: PropTypes.string,
  ariaLabel: PropTypes.string,
  selectOnNavigation: PropTypes.bool,
  /* REDUX */
  loading: PropTypes.bool.isRequired,
  totalResults: PropTypes.number.isRequired,
  currentSortBy: PropTypes.string,
  updateQuerySortBy: PropTypes.func.isRequired,
};

const Element = ({
  overridableId = "",
  currentSortBy = null,
  options,
  onValueChange,
  ariaLabel = i18next.t("Sort Results By"),
  selectOnNavigation = false,
}) => {
  const { buildUID } = useContext(AppContext);

  const _options = options.map((element, index) => {
    return { key: index, text: element.text, value: element.value };
  });

  return (
    <Overridable
      id={buildUID("SortBy.element", overridableId)}
      options={options}
      currentSortBy={currentSortBy}
      onValueChange={onValueChange}
      ariaLabel={ariaLabel}
      selectOnNavigation={selectOnNavigation}
    >
      <Dropdown
        selection
        compact
        options={_options}
        value={currentSortBy}
        onChange={(_, { value }) => onValueChange(value)}
        aria-label={ariaLabel}
        selectOnNavigation={selectOnNavigation}
      />
    </Overridable>
  );
};

Element.propTypes = {
  options: PropTypes.array.isRequired,
  currentSortBy: PropTypes.string,
  overridableId: PropTypes.string,
  ariaLabel: PropTypes.string,
  selectOnNavigation: PropTypes.bool,
  onValueChange: PropTypes.func.isRequired,
};

export default Overridable.component("SortBy", SortBy);
