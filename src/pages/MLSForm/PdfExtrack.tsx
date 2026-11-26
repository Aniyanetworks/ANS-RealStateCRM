// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState } from "react";
import { baseUrl } from "../../utils/constant";

import BasicInfo from "../../components/Property/BasicInfo";
import PropertyDetails from "../../components/Property/PropertyDetails";
import SellerInfo from "../../components/Property/SellerInfo";
import TableLoader from "../../components/loader/TableLoader";
import ExtraInfo from "../../components/Property/ExtraInfo";
import FooterInfo from "../../components/Property/FooterInfo";
import Table1 from "../../components/Property/Table1";
import Table2 from "../../components/Property/Table2";
import { searchSingleString } from "../../utils/searchString";

const basicInfo = [
  "prepared_by",
  "brokerage",
  "printed_on",
  "address",
  "sold_price",
  "location",
  "listing_price",
  "area",
  "taxes",
  "sale_status",
  "difference_percentage",
  "spis",
  "last_status",
  "legal_description",
  "city",
  "property_type",
  "fronting_on",
  "rooms",
  "link_property",
  "acreage",
  "bedrooms",
  "style",
  "lot_size",
  "washrooms",
  "washroom_details",
  "irregular_lot",
  "direction",
];

const propertyDetails = [
  "property_type",
  "fronting_on",
  "rooms",
  "link_property",
  "acreage",
  "bedrooms",
  "style",
  "lot_size",
  "washrooms",
  "washroom_details",
  "irregular_lot",
  "direction",
];

const sellerInfo = [
  "mls_number",
  "seller",
  "occupancy",
  "pin",
  "arn",
  "contact_after_expiry",
  "holdover",
];

type InfoType = {
  name: string;
  text: string;
}[];

type Table2Type = {
  Text: string;
}[];

const PdfExtrack = () => {
  // state definition

  const [basicInfoData, setBasicInfoData] = useState<InfoType>([]);
  const [propertyDetailsData, setPropertyDetailsData] = useState<InfoType>([]);
  const [sellerInfoData, setSellerInfoData] = useState<InfoType>([]);

  const [table1Data, setTable1Data] = useState<any>([]);
  const [table2Data, setTable2Data] = useState<Table2Type>([]);
  const [footerComponentData, setFooterComponentData] = useState({});
  const [clientData, setClientData] = useState<
    | {
        client_remarks: string;
        extras: string;
        inclusions: string;
        exclusions: string;
        rental_items: string;
      }
    | object
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pdfData, setPdfData] = useState([]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("attachment", file);

    try {
      const response = await fetch(
        `${baseUrl}api/v1/agent/trade-sheet-management/fileAttachmentExtraction`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "x-api-key":
              "xotiwag925@avzong.com_11IHSUrZhAcY0R7FLLMazRf46u0ZzfjAl7yv3pTMFrvnpsh9Loxs9XqAuFynp4qq",
          },
          body: formData,
        }
      );
      const responseData = await response.json();
      setIsLoading(false);

      const extractedData = responseData.data.textractData;
      setPdfData(extractedData);

      const table2Data = getTable2Data(
        extractedData,
        "# Room",
        "Client Remks:"
      );

      setTable2Data(table2Data);

      const basicInfoData = parseTextractDataWithNames(
        responseData.data.textractData.slice(0, 16),
        basicInfo
      );

      const propertyDetailsData = parseTextractDataWithNames(
        responseData.data.textractData.slice(16, 28),
        propertyDetails
      );

      const sellerInfoData = parseTextractDataWithNames(
        responseData.data.textractData.slice(28, 35),
        sellerInfo
      );

      //plain texts
      const clientRemarks = getTable2Data(
        extractedData,
        "Client Remks:",
        "Extras:"
      );
      const extraRemarks = getTable2Data(
        extractedData,
        "Extras:",
        "Inclusions:"
      );
      const inclusionData = getTable2Data(
        extractedData,
        "Inclusions:",
        "Exclusions:"
      );
      const exclusionData = getTable2Data(
        extractedData,
        "Exclusions:",
        "Rental Items:"
      );
      const rentalData = getTable2Data(
        extractedData,
        "Rental Items:",
        "Showing Requirements:"
      );
      const requirementData = getTable2Data(
        extractedData,
        "Showing Requirements:",
        "Brkage Remks:"
      );
      const brokarageData = getTable2Data(
        extractedData,
        "Brkage Remks:",
        "List:"
      );

      const coOp = getTable2Data(extractedData, "Co-Op:", "Contract Date:");
      const contractDate = getTable2Data(
        extractedData,
        "Contract Date:",
        "Sold Date:"
      );
      const soldDate = getTable2Data(
        extractedData,
        "Sold Date:",
        "Leased Terms:"
      );
      const leasedTerm = getTable2Data(
        extractedData,
        "Leased Terms:",
        "Expiry Date:"
      );
      const expiryDate = getTable2Data(
        extractedData,
        "Expiry Date:",
        "Closing Date:"
      );
      const closingDate = getTable2Data(
        extractedData,
        "Closing Date:",
        "Original:"
      );
      const Original = getTable2Data(
        extractedData,
        "Original:",
        "Last Update:"
      );
      const lastUpdate = getTable2Data(
        extractedData,
        "Last Update:",
        "CB Comm:"
      );
      const cbComm = getTable2Data(extractedData, "CB Comm:", "Toronto ");

      const clientText = clientRemarks.map((obj) => obj?.Text).join(" ");
      const extras = extraRemarks?.map((obj) => obj?.Text).join(" ");
      const inclusion = inclusionData?.map((obj) => obj?.Text).join(" ");
      const exclution = exclusionData?.map((obj) => obj?.Text).join(" ");
      const rental = rentalData?.map((obj) => obj?.Text).join(" ");
      const requirement = requirementData?.map((obj) => obj?.Text).join(" ");
      const brokarage = brokarageData?.map((obj) => obj?.Text).join(" ");
      const coOpData = coOp?.map((obj) => obj?.Text).join(" ");
      const contractDateData = contractDate?.map((obj) => obj?.Text).join(" ");
      const soldDateDate = soldDate?.map((obj) => obj?.Text).join(" ");
      const leasedTermData = leasedTerm?.map((obj) => obj?.Text).join(" ");
      const expiryDateData = expiryDate?.map((obj) => obj?.Text).join(" ");
      const closingDateData = closingDate?.map((obj) => obj?.Text).join(" ");
      const originalPrice = Original?.map((obj) => obj?.Text).join(" ");
      const lastUpdateDate = lastUpdate?.map((obj) => obj?.Text).join(" ");
      const cbCommData = cbComm?.map((obj) => obj?.Text).join(" ");

      const clientData = {
        client_remarks: clientText,
        extras: extras,
        inclusions: inclusion,
        exclusions: exclution,
        rental_items: rental,
        requirement: requirement,
        brokarage: brokarage,
      };

      const footerDate = {
        coOp: coOpData,
        contractDate: contractDateData,
        soldDate: soldDateDate,
        leasedTerm: leasedTermData,
        expiryDate: expiryDateData,
        closingDate: closingDateData,
        originalPrice: originalPrice,
        lastUpdate: lastUpdateDate,
        cbComm: cbCommData,
      };

      const spis = searchSingleString(extractedData, "SPIS:");

      console.log(spis);

      //first table data
      const kitchen = getTable2Data(extractedData, "Kitchens:", "Exterior:");
      const kitchenData = kitchen.map((obj) => obj?.Text).join(" ");

      const exterior = getTable2Data(extractedData, "Exterior:", "Zoning:");
      const exteriorData = exterior.map((obj) => obj?.Text).join(" ");

      const zoning = getTable2Data(extractedData, "Zoning:", "Fam Rm:");
      const zoningData = zoning.map((obj) => obj?.Text).join(" ");

      const famRm = getTable2Data(extractedData, "Fam Rm:", "Drive:");
      const famRmData = famRm.map((obj) => obj?.Text).join(" ");

      const drive = getTable2Data(extractedData, "Drive:", "Cable TV:");
      const driveData = drive.map((obj) => obj?.Text).join(" ");

      const cableTv = getTable2Data(extractedData, "Cable TV:", "Hydro:");
      const cableTvData = cableTv.map((obj) => obj?.Text).join(" ");

      const hydro = getTable2Data(extractedData, "Hydro:", "Basement:");
      const hydroData = hydro.map((obj) => obj?.Text).join(" ");

      const basement = getTable2Data(
        extractedData,
        "Basement:",
        "Gar/Gar Spcs:"
      );
      const basementData = basement.map((obj) => obj?.Text).join(" ");

      const garGarSpcs = getTable2Data(extractedData, "Gar/Gar Spcs:", "Gas:");
      const garGarSpcsData = garGarSpcs.map((obj) => obj?.Text).join(" ");

      const gas = getTable2Data(extractedData, "Gas:", "Phone:");
      const gasData = gas.map((obj) => obj?.Text).join(" ");

      const phone = getTable2Data(extractedData, "Phone:", "Fireplace/Stv:");
      const phoneData = phone.map((obj) => obj?.Text).join(" ");

      const stv = getTable2Data(
        extractedData,
        "Fireplace/Stv:",
        "Drive Pk Spcs:"
      );
      const stvData = stv.map((obj) => obj?.Text).join(" ");

      const drivePakSpcs = getTable2Data(
        extractedData,
        "Drive Pk Spcs:",
        "Water:"
      );
      const drivePakSpcsData = drivePakSpcs.map((obj) => obj?.Text).join(" ");

      const water = getTable2Data(extractedData, "Water:", "Heat:");
      const waterData = water.map((obj) => obj?.Text).join(" ");

      const heat = getTable2Data(extractedData, "Heat:", "Tot Pk Spcs:");
      const heatData = heat.map((obj) => obj?.Text).join(" ");

      const tPS = getTable2Data(extractedData, "Tot Pk Spcs:", "Water Supply:");
      const tPSData = tPS.map((obj) => obj?.Text).join(" ");

      const waterSupply = getTable2Data(extractedData, "Water Supply:", "A/C:");
      const waterSupplyData = waterSupply.map((obj) => obj?.Text).join(" ");

      const aC = getTable2Data(extractedData, "A/C:", "UFFI:");
      const aCData = aC.map((obj) => obj?.Text).join(" ");

      const uFFI = getTable2Data(extractedData, "UFFI:", "Sewer:");
      const uFFIData = uFFI.map((obj) => obj?.Text).join(" ");

      const sewer = getTable2Data(extractedData, "Sewer:", "Central Vac:");
      const sewerData = sewer.map((obj) => obj?.Text).join(" ");

      const centralVac = getTable2Data(extractedData, "Central Vac:", "Pool:");
      const centralVacData = centralVac.map((obj) => obj?.Text).join(" ");

      const pool = getTable2Data(extractedData, "Pool:", "Retirement:");
      const poolData = pool.map((obj) => obj?.Text).join(" ");

      const retirement = getTable2Data(
        extractedData,
        "Retirement:",
        "Apx Age:"
      );
      const retirementData = retirement.map((obj) => obj?.Text).join(" ");

      const apxAge = getTable2Data(extractedData, "Apx Age:", "Prop Feat:");
      const apxAgeData = apxAge.map((obj) => obj?.Text).join(" ");

      const propFeat = getTable2Data(extractedData, "Prop Feat:", "Farm/Agr:");
      const propFeatData = propFeat.map((obj) => obj?.Text).join(" ");

      const farmAgr = getTable2Data(extractedData, "Farm/Agr:", "Apx Sqft:");
      const farmAgrData = farmAgr.map((obj) => obj?.Text).join(" ");

      console.log(extractedData);

      const table1Data = {
        kitchen: kitchenData,
        exterior: exteriorData,
        zoning: zoningData,
        famRm: famRmData,
        drive: driveData,
        cableTv: cableTvData,
        hydro: hydroData,
        basement: basementData,
        garGarSpcs: garGarSpcsData,
        gas: gasData,
        phone: phoneData,
        stv: stvData,
        drivePakSpcs: drivePakSpcsData,
        water: waterData,
        heat: heatData,
        tPS: tPSData,
        waterSupply: waterSupplyData,
        aC: aCData,
        uFFI: uFFIData,
        sewer: sewerData,
        centralVac: centralVacData,
        pool: poolData,
        retirement: retirementData,
        apxAge: apxAgeData,
        propFeat: propFeatData,
        farmAgr: farmAgrData,
      };

      setTable1Data(table1Data);

      setClientData(clientData);
      setFooterComponentData(footerDate);

      setBasicInfoData(basicInfoData);
      setPropertyDetailsData(propertyDetailsData);
      setSellerInfoData(sellerInfoData);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  const parseTextractDataWithNames = (
    blocks: { BlockType: string; Text: string }[],
    predefinedNames: string[]
  ) => {
    let nameIndex = 0; // Keep track of the name assignment
    return blocks
      .filter(
        (block: { BlockType: string; Text: string }) =>
          block.BlockType === "LINE"
      ) // Focus on LINE blocks
      .map((block: { BlockType: string; Text: string }) => {
        const text = block.Text || "Unnamed"; // Use block.Text or fallback to "Unnamed"
        const name = predefinedNames[nameIndex] || "Unnamed"; // Use predefined name or fallback
        nameIndex++; // Increment index for the next name
        return {
          name: name,
          text: text,
        };
      });
  };

  const getTable2Data = (
    data: { Text: string }[],
    startString: string,
    endString: string
  ) => {
    const startIndex = data.findIndex((obj: { Text: string }) =>
      obj?.Text?.startsWith(startString)
    );
    const endIndex = data.findIndex((obj: { Text: string }) =>
      obj?.Text?.startsWith(endString)
    );

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      return data.slice(startIndex, endIndex);
    }

    return [];
  };

  return (
    <div>
      <div>
        <label>Upload Pdf</label>
        <input type="file" onChange={handleFile} />
      </div>
      {isLoading ? (
        <TableLoader />
      ) : (
        <div className="bg-white w-full max-w-[1500px] mx-auto p-10 my-5 rounded-2xl">
          {/* bacic info
           */}
          <div>
            <BasicInfo basicInfo={basicInfoData} data={pdfData} />
            <PropertyDetails
              propertyDetails={propertyDetailsData}
              data={pdfData}
            />
            <SellerInfo data={pdfData} />
            <Table1 table1Data={table1Data} data={pdfData} />
            <Table2 table2Data={table2Data} />
            <ExtraInfo extraInfo={clientData} />
            <FooterInfo data={footerComponentData} pdfData={pdfData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfExtrack;
