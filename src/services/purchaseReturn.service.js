import { PrismaClient } from "@prisma/client";
import { NoRecordFound } from "../configs/Responses.js";
import {
  exclude,
  getDateFromDateTime,
  getDateTimeRangeForCurrentYear,
  getYearShortCode,
} from "../utils/helper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";

const prisma = new PrismaClient();

async function getNextDocId(
  branchId,
  shortCode,
  startTime,
  endTime,
  saveType,
  docId,
  isUpdate,
) {
  // Case 1: Draft save
  if (saveType) {
    return "Draft Save";
  } else if (isUpdate === "drift") {
    lastObject = await prisma.purchaseInwardReturn.findFirst({
      where: {
        branchId: parseInt(branchId),
        draftSave: false,
        AND: [
          { createdAt: { gte: startTime } },
          { createdAt: { lte: endTime } },
        ],
      },
      orderBy: { id: "desc" },
    });
    const branchObj = await getTableRecordWithId(branchId, "branch");
    let newDocId = `${branchObj.branchCode}${getYearShortCode(
      new Date(),
    )}/PR/1`;

    if (lastObject) {
      newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PR/${
        parseInt(lastObject.docId.split("/").at(-1)) + 1
      }`;
    }

    return newDocId;
  } else {
    let lastObject = await prisma.purchaseInwardReturn.findFirst({
      where: {
        branchId: parseInt(branchId),
        AND: [
          {
            createdAt: {
              gte: startTime,
            },
          },
          {
            createdAt: {
              lte: endTime,
            },
          },
        ],
      },
      orderBy: {
        id: "desc",
      },
    });

    const branchObj = await getTableRecordWithId(branchId, "branch");
    let newDocId = `${branchObj.branchCode}${getYearShortCode(
      new Date(),
    )}/PR/1`;
    if (lastObject) {
      if (lastObject.docId === "Draft Save") {
        const records = await prisma.purchaseInwardReturn.findMany({
          select: {
            docId: true,
          },
          where: {
            branchId: parseInt(branchId),
            AND: [
              {
                createdAt: {
                  gte: startTime,
                },
              },
              {
                createdAt: {
                  lte: endTime,
                },
              },
            ],
          },
        });
        const maxDocId = records.reduce((max, current) => {
          const currentNo = Number(current.docId.split("/").pop());
          const maxNo = max ? Number(max.split("/").pop()) : 0;

          return currentNo > maxNo ? current.docId : max;
        }, null);
        newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PR/${
          parseInt(maxDocId.split("/").at(-1)) + 1
        }`;
      } else {
        newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PR/${
          parseInt(lastObject.docId.split("/").at(-1)) + 1
        }`;
      }
    }
    return newDocId;
  }
}

function manualFilterSearchData(searchBillDate, data) {
  return data.filter(
    (item) =>
      searchBillDate
        ? String(getDateFromDateTime(item.createdAt)).includes(searchBillDate)
        : true,
    // (searchSupplierDcDate ? String(getDateFromDateTime(item.dueDate)).includes(searchSupplierDcDate) : true)
    // (searchPurchaseBillNo ?String(item.purchaseBillId).includes(searchPurchaseBillNo) : true)
  );
}

async function get(req) {
  const {
    companyId,
    active,
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocId,
    searchBillDate,
    searchSupplierName,
  } = req.query;
  let data = await prisma.purchaseReturn.findMany({
    where: {
      companyId: companyId ? parseInt(companyId) : undefined,
      active: active ? Boolean(active) : undefined,
      docId: Boolean(searchDocId)
        ? {
            contains: searchDocId,
          }
        : undefined,
      supplier: {
        name: Boolean(searchSupplierName)
          ? { contains: searchSupplierName }
          : undefined,
      },
    },
  });
  data = manualFilterSearchData(searchBillDate, data);
  const totalCount = data.length;

  if (pagination) {
    data = data.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * dataPerPage,
    );
  }
  let newDocId = await getNextDocId(branchId);
  return { statusCode: 0, nextDocId: newDocId, data };
}

async function getOne(id) {
  const childRecord = 0;
  const data = await prisma.purchaseReturn.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      PoReturnItems: {
        select: {
          id: true,
          Product: {
            select: {
              name: true,
              ProductBrand: {
                select: {
                  name: true,
                },
              },
              ProductCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
          Uom: {
            select: {
              name: true,
            },
          },
          uomId: true,
          qty: true,
          poQty: true,
          stockQty: true,
          purchaseBillItemsId: true,
        },
      },
    },
  });
  if (!data) return NoRecordFound("purchaseReturn");
  data["PoReturnItems"] = await (async function getReturnQty() {
    const promises = data["PoReturnItems"].map(async (i) => {
      const sql = `
            SELECT COALESCE(SUM(QTY),0) as returnQty FROM PoReturnItems WHERE purchaseBillItemsId=${i.purchaseBillItemsId}
            `;
      console.log(sql);
      let returnQty = await prisma.$queryRawUnsafe(sql);
      i["alreadyReturnQty"] = returnQty[0]["returnQty"];
      return i;
    });
    return Promise.all(promises);
  })();
  return { statusCode: 0, data: { ...data, ...{ childRecord } } };
}

async function getSearch(req) {
  const { searchKey } = req.params;
  const { companyId, active } = req.query;
  const data = await prisma.purchaseReturn.findMany({
    where: {
      companyId: companyId ? parseInt(companyId) : undefined,
      active: active ? Boolean(active) : undefined,
      OR: [
        {
          name: {
            contains: searchKey,
          },
        },
      ],
    },
  });
  return { statusCode: 0, data: data };
}

async function create(req) {
  const {
    userId,
    branchId,
    storeId,
    docDate,
    supplierId,
    returnType,
    dcNo,
    dcDate,
    remarks,
    termsAndCondition,
    returnItems,
    finYearId,
    draftSave,
    locationId,
    invNo,
  } = await req.body;
  let finYearDate = await getFinYearStartTimeEndTime(finYearId);
  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(
        finYearDate?.startDateStartTime,
        finYearDate?.endDateEndTime,
      )
    : "";
  let newDocId = await getNextDocId(
    branchId,
    shortCode,
    finYearDate?.startDateStartTime,
    finYearDate?.endDateEndTime,
    draftSave,
  );
  let data;
  await prisma.$transaction(async (tx) => {
    data = await tx.purchaseInwardReturn.create({
      data: {
        docId: newDocId,
        docDate: docDate ? new Date(docDate) : null,
        createdById: parseInt(userId),
        branchId: parseInt(branchId),
        storeId: parseInt(storeId),
        supplierId: parseInt(supplierId),
        returnType,
        dcNo,
        dcDate: dcDate ? new Date(dcDate) : null,
        remarks,
        termsAndCondition,
        locationId: parseInt(locationId),
        invNo,
      },
    });
    await createReturnItems(
      tx,
      returnItems,
      data,
      userId,
      locationId,
      storeId,
      returnType,
      invNo,
    );
  });
  return { statusCode: 0, data };
}

async function createReturnItems(
  tx,
  returnItems,
  purchaseReturn,
  userId,
  locationId,
  storeId,
  returnType,
  invNo,
) {
  const promises = returnItems?.map(async (stockDetail, index) => {
    const createdItem = await tx.purchaseReturnItems.create({
      data: {
        purchaseInwardReturnId: parseInt(purchaseReturn.id),
        styleItemId: stockDetail?.styleItemId
          ? parseInt(stockDetail.styleItemId)
          : null,
        uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
        hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
        returnQty: stockDetail?.returnQty
          ? parseInt(stockDetail.returnQty)
          : null,
        returnType: returnType ? returnType : "",
        purchaseInwardId: stockDetail?.purchaseInwardId
          ? parseInt(stockDetail.purchaseInwardId)
          : null,
        invNo: invNo ? invNo : null,
        batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
      },
    });
    await tx.stock.create({
      data: {
        inOrOut: "Out",
        processName: "Purchase Return",
        createdById: parseInt(userId),
        branchId: parseInt(locationId),
        storeId: parseInt(storeId),
        purchaseReturnItemsId: createdItem.id,
        styleItemId: stockDetail?.styleItemId
          ? parseInt(stockDetail.styleItemId)
          : null,
        uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
        hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
        qty:  stockDetail?.returnQty && !isNaN(parseFloat(stockDetail.returnQty))
            ? -Math.abs(parseInt(stockDetail.returnQty))
            : null,
        returnType: returnType ? returnType : "",
        invNo: invNo ? invNo : null,
        batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
      },
    });
    return createdItem;
  });

  return Promise.all(promises);
}

async function updatePoReturnItems(tx, poReturnItems, purchaseReturn) {
  let removedItems = purchaseReturn.PoReturnItems.filter((oldItem) => {
    let result = poReturnItems.find((newItem) => newItem.id === oldItem.id);
    if (result) return false;
    return true;
  });

  let removedItemsId = removedItems.map((item) => parseInt(item.id));

  await tx.PoReturnItems.deleteMany({
    where: {
      id: {
        in: removedItemsId,
      },
    },
  });

  const promises = poReturnItems.map(async (item) => {
    if (item?.id) {
      return await tx.poReturnItems.update({
        where: {
          id: parseInt(item.id),
        },
        data: {
          qty: item?.qty ? parseFloat(item.qty) : 0.0,
          stockQty: item?.stockQty ? parseFloat(item.stockQty) : 0.0,
          uomId: item?.uomId ? parseInt(item.uomId) : undefined,

          Stock: {
            update: {
              inOrOut: "Out",
              productId: item?.productId ? parseInt(item.productId) : undefined,
              qty: 0 - parseFloat(item.qty),
              branchId: parseInt(purchaseReturn.branchId),
              stockQty: parseFloat(item.stockQty),
              uomId: item?.uomId ? parseInt(item.uomId) : undefined,
            },
          },
        },
      });
    } else {
      return await tx.poReturnItems.create({
        data: {
          purchaseReturnId: parseInt(purchaseReturn.id),
          productId: item?.productId ? parseInt(item.productId) : undefined,
          qty: item?.qty ? parseFloat(item.qty) : 0.0,
          poQty: item?.poQty ? parseFloat(item.poQty) : 0.0,
          purchaseBillItemsId: parseInt(item.purchaseBillItemsId),
          uomId: item?.uomId ? parseInt(item.uomId) : undefined,
          stockQty: item?.stockQty ? parseFloat(item.stockQty) : undefined,

          Stock: {
            create: {
              inOrOut: "Out",
              productId: item?.productId ? parseInt(item.productId) : undefined,
              qty: 0 - parseFloat(item.qty),
              branchId: parseInt(purchaseReturn.branchId),
              uomId: item?.uomId ? parseInt(item.uomId) : undefined,
            },
          },
        },
      });
    }
  });
  return Promise.all(promises);
}

async function update(id, body) {
  let data;
  const {
    supplierId,
    dueDate,
    address,
    place,
    poReturnItems,
    companyId,
    branchId,
    purchaseBillId,
    active,
  } = await body;
  const dataFound = await prisma.purchaseReturn.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!dataFound) return NoRecordFound("purchaseReturn");
  await prisma.$transaction(async (tx) => {
    data = await tx.purchaseReturn.update({
      where: {
        id: parseInt(id),
      },
      data: {
        address,
        place,
        supplierId: parseInt(supplierId),
        companyId: parseInt(companyId),
        active,
        // dueDate: dueDate ? new Date(dueDate) : undefined,
        branchId: parseInt(branchId),
        purchaseBillId: parseInt(purchaseBillId),
      },
      include: {
        PoReturnItems: true,
      },
    });
    await updatePoReturnItems(tx, poReturnItems, data);
  });
  return { statusCode: 0, data };
}

async function remove(id) {
  const data = await prisma.purchaseReturn.delete({
    where: {
      id: parseInt(id),
    },
  });
  return { statusCode: 0, data };
}



export { get, getOne, getSearch, create, update, remove  };
