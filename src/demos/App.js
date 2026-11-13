/*
 * SPDX-FileCopyrightText: 2019-2022 CERN.
 * SPDX-License-Identifier: MIT
 */

import { useState } from "react";
import { Button, Container, Divider, Header, Menu, Segment } from "semantic-ui-react";
import { CERNVideosReactSearchKit } from "./cern-videos";
import NamespacedExample from "./cern-videos-namespaced/app";
import { OSReactSearchKit } from "./opensearch";
import { ZenodoReactSearchKit } from "./zenodo";

const demos = {
  "os2": {
    label: "OpenSearch 2",
    text: "You Know, for Search",
    cmp: <OSReactSearchKit />,
  },
  "zenodo": {
    label: "zenodo.org",
    text: "(All) Research. Shared.",
    cmp: <ZenodoReactSearchKit />,
  },
  "cern-videos": {
    label: "videos.cern.ch",
    text: "The CERN official platform for videos.",
    cmp: <CERNVideosReactSearchKit />,
  },
  "namespaced_example": {
    label: "video.cern.ch namespaced",
    text: "Example of multiple React-SearchKit instances rendered at same time, namespaced by their appName, with different overridden components.",
    cmp: <NamespacedExample />,
  },
};

export default function App() {
  const [activeDemo, setActiveDemo] = useState(null);

  const resetUrlParams = () => {
    window.history.pushState({}, document.title, "/");
  };

  const renderHeader = () => {
    const demoMenus = Object.keys(demos).map((key) => (
      <Menu.Item
        key={key}
        name={key}
        active={activeDemo === key}
        onClick={() => {
          setActiveDemo(key);
        }}
      >
        {demos[key].label}
      </Menu.Item>
    ));

    return (
      <Segment inverted vertical>
        <Menu inverted>
          <Container>
            <Menu.Item
              header
              onClick={() => {
                setActiveDemo(null);
                resetUrlParams();
              }}
            >
              React-SearchKit
            </Menu.Item>
            {demoMenus}
          </Container>
        </Menu>
      </Segment>
    );
  };

  const renderContent = () => {
    const links = Object.keys(demos).map((key) => (
      <Segment placeholder textAlign="center" key={key}>
        <Header>{demos[key].label}</Header>
        <p>{demos[key].text}</p>
        <Button
          primary
          onClick={() => {
            setActiveDemo(key);
          }}
        >
          Try it out!
        </Button>
      </Segment>
    ));
    const defaultCmp = (
      <Container text>
        <Header as="h2">React-SearchKit</Header>
        <p>
          This is a collection of demos to show how to use React-SearchKit and
          components.
        </p>
        <p>Choose between one of the available demos:</p>
        {links}
      </Container>
    );
    const cmp = activeDemo && activeDemo in demos ? demos[activeDemo].cmp : defaultCmp;

    return <Container>{cmp}</Container>;
  };

  if (!activeDemo) {
    resetUrlParams();
  }
  return (
    <>
      {renderHeader()}
      <Divider hidden />
      {renderContent()}
    </>
  );
}
