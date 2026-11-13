/*
 * SPDX-FileCopyrightText: 2018-2022 CERN.
 * SPDX-License-Identifier: MIT
 */

import PropTypes from "prop-types";
import { useContext } from "react";
import Overridable from "react-overridable";
import { Icon, Menu } from "semantic-ui-react";
import { AppContext } from "../ReactSearchKit";
import { ShouldRender } from "../ShouldRender";

function LayoutSwitcher({
  updateLayout,
  currentLayout,
  loading,
  totalResults,
  overridableId,
}) {
  const onLayoutChange = (layoutName) => {
    updateLayout(layoutName);
  };

  return (
    <ShouldRender condition={currentLayout !== null && !loading && totalResults > 0}>
      <Element
        currentLayout={currentLayout}
        onLayoutChange={onLayoutChange}
        overridableId={overridableId}
      />
    </ShouldRender>
  );
}

LayoutSwitcher.propTypes = {
  overridableId: PropTypes.string,
  /* REDUX */
  updateLayout: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  currentLayout: PropTypes.string,
  totalResults: PropTypes.number.isRequired,
};

const Element = ({ overridableId = "", currentLayout = null, onLayoutChange }) => {
  const { buildUID } = useContext(AppContext);
  return (
    <Overridable
      id={buildUID("LayoutSwitcher.element", overridableId)}
      currentLayout={currentLayout}
      onLayoutChange={onLayoutChange}
    >
      <Menu compact icon>
        <Menu.Item
          name="list"
          active={currentLayout === "list"}
          onClick={(_, { name }) => onLayoutChange(name)}
        >
          <Icon name="list layout" />
        </Menu.Item>
        <Menu.Item
          name="grid"
          active={currentLayout === "grid"}
          onClick={(_, { name }) => onLayoutChange(name)}
        >
          <Icon name="grid layout" />
        </Menu.Item>
      </Menu>
    </Overridable>
  );
};

Element.propTypes = {
  currentLayout: PropTypes.string,
  onLayoutChange: PropTypes.func.isRequired,
  overridableId: PropTypes.string,
};

export default Overridable.component("LayoutSwitcher", LayoutSwitcher);
