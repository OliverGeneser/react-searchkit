/*
 * SPDX-FileCopyrightText: 2018-2022 CERN.
 * SPDX-License-Identifier: MIT
 */

import PropTypes from "prop-types";
import { useContext } from "react";
import Overridable from "react-overridable";
import { Icon, Label } from "semantic-ui-react";
import { AppContext } from "../ReactSearchKit";

function ActiveFilters({ updateQueryFilters, filters, overridableId }) {
  const _getLabel = (filter) => {
    const aggName = filter[0];
    let value = filter[1];
    let currentFilter = [aggName, value];
    const hasChild = filter.length === 3;
    if (hasChild) {
      const { label, activeFilter } = _getLabel(filter[2]);
      value = `${value}.${label}`;
      currentFilter.push(activeFilter);
    }
    return {
      label: value,
      activeFilter: currentFilter,
    };
  };

  return (
    !!filters.length && (
      <Element
        filters={filters}
        removeActiveFilter={updateQueryFilters}
        getLabel={_getLabel}
        overridableId={overridableId}
      />
    )
  );
}

ActiveFilters.propTypes = {
  overridableId: PropTypes.string,
  /* REDUX */
  filters: PropTypes.array.isRequired,
  updateQueryFilters: PropTypes.func.isRequired,
};

const Element = ({ overridableId = "", filters, removeActiveFilter, getLabel }) => {
  const { buildUID } = useContext(AppContext);

  return (
    <Overridable
      id={buildUID("ActiveFilters.element", overridableId)}
      filters={filters}
      removeActiveFilter={removeActiveFilter}
      getLabel={getLabel}
    >
      <>
        {filters.map((filter, index) => {
          const { label, activeFilter } = getLabel(filter);
          return (
            // eslint-disable-next-line react/no-array-index-key
            <Label image key={index} onClick={() => removeActiveFilter(activeFilter)}>
              {label}
              <Icon name="delete" />
            </Label>
          );
        })}
      </>
    </Overridable>
  );
};

Element.propTypes = {
  filters: PropTypes.array.isRequired,
  removeActiveFilter: PropTypes.func.isRequired,
  getLabel: PropTypes.func.isRequired,
  overridableId: PropTypes.string,
};

export default Overridable.component("ActiveFilters", ActiveFilters);
