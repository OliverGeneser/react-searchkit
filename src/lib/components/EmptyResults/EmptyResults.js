/*
 * SPDX-FileCopyrightText: 2018-2022 CERN.
 * SPDX-License-Identifier: MIT
 */

import _isEmpty from "lodash/isEmpty";
import PropTypes from "prop-types";
import { useContext } from "react";
import Overridable from "react-overridable";
import { Button, Header, Icon, Segment } from "semantic-ui-react";
import { AppContext } from "../ReactSearchKit";
import { ShouldRender } from "../ShouldRender";
import { i18next } from "@translations/i18next";

function EmptyResults({
  resetQuery,
  loading,
  totalResults,
  error,
  queryString,
  extraContent,
  overridableId,
  userSelectionFilters,
  ...props
}) {
  return (
    <ShouldRender condition={!loading && _isEmpty(error) && totalResults === 0}>
      <Element
        {...props}
        queryString={queryString}
        resetQuery={resetQuery}
        extraContent={extraContent}
        userSelectionFilters={userSelectionFilters}
        overridableId={overridableId}
      />
    </ShouldRender>
  );
}

EmptyResults.propTypes = {
  extraContent: PropTypes.node,
  overridableId: PropTypes.string,
  /* REDUX */
  loading: PropTypes.bool.isRequired,
  totalResults: PropTypes.number.isRequired,
  error: PropTypes.object.isRequired,
  queryString: PropTypes.string,
  resetQuery: PropTypes.func.isRequired,
  userSelectionFilters: PropTypes.array.isRequired,
};

const Element = ({
  overridableId = "",
  queryString = "",
  resetQuery,
  extraContent = null,
  userSelectionFilters,
}) => {
  const { buildUID } = useContext(AppContext);

  return (
    <Overridable
      id={buildUID("EmptyResults.element", overridableId)}
      queryString={queryString}
      resetQuery={resetQuery}
      extraContent={extraContent}
      userSelectionFilters={userSelectionFilters}
    >
      <Segment placeholder textAlign="center">
        <Header icon>
          <Icon name="search" />
          {i18next.t("No results found!")}
        </Header>
        <em>
          {i18next.t("Current search {{- search}}", {
            search: queryString && `'${queryString}'`,
          })}
        </em>
        <br />
        <Button primary onClick={() => resetQuery()}>
          {i18next.t("Clear query")}
        </Button>
        {extraContent}
      </Segment>
    </Overridable>
  );
};

Element.propTypes = {
  queryString: PropTypes.string,
  resetQuery: PropTypes.func.isRequired,
  extraContent: PropTypes.node,
  overridableId: PropTypes.string,
  userSelectionFilters: PropTypes.array.isRequired,
};

export default Overridable.component("EmptyResults", EmptyResults);
