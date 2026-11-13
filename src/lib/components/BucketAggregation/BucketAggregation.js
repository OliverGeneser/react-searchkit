/*
 * SPDX-FileCopyrightText: 2019-2022 CERN.
 * SPDX-License-Identifier: MIT
 */

import _get from "lodash/get";
import PropTypes from "prop-types";
import { useContext } from "react";
import Overridable from "react-overridable";
import { Card } from "semantic-ui-react";
import { AppContext } from "../ReactSearchKit";
import BucketAggregationValues from "./BucketAggregationValues";

function BucketAggregation({
  title,
  agg,
  updateQueryFilters,
  overridableId = "",
  userSelectionFilters,
  resultsAggregations,
  ...props
}) {
  const onFilterClicked = (filter) => {
    updateQueryFilters(filter);
  };

  const _renderValues = (resultBuckets, selectedFilters) => {
    return (
      <BucketAggregationValues
        buckets={resultBuckets}
        selectedFilters={selectedFilters}
        field={agg.field}
        aggName={agg.aggName}
        childAgg={agg.childAgg}
        onFilterClicked={onFilterClicked}
        overridableId={overridableId}
      />
    );
  };

  const _getSelectedFilters = (userSelectionFilters) => {
    // get selected filters for this field only
    return userSelectionFilters.filter((filter) => filter[0] === agg.aggName);
  };

  const _getResultBuckets = (resultsAggregations) => {
    // get buckets of this field
    const thisAggs = _get(resultsAggregations, agg.aggName, {});
    if ("buckets" in thisAggs) {
      if (!Array.isArray(thisAggs["buckets"])) {
        // buckets can be objects or arrays: convert to array if object
        // to keep it consistent
        thisAggs["buckets"] = Object.entries(thisAggs["buckets"]).map(
          ([key, value]) => ({ ...value, key })
        );
      }
      return thisAggs["buckets"];
    }
    return [];
  };

  const selectedFilters = _getSelectedFilters(userSelectionFilters);
  const resultBuckets = _getResultBuckets(resultsAggregations);
  const valuesCmp = resultBuckets.length
    ? _renderValues(resultBuckets, selectedFilters)
    : null;
  return (
    <Element
      title={title}
      containerCmp={valuesCmp}
      overridableId={overridableId}
      {...props}
    />
  );
}

BucketAggregation.propTypes = {
  title: PropTypes.string.isRequired,
  agg: PropTypes.shape({
    field: PropTypes.string.isRequired,
    aggName: PropTypes.string.isRequired,
    childAgg: PropTypes.object,
  }).isRequired,
  overridableId: PropTypes.string,
  /* REDUX */
  userSelectionFilters: PropTypes.array.isRequired,
  resultsAggregations: PropTypes.object.isRequired,
  updateQueryFilters: PropTypes.func.isRequired,
};

const Element = ({
  overridableId = "",
  agg,
  title,
  containerCmp = null,
  updateQueryFilters,
}) => {
  const { buildUID } = useContext(AppContext);

  return (
    containerCmp && (
      <Overridable
        id={buildUID("BucketAggregation.element", overridableId)}
        agg={agg}
        title={title}
        containerCmp={containerCmp}
        updateQueryFilters={updateQueryFilters}
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

Element.propTypes = {
  agg: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  containerCmp: PropTypes.node,
  overridableId: PropTypes.string,
  updateQueryFilters: PropTypes.func.isRequired,
};

export default Overridable.component("BucketAggregation", BucketAggregation);
