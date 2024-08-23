import React from "react";
import { IconGenerator } from "./IconGenerator";
import { WHEEL_STROKE } from "../types/branding.config";

import "./TableGenerator.css";

export const TableGenerator = ({
  sliceNames,
  wheelId,
  activeSlicePercentages,
}) => {
  const rows = [[], [], [], []]; // Initialize 4 rows
  const slices = Object.values(sliceNames);
  const sliceIdMap = {};

  slices.forEach((slice, index) => {
    sliceIdMap[slice] = index + 1;
    rows[index % 4].push(slice); // Distribute slices evenly across the 4 rows
  });

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
                      <span>
                        <IconGenerator
                          wheelId={wheelId}
                          sliceId={sliceIdMap[slice]}
                        ></IconGenerator>
                      </span>
                      <span className="row-name">{slice}</span>
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
