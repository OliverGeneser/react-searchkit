/*
 * SPDX-FileCopyrightText: 2018-2022 CERN.
 * SPDX-License-Identifier: MIT
 */

import PropTypes from "prop-types";
import { useContext, useEffect } from "react";
import Overridable from "react-overridable";
import { AppContext } from "../ReactSearchKit/AppContext";

function Bootstrap({
  eventListenerEnabled = false,
  onAppInitialized,
  searchOnUrlQueryStringChanged,
  searchOnInit = true,
  updateQueryState,
  children,
}) {
  const { appName } = useContext(AppContext);

  useEffect(() => {
    const onQueryChanged = ({ detail: payload }) => {
      const appNameNotDefined = !appName;
      if (appNameNotDefined) {
        updateQueryState(payload.searchQuery);
      } else {
        const eventRecipient = payload.appName;
        const sameName = eventRecipient === appName;
        if (sameName) {
          updateQueryState(payload.searchQuery);
        } else {
          console.debug(
            `React-SearchKit '${appName}': ignoring event sent for app '${eventRecipient}'`
          );
        }
      }
    };

    if (eventListenerEnabled) {
      window.addEventListener("queryChanged", onQueryChanged);
    }
    window.onpopstate = () => {
      searchOnUrlQueryStringChanged();
    };
    onAppInitialized(searchOnInit);

    return () => {
      window.onpopstate = () => {};
      window.removeEventListener("queryChanged", onQueryChanged);
    };
  }, [
    eventListenerEnabled,
    onAppInitialized,
    searchOnInit,
    searchOnUrlQueryStringChanged,
    updateQueryState,
    appName,
  ]);

  return children;
}

Bootstrap.propTypes = {
  searchOnInit: PropTypes.bool,
  eventListenerEnabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  /* Redux */
  onAppInitialized: PropTypes.func.isRequired,
  updateQueryState: PropTypes.func.isRequired,
  searchOnUrlQueryStringChanged: PropTypes.func.isRequired,
};

export default Overridable.component("Bootstrap", Bootstrap);
