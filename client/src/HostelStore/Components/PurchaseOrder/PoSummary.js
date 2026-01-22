import React from "react";
import { discountTypes } from "../../../Utils/DropdownData";
import { numberToWords } from "number-to-words";
import { useEffect } from "react";

const PoSummary = ({
  poItems = [],
  readOnly,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  taxPercent,
  setTaxPercent,
}) => {
  // =================== CALCULATIONS ===================

  // 1️⃣ GROSS = price * qty
  const grossAmount = poItems.reduce(
    (sum, row) =>
      sum + (Number(row.price) || 0) * (Number(row.qty) || 0),
    0
  );

  // 2️⃣ TAX %
  const taxRate = Number(taxPercent) || 0;
  const sgstValue = taxRate / 2;
  const cgstValue = taxRate / 2;

  // 3️⃣ SGST & CGST AMOUNT
  const sgstAmount = (grossAmount * sgstValue) / 100;
  const cgstAmount = (grossAmount * cgstValue) / 100;

  // 4️⃣ TAXABLE AMOUNT
  const taxableAmount = grossAmount + sgstAmount + cgstAmount;

  // 5️⃣ DISCOUNT (OVERALL ONLY)
  const discountValueNum = Number(discountValue) || 0;


  

  let discountAmount = 0;
  if (discountType === "Flat") {
    discountAmount = discountValueNum;
  } else if (discountType === "Percentage") {
    discountAmount = (taxableAmount * discountValueNum) / 100;
  }

    useEffect(() => {
      console.log(discountType,"discountType")
   console.log(discountValueNum,"discountValueNum")
   console.log(discountAmount,"discountAmount")
  }, [discountValue])

  // 6️⃣ NET & ROUNDING
  const netValue = taxableAmount - discountAmount;
  const netAmount = Math.round(netValue);
  const roundoff = netAmount - netValue;

  // =================== UI ===================
  return (
    <div className="bg-gray-200 rounded w-[500px]">
      <table className="border border-gray-500 w-full text-xs table-fixed">
        <thead>
          <tr className="bg-gray-300">
            <th className="border border-gray-500 p-1">Tax Name</th>
            <th className="border border-gray-500 p-1">Value</th>
            <th className="border border-gray-500 p-1">Amount</th>
          </tr>
        </thead>

        <tbody>
          {/* TAX % */}
          <tr>
            <td className="border border-gray-500">Tax %</td>
            <td colSpan={2} className="border border-gray-500">
              <input
                type="number"
                disabled={readOnly}
                className="w-full h-7 text-right"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
              />
            </td>
          </tr>

          {/* DISCOUNT TYPE */}
          <tr>
            <td className="border border-gray-500">Discount Type</td>
            <td colSpan={2} className="border border-gray-500">
              <select
                disabled={readOnly}
                value={discountType}
                className="w-full h-8"
                onChange={(e) => setDiscountType(e.target.value)}
              >
                {discountTypes.map((d, i) => (
                  <option key={i} value={d.value}>
                    {d.show}
                  </option>
                ))}
              </select>
            </td>
          </tr>

          {/* DISCOUNT VALUE */}
          <tr>
            <td className="border border-gray-500">Discount</td>
            <td colSpan={2} className="border border-gray-500">
              <input
                type="number"
                disabled={readOnly}
                className="w-full h-7 text-right"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </td>
          </tr>

          {/* GROSS */}
          <tr>
            <td className="border border-gray-500 font-semibold">Gross</td>
            <td />
            <td className="border border-gray-500 text-right">
              {grossAmount.toFixed(2)}
            </td>
          </tr>

          {/* SGST */}
          <tr>
            <td className="border border-gray-500 font-semibold">SGST</td>
            <td className="border border-gray-500 text-right">
              {sgstValue}
            </td>
            <td className="border border-gray-500 text-right">
              {sgstAmount.toFixed(2)}
            </td>
          </tr>

          {/* CGST */}
          <tr>
            <td className="border border-gray-500 font-semibold">CGST</td>
            <td className="border border-gray-500 text-right">
              {cgstValue}
            </td>
            <td className="border border-gray-500 text-right">
              {cgstAmount.toFixed(2)}
            </td>
          </tr>

          {/* TAXABLE */}
          <tr>
            <td className="border border-gray-500 font-semibold">Taxable</td>
            <td className="border border-gray-500 text-right">
              
            </td>
            <td className="border border-gray-500 text-right">
              {taxableAmount.toFixed(2)}
            </td>
          </tr>

          {/* DISCOUNT AMOUNT */}
          <tr>
            <td className="border border-gray-500 font-semibold">
              Discount Amount
            </td>
          <td className="border border-gray-500 text-right">
              
            </td>
            <td className="border border-gray-500 text-right">
              {discountAmount.toFixed(2)}
            </td>
          </tr>

          {/* NET */}
          <tr>
            <td className="border border-gray-500 font-semibold">Net</td>
           <td className="border border-gray-500 text-right">
              
            </td>
            <td className="border border-gray-500 text-right">
              {netAmount.toFixed(2)}
            </td>
          </tr>

          {/* ROUNDOFF */}
          <tr>
            <td className="border border-gray-500 font-semibold">Roundoff</td>
           <td className="border border-gray-500 text-right">
              
            </td>
            <td className="border border-gray-500 text-right">
              {roundoff.toFixed(2)}
            </td>
          </tr>

          {/* AMOUNT IN WORDS */}
          <tr>
            <td className="border border-gray-500 font-semibold">
              Amount in Words
            </td>
            <td colSpan={2} className="border border-gray-500 text-right">
              {numberToWords.toWords(netAmount)} Only
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PoSummary;
