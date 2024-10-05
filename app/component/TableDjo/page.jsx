"use client";
import style from "./page.module.css";
function TableDjo({ colums, object }) {
  return (
    <>
      {" "}
      <table className={style.table}>
        <thead className={style.tr}>
          <tr>
            {colums.map((col, index) => (
              <th key={index} className={style.th}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {object.map((ob, rowIndex) => (
            <tr key={rowIndex}>
              {colums.map((o, cellIndex) => (
                <td key={cellIndex} className={style.td}>
                  {ob[o]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
export default TableDjo;
