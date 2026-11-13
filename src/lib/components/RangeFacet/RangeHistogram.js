/*
 * SPDX-FileCopyrightText: 2026 CERN.
 * SPDX-License-Identifier: MIT
 */

import PropTypes from "prop-types";
import { useContext, useState } from "react";
import Overridable from "react-overridable";
import { Popup } from "semantic-ui-react";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { withParentSize } from "@visx/responsive";
import { AppContext } from "../ReactSearchKit";

const MAX_BAR_WIDTH = 30;

function RangeHistogram({
  parentWidth,
  data,
  range,
  height,
  onBarClick,
  overridableId = "",
}) {
  const [hoveredYear, setHoveredYear] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const handleBarHover = (event, datum) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredYear(datum.year);
    setTooltip({
      year: datum.year,
      count: datum.count,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleBarLeave = () => {
    setHoveredYear(null);
    setTooltip(null);
  };

  const buildScales = (chartData, width, chartHeight) => {
    const xScale = scaleBand({
      domain: chartData.map((d) => d.year),
      range: [0, width],
      padding: 0.1,
    });

    const yScale = scaleLinear({
      domain: [0, Math.max(...chartData.map((d) => d.count))],
      range: [chartHeight, 0],
      nice: true,
    });

    return { xScale, yScale };
  };

  if (!parentWidth || parentWidth <= 0 || data.length === 0) {
    return null;
  }

  const { xScale, yScale } = buildScales(data, parentWidth, height);

  return (
    <RangeHistogramElement
      data={data}
      range={range}
      width={parentWidth}
      height={height}
      xScale={xScale}
      yScale={yScale}
      hoveredYear={hoveredYear}
      tooltip={tooltip}
      onBarClick={onBarClick}
      onBarHover={handleBarHover}
      onBarLeave={handleBarLeave}
      overridableId={overridableId}
    />
  );
}

RangeHistogram.propTypes = {
  parentWidth: PropTypes.number, // injected by withParentSize
  data: PropTypes.arrayOf(
    PropTypes.shape({
      year: PropTypes.number.isRequired,
      count: PropTypes.number.isRequired,
    })
  ).isRequired,
  range: PropTypes.arrayOf(PropTypes.number).isRequired,
  height: PropTypes.number.isRequired,
  onBarClick: PropTypes.func.isRequired,
  overridableId: PropTypes.string,
};

const RangeHistogramElement = ({
  data,
  range,
  width,
  height,
  xScale,
  yScale,
  hoveredYear = null,
  tooltip = null,
  onBarClick,
  onBarHover,
  onBarLeave,
  overridableId = "",
}) => {
  const { buildUID } = useContext(AppContext);

  return (
    <Overridable
      id={buildUID("RangeFacet.Histogram.element", overridableId)}
      data={data}
      range={range}
      width={width}
      height={height}
    >
      <>
        <svg width={width} height={height}>
          {data.map((d) => {
            const selected = d.year >= range[0] && d.year <= range[1];
            const rawWidth = xScale.bandwidth();
            const barWidth = Math.min(rawWidth, MAX_BAR_WIDTH);
            const barX = xScale(d.year) + (rawWidth - barWidth) / 2;

            return (
              <Bar
                key={d.year}
                x={barX}
                y={yScale(d.count)}
                width={barWidth}
                height={height - yScale(d.count)}
                className={[
                  "searchkit-daterange-histogram-bar",
                  selected && "is-selected",
                  hoveredYear === d.year && "is-hovered",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onBarClick(d.year)}
                onMouseEnter={(event) => onBarHover(event, d)}
                onMouseLeave={onBarLeave}
              />
            );
          })}
        </svg>

        <RangeHistogramTooltip tooltip={tooltip} overridableId={overridableId} />
      </>
    </Overridable>
  );
};

RangeHistogramElement.propTypes = {
  data: PropTypes.array.isRequired,
  range: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  xScale: PropTypes.func.isRequired,
  yScale: PropTypes.func.isRequired,
  hoveredYear: PropTypes.number,
  tooltip: PropTypes.object,
  onBarClick: PropTypes.func.isRequired,
  onBarHover: PropTypes.func.isRequired,
  onBarLeave: PropTypes.func.isRequired,
  overridableId: PropTypes.string,
};

const RangeHistogramTooltip = ({ tooltip = null, overridableId = "" }) => {
  const { buildUID } = useContext(AppContext);

  return (
    <Overridable
      id={buildUID("RangeFacet.Histogram.Tooltip.element", overridableId)}
      tooltip={tooltip}
    >
      {tooltip && (
        <Popup
          open
          inverted
          size="mini"
          position="top center"
          content={`${tooltip.year}: ${tooltip.count}`}
          trigger={
            <span
              style={{
                position: "fixed",
                left: tooltip.x,
                top: tooltip.y,
              }}
            />
          }
        />
      )}
    </Overridable>
  );
};

RangeHistogramTooltip.propTypes = {
  tooltip: PropTypes.shape({
    year: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }),
  overridableId: PropTypes.string,
};

export default Overridable.component("RangeHistogram", withParentSize(RangeHistogram));
