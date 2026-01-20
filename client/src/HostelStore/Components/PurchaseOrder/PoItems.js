import { useEffect, useState } from "react";
import secureLocalStorage from "react-secure-storage";
import { CLOSE_ICON, VIEW } from "../../../icons";
import FxSelect from "../../../Inputs";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const PoItems = ({
  id,
  poItems,
  setPoItems,
  readOnly,
  params,
  styleList,
  uomList,
  hsnList,
  taxTypeId
}) => {
  const [contextMenu, setContextMenu] = useState(null);

  const addRow = () => {
    const newRow = {
      styleId: "",
      hsnId: "",
      uomId: "",
      price: "",
      qty: "",
    };
    setPoItems([...poItems, newRow]);
  };

  const handleInputChange = async (value, index, field) => {
    // clone first
    const newRows = structuredClone(poItems);

    // normal fields
    newRows[index][field] = value;
    setPoItems([...newRows]);
  };
  const deleteRow = (id) => {
    setPoItems((currentRows) => {
      if (currentRows.length > 1) {
        return currentRows.filter((row, index) => index !== parseInt(id));
      }
      return currentRows;
    });
  };

  const handleDeleteAllRows = () => {
    setPoItems((prevRows) => {
      if (prevRows.length <= 1) return prevRows;
      return [prevRows[0]];
    });
  };

  const handleRightClick = (event, rowIndex, type) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      rowId: rowIndex,
      type,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    if (poItems) {
      setPoItems((prev) => {
        const filledRows = prev.length;

        if (filledRows < 4) {
          // add empty rows until total becomes 6
          return [
            ...prev,
            ...Array.from({ length: 4 - filledRows }, () => ({
              styleId: "",
              hsnId: "",
              uomId: "",
              price: "",
              qty: "",
            })),
          ];
        }
        return prev; // if already >= 6, just keep as it is
      });
    } else {
    //   setPoItems(
    //     Array.from({ length: 4 }, () => ({
    //       styleId: "",
    //       hsnId: "",
    //       uomId: "",
    //       price: "",
    //       qty: "",
    //     })),
    //   );
    }
  }, [poItems, setPoItems]);

  const deleteSelectedRows = () => {
    setPoItems((rows) =>
      rows.filter((r) => !(r.selected && (r.stockQty ?? 0) === 0)),
    );
    setContextMenu(null);
  };

  return (
    <>
      <div className="border border-slate-200 px-2 bg-white rounded-md shadow-sm max-h-[450px] overflow-auto  w-full">
        <div className="flex justify-between items-center my-2">
          <h2 className="font-medium text-slate-700">List Of Items</h2>
        </div>
        <div
          className={`w-full min-h-[200px] max-h-[250px] overflow-y-auto  my-2`}
        >
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10">
              <tr>
                <th
                  className={`w-12 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  S.No
                </th>
                <th
                  className={`w-48 px-2 py-2 text-center font-medium text-[13px]`}
                >
                  Description of Goods
                </th>
                <th
                  className={`w-48 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  HSN/SAC
                </th>
                <th
                  className={`w-36 px-4 py-2 text-center font-medium text-[13px] `}
                >
                  UOM
                </th>
                <th
                  className={`w-36 px-4 py-2 text-center font-medium text-[13px] `}
                >
                  Quantity
                </th>

                <th
                  className={`w-24 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Price
                </th>
                <th
                  className={`w-24 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Gross
                </th>
                <th
                  className={`w-24 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Tax Details
                </th>
                <th
                  className={`w-24 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Actions
                </th>
                <th
                  className={`w-16 px-3 py-2 text-center font-medium text-[13px] `}
                ></th>
              </tr>
            </thead>
            <tbody>
              {(poItems ? poItems : [])?.map((row, index) => (
                <tr
                  className="border border-blue-gray-200 cursor-pointer "
                  key={index}
                >
                  <td className="w-12 border border-gray-300 text-[11px]  text-center p-0.5">
                    {index + 1}
                  </td>
                  <td className="border-blue-gray-200 text-[11px] border border-gray-300 py-0.5 text-left">
                    <FxSelect
                      inputId={`styleId-input-${index}`}
                      value={row.styleId}
                      onChange={(val) =>
                        handleInputChange(val, index, "styleId")
                      }
                      options={(styleList?.data || [])
                        .filter((item) => item.active)
                        .map((item) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                      readOnly={readOnly}
                      placeholder=""
                      onBlur={() =>
                        handleInputChange(row.styleId, index, "styleId")
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Delete") {
                          handleInputChange("", index, "styleId");
                        }
                      }}
                    />
                  </td>
                  <td className="py-0.5 border border-gray-300 text-[11px] ">
                    <FxSelect
                      value={row.hsnId}
                      onChange={(val) => handleInputChange(val, index, "hsnId")}
                      options={(hsnList?.data || [])
                        .filter((item) => item.active)
                        .map((item) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                      readOnly={readOnly}
                      placeholder=""
                      onBlur={() =>
                        handleInputChange(row.hsnId, index, "hsnId")
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Delete") {
                          handleInputChange("", index, "hsnId");
                        }
                      }}
                    />
                  </td>
                  <td className="py-0.5 border border-gray-300 text-[11px] ">
                    <FxSelect
                      value={row.uomId}
                      onChange={(val) => handleInputChange(val, index, "uomId")}
                      options={(uomList?.data || [])
                        .filter((item) => item.active)
                        .map((item) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                      readOnly={readOnly}
                      placeholder=""
                      onBlur={() =>
                        handleInputChange(row.uomId, index, "uomId")
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Delete") {
                          handleInputChange("", index, "uomId");
                        }
                      }}
                    />
                  </td>
                  <td className="border-blue-gray-200 text-[11px] border border-gray-300 py-0.5 text-right">
                    <input
                      onKeyDown={(e) => {
                        if (e.code === "Minus" || e.code === "NumpadSubtract")
                          e.preventDefault();
                        if (e.key === "Delete") {
                          handleInputChange("", index, "qty");
                        }
                      }}
                      min={"0"}
                      type="number"
                      className="text-right rounded py-1 px-1 w-full table-data-input"
                      onFocus={(e) => e.target.select()}
                      value={row?.qty}
                      onChange={(e) =>
                        handleInputChange(e.target.value, index, "qty")
                      }
                      onBlur={(e) => {
                        handleInputChange(e.target.value, index, "qty");
                      }}
                      disabled={readOnly || (row.stockQty ?? 0) > 0}
                    />
                  </td>
                  <td className="border-blue-gray-200 text-[11px] border border-gray-300 py-0.5 text-right">
                    <input
                      onKeyDown={(e) => {
                        if (e.code === "Minus" || e.code === "NumpadSubtract")
                          e.preventDefault();
                        if (e.key === "Delete") {
                          handleInputChange("", index, "price");
                        }
                      }}
                      min={"0"}
                      type="number"
                      className="text-right rounded py-1 px-1 w-full table-data-input"
                      onFocus={(e) => e.target.select()}
                      value={row?.price}
                      onChange={(e) =>
                        handleInputChange(e.target.value, index, "price")
                      }
                      onBlur={(e) => {
                        const minQty = row.minQty || 0;
                        if (parseFloat(minQty) > parseFloat(e.target.value)) {
                          e.target.value = "";
                          Swal.fire({
                            icon: "warning",
                            title: "Invalid Meter",
                            text: `Inward Meter cannot be Less than Min Meter! - ${minQty}`,
                            confirmButtonText: "OK",
                          });
                          return;
                        }
                        handleInputChange(e.target.value, index, "price");
                      }}
                      disabled={readOnly}
                    />
                  </td>
                  <td className="py-0.5 border border-gray-300 text-[11px]">
                    <input
                      type="number"
                      onFocus={(e) => e.target.select()}
                      className="text-right rounded py-1 px-1 w-full"
                      value={
                        !row.qty || !row.price
                          ? 0.0
                          : parseFloat(row.qty) * parseFloat(row.price)
                      }
                      disabled={true}
                    />
                  </td>

                  <td className="w-40 py-0.5 border border-gray-300 text-[11px] text-right">
                    <button
                      disabled={readOnly || !row?.styleId}
                      className="text-center rounded py-1 w-20"
                    //   onKeyDown={(e) => {
                    //     if (e.key === "Enter") {
                    //       setCurrentSelectedIndex(index);
                    //     }
                    //   }}
                      onClick={() => {
                        if (!taxTypeId)
                          return toast.info("Please select Tax Type", {
                            position: "top-center",
                          });
                        // setCurrentSelectedIndex(index);
                      }}
                    >
                      {VIEW}
                    </button>
                  </td>

                  <td className="w-2 border border-gray-300">
                    <input
                      // onContextMenu={(e) => {
                      //   if (!readOnly) {
                      //     handleRightClick(e, index, "");
                      //   }
                      // }}
                      className="w-full"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRow();
                        }
                      }}
                      disabled={readOnly}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 h-7 font-medium text-gray-800">
                <td
                  className="text-right px-4 border border-gray-300 font-medium text-[13px] py-0.5"
                  colSpan={8}
                >
                  Total
                </td>
                <td className="text-right border border-gray-300 px-1 font-medium text-[13px] py-0.5">
                  {poItems?.reduce(
                    (sum, row) => sum + (Number(row.price) || 0),
                    0,
                  )}
                </td>
                <td className="text-right border border-gray-300 px-1 font-medium text-[13px] py-0.5">
                  {poItems?.reduce(
                    (sum, row) => sum + (Number(row.gross) || 0),
                    0,
                  )}
                </td>
                <td className="border border-gray-300" colSpan={1}></td>
              </tr>
            </tfoot>
          </table>
         
        </div>
        {contextMenu && (
          <div
            style={{
              position: "fixed",
              top: `${contextMenu.mouseY - 20}px`,
              left: `${contextMenu.mouseX + 20}px`,
              boxShadow: "0px 0px 5px rgba(0,0,0,0.3)",
              padding: "8px",
              borderRadius: "4px",
              zIndex: 1000,
            }}
            className="bg-gray-100"
            onMouseLeave={handleCloseContextMenu}
          >
            <div className="flex flex-col gap-1">
              <button
                className=" text-black text-[12px] text-left rounded px-1"
                onClick={() => {
                  deleteRow(contextMenu.rowId);
                  deleteSelectedRows();
                  handleCloseContextMenu();
                }}
              >
                Delete
              </button>
              <button
                className=" text-black text-[12px] text-left rounded px-1"
                onClick={() => {
                  handleDeleteAllRows();
                  handleCloseContextMenu();
                }}
              >
                Delete All
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PoItems;
