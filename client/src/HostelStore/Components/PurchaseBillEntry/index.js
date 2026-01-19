  import React, { useEffect, useState, useRef, useCallback } from "react";
  import secureLocalStorage from "react-secure-storage";

  import FormHeader from "../../../Basic/components/FormHeader";
  import FormReport from "../../../Basic/components/FormReportTemplate";
  import { toast } from "react-toastify";
  import {
    TextInput,
    CheckBox,
    DropdownInput,
    DisabledInput,
    LongDisabledInput,
    DateInput,
  } from "../../../Inputs";
  import DatePicker from 'react-datepicker';

  import ReportTemplate from "../../../Basic/components/ReportTemplate";
  import {
    useGetPurchaseBillQuery,
    useGetPurchaseBillByIdQuery,
    useAddPurchaseBillMutation,
    useUpdatePurchaseBillMutation,
    useDeletePurchaseBillMutation,
  } from "../../../redux/services/PurchaseBillService";

  import { useGetProductBrandQuery } from "../../../redux/services/ProductBrandService";
  import { useGetProductCategoryQuery } from "../../../redux/services/ProductCategoryServices";
  import { dropDownListObject } from "../../../Utils/contructObject";
  import { getDateFromDateTime, isGridDatasValid } from "../../../Utils/helper";
  import {
    useGetPartyByIdQuery,
    useGetPartyQuery,
  } from "../../../redux/services/PartyMasterService";
  import { Loader } from "../../../Basic/components";
  import PoBillItems from "./PoBillItems";
  import Modal from "../../../UiComponents/Modal";
  import PurchaseBillFormReport from "./PurchaseBillFormReport";
  import moment from "moment";
  import { useGetStockQuery } from "../../../redux/services/StockService";
  import { PDFViewer } from "@react-pdf/renderer";
  import tw from "../../../Utils/tailwind-react-pdf";
  import { RetailPrintFormatFinishedGoodsPurchase } from "..";
  import PrintReportOpen from "./PrintReportOpen";

  const MODEL = "Purchase Bill Entry";

  export default function Form() {
    const today = new Date();
    const [form, setForm] = useState(true);
    const [date, setDate] = useState(getDateFromDateTime(today));
    const [docId, setDocId] = useState("");
    const [address, setAddress] = useState("");
    const [printReportOpen, setPrintReportOpen] = useState(false);

    const [contactMobile, setContactMobile] = useState("");
    const [place, setPlace] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [charge, setCharge] = useState();
    const [formReport, setFormReport] = useState(false);
    const [icePrice, seticePrice] = useState("");
    const [packingCharge, setPackingCharge] = useState("");
    const [labourCharge, setLabourCharge] = useState("");
    const [tollgate, setTollgate] = useState("");
    const [transport, setTransport] = useState("");
    const [ourPrice, setOurPrice] = useState("");
    const [discount, setDiscout] = useState("");
    const [readOnly, setReadOnly] = useState(false);
    const [id, setId] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [supplierDcNo, setSupplierDcNo] = useState("");
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [active, setActive] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    const [netBillValue, setNetBillValue] = useState("");

    const [searchValue, setSearchValue] = useState("");
    const [poBillItems, setPoBillItems] = useState([]);

    const childRecord = useRef(0);

    const branchId = secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "currentBranchId"
    );

    function handleInputChange(value, index, field) {
      const newBlend = structuredClone(poBillItems);
      newBlend[index][field] = value;
      setPoBillItems(newBlend);
    }

    useEffect(() => {
      const totalCharge =
        Number(icePrice) +
        Number(packingCharge) +
        Number(labourCharge) +
        Number(tollgate) +
        Number(transport);

      setCharge(totalCharge);
    }, [icePrice, packingCharge, labourCharge, tollgate, transport]);
    const params = {
      companyId: secureLocalStorage.getItem(
        sessionStorage.getItem("sessionId") + "userCompanyId"
      ),
    };

    const {
      data: allData,
      isLoading,
      isFetching,
    } = useGetPurchaseBillQuery({
      params: { branchId },
      searchParams: searchValue,
    });
    const {
      data: singleData,
      isFetching: isSingleFetching,
      isLoading: isSingleLoading,
    } = useGetPurchaseBillByIdQuery(id, { skip: !id });

    const [addData] = useAddPurchaseBillMutation();
    const [updateData] = useUpdatePurchaseBillMutation();
    const [removeData] = useDeletePurchaseBillMutation();

    const { data: productBrandList } = useGetProductBrandQuery({ params });

    const { data: supplierList } = useGetPartyQuery({ params });

    const { data: stockList } = useGetStockQuery({ params: { branchId } });

    const {
      data: singleSupplier,
      isFetching: isSingleSupplierFetching,
      isLoading: isSingleSupplierLoading,
    } = useGetPartyByIdQuery(supplierId, { skip: !supplierId });

    const { data: productCategoryList } = useGetProductCategoryQuery({ params });

    const getNextDocId = useCallback(() => {
      if (id) return;
      if (allData?.nextDocId) {
        setDocId(allData.nextDocId);
      }
    }, [allData, isLoading, isFetching, id]);

    useEffect(getNextDocId, [getNextDocId]);

    const syncFormWithDb = useCallback(
      (data) => {
        if (id) setReadOnly(true);
        else setReadOnly(false);
        if (data?.createdAt)
          setDate(moment.utc(data?.createdAt).format("YYYY-MM-DD"));
        if (data?.docId) {
          setDocId(data.docId);
        }
        seticePrice(data?.icePrice ? data?.icePrice : "");
        setPackingCharge(data?.packingCharge ? data?.packingCharge : "");
        setLabourCharge(data?.labourCharge ? data?.labourCharge : "");
        setTollgate(data?.tollgate ? data?.tollgate : "");
        setTransport(data?.transport ? data?.transport : "");
        setOurPrice(data?.ourPrice ? data?.ourPrice : "");
        setActive(id ? (data?.active ? data.active : false) : true);
        setSelectedDate(data?. selectedDate? moment.utc(data?.selectedDate).format("YYYY-MM-DD") : "")

        setSupplierId(data?.supplierId ? data?.supplierId : "");
        setAddress(data?.address ? data.address : "");
        setPlace(data?.place ? data.place : "");
        setPoBillItems(data?.PoBillItems ? data.PoBillItems : []);
        setDueDate(
          data?.dueDate ? moment.utc(data?.dueDate).format("YYYY-MM-DD") : ""
        );
        setNetBillValue(data?.netBillValue ? data.netBillValue : 0);
        setSupplierDcNo(data?.supplierDcNo ? data?.supplierDcNo : "");
        childRecord.current = data?.childRecord ? data?.childRecord : 0;
        seticePrice(data?.icePrice ? data?.icePrice : 0);
        setPackingCharge(data?.packingCharge ? data?.packingCharge : 0);
        setLabourCharge(data?.labourCharge ? data?.labourCharge : 0);
        setTollgate(data?.tollgate ? data?.tollgate : 0);
        setTransport(data?.transport ? data?.transport : 0);
      },
      [id]
    );

    useEffect(() => {
      syncFormWithDb(singleData?.data);
    }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

    const data = {
      branchId,
      supplierId,
      supplierDcNo,
      dueDate,
      address,
      place,
      netBillValue,
      icePrice,
      selectedDate,
      packingCharge,
      labourCharge,
      tollgate,
      transport,
      ourPrice,
      poBillItems: poBillItems.filter((item) => item.qty != 0 && item.price != 0),
      companyId: secureLocalStorage.getItem(
        sessionStorage.getItem("sessionId") + "userCompanyId"
      ),
      active,
      id,
    };

    // const validateData = (data) => {
    //   if (data.supplierId && data.poBillItems.length > 0 &&
    //      isGridDatasValid(data.poBillItems, false, ["qty"])) {
    //     return true;
    //   }
    //   return false;
    // }

    const validateData = (data) => {
      if (data.supplierId && data.poBillItems.length > 0) {
        return true;
      }
      return false;
    };

    function getTotal(field1, field2) {
      const total = poBillItems.reduce((accumulator, current) => {
        return (
          accumulator +
          parseFloat(
            current[field1] && current[field2]
              ? current[field1] * current[field2]
              : 0
          )
        );
      }, 0);
      return parseFloat(total);
    }

    const validateNetBillValue = () => {
      if (
        getTotal("qty", "price").toFixed(2) ===
        parseFloat(netBillValue).toFixed(2)
      ) {
        return true;
      }
      return false;
    };

    const handleSubmitCustom = async (callback, data, text) => {
      try {
        let returnData = await callback(data).unwrap();
        if (returnData.statusCode === 0) {
          setId("");
          syncFormWithDb(undefined);
          setPrintReportOpen(true);
          toast.success(text + "Successfully");
        } else {
          toast.error(returnData?.message);
        }
      } catch (error) {
        console.log("handle");
      }
    };

    const saveData = () => {
      if (!validateData(data)) {
        toast.info("Please fill all required fields...!", {
          position: "top-center",
        });
        return;
      }
      if (!validateNetBillValue()) {
        toast.info("Net Bill Value Not Matching Total Amount...!", {
          position: "top-center",
        });
        return;
      }
      if (!window.confirm("Are you sure save the details ...?")) {
        return;
      }
      if (id) {
        handleSubmitCustom(updateData, data, "Updated");
      } else {
        handleSubmitCustom(addData, data, "Added");
      }
    };

    const deleteData = async () => {
      if (id) {
        if (!window.confirm("Are you sure to delete...?")) {
          return;
        }
        try {
          await removeData(id).unwrap();
          setId("");
          toast.success("Deleted Successfully");
        } catch (error) {
          toast.error("something went wrong");
        }
      }
    };

    const handleKeyDown = (event) => {
      let charCode = String.fromCharCode(event.which).toLowerCase();
      if ((event.ctrlKey || event.metaKey) && charCode === "s") {
        event.preventDefault();
        saveData();
      }
    };
    const handlePrint = () => {
      setPrintModalOpen(true);
    };

    const onNew = () => {
      setId("");
      getNextDocId();
      setReadOnly(false);
      setForm(true);
      setSearchValue("");
      syncFormWithDb(undefined);
    };

    function onDataClick(id) {
      setId(id);
      onNew();
      setForm(true);
    }
    const tableHeaders = ["Code", "Name", "Status"];
    const tableDataNames = [
      "dataObj.code",
      "dataObj.name",
      "dataObj.active ? ACTIVE : INACTIVE",
    ];

    if (!supplierList || isSingleSupplierFetching || isSingleSupplierLoading)
      return <Loader />;

    if (!form)
      return (
        <ReportTemplate
          heading={MODEL}
          tableHeaders={tableHeaders}
          tableDataNames={tableDataNames}
          loading={isLoading || isFetching}
          setForm={setForm}
          data={allData?.data}
          onClick={onDataClick}
          onNew={onNew}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      );
    console.log(singleData, "singleData");

    return (
      <div
        onKeyDown={handleKeyDown}
        className="md:items-start md:justify-items-center grid h-full bg-theme"
      >
        <Modal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          widthClass={"w-[90%] h-[90%]"}
        >
          <PDFViewer style={tw("w-full h-full")}>
            <RetailPrintFormatFinishedGoodsPurchase
              contactMobile={contactMobile}
              data={id ? singleData?.data : "Null"}
              date={id ? singleData?.data?.selectedDate : date}
              id={id}
              poBillItems={poBillItems}
              docId={docId ? docId : ""}
            />
          </PDFViewer>
        </Modal>
        <Modal
          isOpen={formReport}
          onClose={() => setFormReport(false)}
          widthClass={"px-2 h-[90%] w-[90%]"}
        >
          <PurchaseBillFormReport
            onClick={(id) => {
              setId(id);
              setFormReport(false);
            }}
          />
        </Modal>
        <Modal
          isOpen={printReportOpen}
          onClose={() => setPrintReportOpen(false)}
          widthClass={"px-2 h-[20%] w-[35%]"}
        >
          <PrintReportOpen
            setPrintModalOpen={setPrintModalOpen}
            printModalOpen={printModalOpen}
          />
        </Modal>
        <div className="flex flex-col frame w-full h-full">
          <FormHeader
            onNew={onNew}
            model={MODEL}
            openReport={() => setFormReport(true)}
            saveData={saveData}
            setReadOnly={setReadOnly}
            deleteData={deleteData}
            //   onClose={() => {setForm(false);
            onPrint={id ? handlePrint : null}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-x-2 overflow-clip">
            <div className="col-span-4 grid md:grid-cols-1 border overflow-auto">
              <div className="mr-1 md:ml-2">
                <fieldset className="frame my-1">
                  <legend className="sub-heading">Product Info</legend>
                  <div className="grid grid-cols-4 my-2">
                    <DisabledInput
                      name="Trans.No"
                      value={docId}
                      required={true}
                      readOnly={readOnly}
                    />
                    <DisabledInput
                      name="Trans. 
                            Date"
                      value={date}
                      type={"Date"}
                      required={true}
                      readOnly={readOnly}
                    />
                    <DropdownInput
                      name="Supplier"
                      options={dropDownListObject(
                        id
                          ? supplierList.data
                          : supplierList.data
                              .filter((value) => value.isSupplier)
                              .filter((item) => item.active),
                        "name",
                        "id"
                      )}
                      value={supplierId}
                      setValue={setSupplierId}
                      required={true}
                      readOnly={readOnly}
                      disabled={childRecord.current > 0}
                    />
                    {/* <LongDisabledInput name="Address" value={address} required={true} readOnly={readOnly} />
                    <DisabledInput name="Place" value={place} required={true} readOnly={readOnly} /> */}
                    <TextInput
                      name="Sup.Dc.No"
                      type="text"
                      value={supplierDcNo}
                      setValue={setSupplierDcNo}
                      required={true}
                      readOnly={readOnly}
                      disabled={childRecord.current > 0}
                    />

                    <DateInput
                      name="Sup.Dc. Date"
                      value={dueDate}
                      setValue={setDueDate}
                      required={true}
                      readOnly={readOnly}
                    />
            
                    <TextInput
                      name={"PackingCharge"}
                      value={packingCharge}
                      setValue={setPackingCharge}
                      readOnly={readOnly}
                      required
                    />
                    <TextInput
                      name={"LabourCharge"}
                      value={labourCharge}
                      setValue={setLabourCharge}
                      readOnly={readOnly}
                      required
                    />
                    <TextInput
                      name={"Tollgate"}
                      value={tollgate}
                      setValue={setTollgate}
                      readOnly={readOnly}
                      required
                    />
                    <TextInput
                      name={"Transport"}
                      value={transport}
                      setValue={setTransport}
                      readOnly={readOnly}
                      required
                    />
                            <TextInput
                      name={"Comisson Amt"}
                      value={icePrice}
                      setValue={seticePrice}
                      readOnly={readOnly}
                      required
                    />
                    <TextInput
                      name={"Our Price"}
                      value={ourPrice}
                      setValue={setOurPrice}
                      readOnly={readOnly}
                      required
                    />
                    <DisabledInput
                      name={"Discount"}
                      value={ourPrice - netBillValue}
                      readOnly={readOnly}
                      required
                    />
                    <TextInput
                      name={"NetBillValue"}
                      value={netBillValue}
                      setValue={setNetBillValue}
                      readOnly={readOnly}
                      required
                    />
                    <DisabledInput
                      name="TotalAnother Charge"
                      value={charge}
                      required={true}
                      readOnly={readOnly}
                    />
                    <DisabledInput
                      name="TotalPaid Amount"
                      className="text-red-800 font-bold "
                      value={(Number(ourPrice) + Number(charge)).toFixed(2)}
                      textClassName = "text-blue-700"
                      required={true}
                      readOnly={readOnly}
                    />
       <div className="flex items-center space-x-20">
  <label className=" text-right font-xs ">
    Date:
  </label>
  <DatePicker
    selected={selectedDate}
    onChange={(date) => setSelectedDate(date)}
    readOnly={readOnly}
    dateFormat="MMMM d, yyyy"
    className="w-56 py-1 border border-2 h-6 text-xs ml-3 border-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholderText="Choose a date"
  />
</div>


                  </div>
                </fieldset>
                <fieldset className="frame rounded-tr-lg rounded-bl-lg rounded-br-lg my-1 w-full border border-gray-400 md:pb-5 flex flex-1 overflow-auto">
                  <legend className="sub-heading">Purchase-Bill-Details</legend>
                  <PoBillItems
                    handleInputChange={handleInputChange}
                    id={id}
                    readOnly={readOnly}
                    poBillItems={poBillItems}
                    setPoBillItems={setPoBillItems}
                    singleData={singleData}
                  />
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
