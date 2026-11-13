/*
 * SPDX-FileCopyrightText: 2019-2022 CERN.
 * SPDX-License-Identifier: MIT
 */
/* eslint-disable no-unused-vars */
/* eslint-disable react/no-this-in-sfc */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
/* eslint-disable react/require-default-props */

import _ from "lodash";
import PropTypes from "prop-types";
import { useContext, useEffect, useMemo, useState } from "react";
import Overridable from "react-overridable";
import { Input, Button } from "semantic-ui-react";
import { AppContext } from "../ReactSearchKit";
import "./AutocompleteSearchBar.scss";
import { i18next } from "@translations/i18next";

function AutocompleteSearchBar({
  updateQueryString,
  debounce,
  updateSuggestions,
  debounceTime,
  clearSuggestions,
  queryString = "",
  handleAutocompleteChange: handleAutocompleteChangeProp,
  minCharsToAutocomplete = 3,
  placeholder = "",
  suggestions,
  overridableId = "",
}) {
  const [currentValue, setCurrentValue] = useState(queryString || "");

  const debouncedUpdateSuggestions = useMemo(
    () =>
      debounce
        ? _.debounce(updateSuggestions, debounceTime, {
            leading: true,
          })
        : updateSuggestions,
    [debounce, updateSuggestions, debounceTime]
  );

  useEffect(() => {
    return () => {
      if (
        debouncedUpdateSuggestions &&
        typeof debouncedUpdateSuggestions.cancel === "function"
      ) {
        debouncedUpdateSuggestions.cancel();
      }
    };
  }, [debouncedUpdateSuggestions]);

  const _handleAutocompleteChange = (suggestionString) => {
    if (suggestionString.length >= minCharsToAutocomplete) {
      debouncedUpdateSuggestions(suggestionString);
    }
  };

  const handleAutocompleteChange =
    handleAutocompleteChangeProp || _handleAutocompleteChange;

  const onInputChange = (newQueryString) => {
    setCurrentValue(newQueryString);
    handleAutocompleteChange(newQueryString);
  };

  const executeSearch = () => {
    updateQueryString(currentValue);
  };

  const onSuggestionSelected = (suggestion) => {
    setCurrentValue(suggestion);
    clearSuggestions();
    updateQueryString(suggestion);
  };

  return (
    <Element
      placeholder={placeholder}
      queryString={currentValue}
      querySuggestions={suggestions}
      onInputChange={onInputChange}
      executeSearch={executeSearch}
      onSuggestionSelected={onSuggestionSelected}
      overridableId={overridableId}
    />
  );
}

AutocompleteSearchBar.propTypes = {
  queryString: PropTypes.string,
  updateQueryString: PropTypes.func.isRequired,
  updateSuggestions: PropTypes.func.isRequired,
  clearSuggestions: PropTypes.func.isRequired,
  handleAutocompleteChange: PropTypes.func,
  debounce: PropTypes.bool,
  debounceTime: PropTypes.number,
  placeholder: PropTypes.string,
  minCharsToAutocomplete: PropTypes.number,
  overridableId: PropTypes.string,
};

const AutocompleteSearchBarUncontrolled = ({ queryString = "", ...props }) => (
  <AutocompleteSearchBar key={queryString} queryString={queryString} {...props} />
);

const Element = ({
  overridableId,
  placeholder,
  queryString,
  querySuggestions,
  onInputChange,
  executeSearch,
  onSuggestionSelected,
  ...props
}) => {
  const { buildUID } = useContext(AppContext);
  const onBtnSearchClick = (event, input) => {
    executeSearch();
  };
  const onKeyPress = (event, input) => {
    if (event.key === "Enter") {
      executeSearch();
    }
  };

  return (
    <Overridable
      id={buildUID("AutocompleteSearchBar.element", overridableId)}
      {...props}
    >
      <div className="AutoCompleteText">
        <Input
          action={{
            content: i18next.t("Search"),
            onClick: onBtnSearchClick,
          }}
          fluid
          placeholder={placeholder}
          onChange={(event, { value }) => {
            onInputChange(value);
          }}
          value={queryString}
          onKeyPress={onKeyPress}
        />
        <Suggestions
          querySuggestions={querySuggestions}
          overridableId={overridableId}
          onSuggestionSelected={onSuggestionSelected}
        />
      </div>
    </Overridable>
  );
};

const Suggestions = ({ overridableId, onSuggestionSelected, ...props }) => {
  const { querySuggestions } = props;
  const { buildUID } = useContext(AppContext);

  if (!querySuggestions || querySuggestions.length === 0) {
    return null;
  }

  return (
    <Overridable
      id={buildUID("AutocompleteSearchBar.suggestions", overridableId)}
      {...props}
    >
      <ul>
        {querySuggestions.map((text) => (
          <Button as="li" onClick={() => onSuggestionSelected(text)} key={text}>
            {text}
          </Button>
        ))}
      </ul>
    </Overridable>
  );
};

export default Overridable.component(
  "AutocompleteSearchBar",
  AutocompleteSearchBarUncontrolled
);
