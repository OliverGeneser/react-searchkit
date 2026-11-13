/*
 * SPDX-FileCopyrightText: 2018-2022 CERN.
 * SPDX-License-Identifier: MIT
 */

import PropTypes from "prop-types";
import { useMemo, useRef } from "react";
import Overridable from "react-overridable";
import { Provider } from "react-redux";
import { UrlHandlerApi } from "../../api";
import { createStoreWithConfig } from "../../store";
import { buildUID } from "../../util";
import { Bootstrap } from "../Bootstrap";
import { AppContext } from "./AppContext";

export function ReactSearchKit({
  urlHandlerApi,
  searchApi,
  suggestionApi = null,
  initialQueryState = {},
  defaultSortingOnEmptyQueryString = {},
  appName = "",
  eventListenerEnabled = false,
  searchOnInit = true,
  children,
  overridableId = "",
}) {
  const storeRef = useRef(null);
  if (storeRef.current === null) {
    const urlHandler = urlHandlerApi ?? {
      enabled: true,
      overrideConfig: {},
      customHandler: null,
    };

    const appConfig = {
      searchApi,
      suggestionApi,
      urlHandlerApi: urlHandler.enabled
        ? urlHandler.customHandler || new UrlHandlerApi(urlHandler.overrideConfig)
        : null,
      searchOnInit,
      initialQueryState,
      defaultSortingOnEmptyQueryString,
    };

    storeRef.current = createStoreWithConfig(appConfig);
  }

  const componentIndexRef = useRef(0);

  const context = useMemo(
    () => ({
      appName,
      buildUID: (element, overrideId) => buildUID(element, overrideId, appName),
      /* This is an internal function that will be used to create id for the checkboxes and labels, ensuring that
          they are unique */
      nextComponentIndex: () => `${appName}_${componentIndexRef.current++}`,
    }),
    [appName]
  );

  const _overridableId = buildUID("ReactSearchKit.children", overridableId, appName);

  return (
    <AppContext.Provider value={context}>
      <Provider store={storeRef.current}>
        <Bootstrap
          searchOnInit={searchOnInit}
          eventListenerEnabled={eventListenerEnabled}
        >
          <Overridable id={_overridableId}>{children}</Overridable>
        </Bootstrap>
      </Provider>
    </AppContext.Provider>
  );
}

ReactSearchKit.propTypes = {
  searchApi: PropTypes.object.isRequired,
  suggestionApi: PropTypes.object,
  urlHandlerApi: PropTypes.shape({
    enabled: PropTypes.bool.isRequired,
    overrideConfig: PropTypes.shape({
      keepHistory: PropTypes.bool,
      urlFilterSeparator: PropTypes.string,
      urlParamsMapping: PropTypes.object,
      urlParamValidator: PropTypes.object,
      urlParser: PropTypes.object,
    }),
    customHandler: PropTypes.object,
  }),
  searchOnInit: PropTypes.bool,
  appName: PropTypes.string,
  eventListenerEnabled: PropTypes.bool,
  overridableId: PropTypes.string,
  initialQueryState: PropTypes.shape({
    queryString: PropTypes.string,
    suggestions: PropTypes.array,
    sortBy: PropTypes.string,
    sortOrder: PropTypes.string,
    page: PropTypes.number,
    size: PropTypes.number,
    filters: PropTypes.array,
    hiddenParams: PropTypes.array,
    layout: PropTypes.oneOf(["list", "grid"]),
  }),
  defaultSortingOnEmptyQueryString: PropTypes.shape({
    sortBy: PropTypes.string,
    sortOrder: PropTypes.string,
  }),
  children: PropTypes.node.isRequired,
};

export default Overridable.component("ReactSearchKit", ReactSearchKit);
