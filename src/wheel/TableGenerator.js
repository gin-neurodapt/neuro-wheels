import React from "react";
import { IconGenerator } from "./IconGenerator";
import { WHEEL_STROKE } from "../types/branding.config";

import "./TableGenerator.css";

export const TableGenerator = ({
  sliceNames,
  wheelId,
  activeSlicePercentages,
}) => {
  // Create a map of slice names to slice IDs
  const sliceIdMap = Object.values(sliceNames).reduce((acc, slice, index) => {
    acc[slice] = index + 1;
    return acc;
  }, {});

  // Distribute slices evenly across 4 rows
  const rows = Array.from({ length: 4 }, (_, rowIndex) =>
    Object.values(sliceNames).filter((_, index) => index % 4 === rowIndex)
  );

  return (
    <div className="table">
      <table>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((slice, colIndex) => (
                <th
                  key={colIndex}
                  style={{ borderColor: WHEEL_STROKE[wheelId] }}
                >
                  <div className="table-row">
                    <div>
                      <span className="row">
                        <IconGenerator
                          wheelId={wheelId}
                          sliceId={sliceIdMap[slice]}
                        />
                      </span>
                      <span className="row row-name">{slice}</span>
                    </div>
                    <strong
                      className="percentage"
                      style={{ color: WHEEL_STROKE[wheelId] }}
                    >
                      {activeSlicePercentages[slice]}%
                    </strong>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
