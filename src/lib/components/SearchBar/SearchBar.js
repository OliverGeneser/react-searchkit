/*
 * SPDX-FileCopyrightText: 2018-2022 CERN.
 * SPDX-License-Identifier: MIT
 */

import PropTypes from "prop-types";
import { useContext, useEffect, useRef, useState } from "react";
import Overridable from "react-overridable";
import { Input } from "semantic-ui-react";
import { AppContext } from "../ReactSearchKit";
import { i18next } from "@translations/i18next";

function SearchBar({
  updateQueryString,
  queryString = "",
  actionProps = null,
  autofocus = false,
  executeSearch: executeSearchProp = null,
  onBtnSearchClick: onBtnSearchClickProp = null,
  onInputChange: onInputChangeProp = null,
  onKeyPress: onKeyPressProp = null,
  overridableId = "",
  placeholder = "",
  uiProps = null,
}) {
  const [currentValue, setCurrentValue] = useState(queryString || "");

  const handleInputChange = (newQueryString) => {
    setCurrentValue(newQueryString);
  };

  const handleExecuteSearch = () => {
    updateQueryString(currentValue);
  };

  const handleBtnSearchClick = () => {
    handleExecuteSearch();
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleExecuteSearch();
    }
  };

  return (
    <Element
      actionProps={actionProps}
      autofocus={autofocus}
      executeSearch={executeSearchProp || handleExecuteSearch}
      onBtnSearchClick={onBtnSearchClickProp || handleBtnSearchClick}
      onInputChange={onInputChangeProp || handleInputChange}
      onKeyPress={onKeyPressProp || handleKeyPress}
      overridableId={overridableId}
      placeholder={placeholder}
      queryString={currentValue}
      uiProps={uiProps}
    />
  );
}

SearchBar.propTypes = {
  actionProps: PropTypes.object,
  autofocus: PropTypes.bool,
  executeSearch: PropTypes.func,
  onBtnSearchClick: PropTypes.func,
  onInputChange: PropTypes.func,
  onKeyPress: PropTypes.func,
  overridableId: PropTypes.string,
  placeholder: PropTypes.string,
  uiProps: PropTypes.object,
  /* REDUX */
  queryString: PropTypes.string,
  updateQueryString: PropTypes.func.isRequired,
};

// NOTE: Adding the key prop, will recreate the SearchBar in order to update
// state with the latest redux queryString value.
// https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#recommendation-fully-uncontrolled-component-with-a-key
const SearchBarUncontrolled = ({ queryString = "", ...props }) => {
  return <SearchBar key={queryString} queryString={queryString} {...props} />;
};

SearchBarUncontrolled.propTypes = {
  queryString: PropTypes.string,
};

function Element({
  autofocus = false,
  actionProps = null,
  onBtnSearchClick = null,
  onInputChange = null,
  onKeyPress = null,
  overridableId = "",
  placeholder = "",
  queryString = "",
  uiProps = null,
}) {
  const { buildUID } = useContext(AppContext);
  const focusInputRef = useRef(null);

  useEffect(() => {
    if (autofocus && focusInputRef.current) {
      focusInputRef.current.focus();
    }
  }, [autofocus]);

  return (
    <Overridable
      id={buildUID("SearchBar.element", overridableId)}
      queryString={queryString}
      onBtnSearchClick={onBtnSearchClick}
      onInputChange={onInputChange}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      actionProps={actionProps}
      uiProps={uiProps}
    >
      <Input
        action={{
          content: i18next.t("Search"),
          onClick: onBtnSearchClick,
          ...actionProps,
        }}
        fluid
        {...uiProps}
        placeholder={placeholder || i18next.t("Type something")}
        onChange={(_, { value }) => {
          onInputChange(value);
        }}
        value={queryString}
        onKeyPress={onKeyPress}
        ref={(input) => {
          focusInputRef.current = input;
        }}
      />
    </Overridable>
  );
}

Element.propTypes = {
  actionProps: PropTypes.object,
  autofocus: PropTypes.bool,
  onBtnSearchClick: PropTypes.func,
  onInputChange: PropTypes.func,
  onKeyPress: PropTypes.func,
  overridableId: PropTypes.string,
  placeholder: PropTypes.string,
  queryString: PropTypes.string,
  uiProps: PropTypes.object,
};

export default Overridable.component("SearchBar", SearchBarUncontrolled);
