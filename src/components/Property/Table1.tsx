/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React from "react";

type pdfdataProps = {
  table1Data: any;
  data?: any;
};
const Table1: React.FC<pdfdataProps> = ({ table1Data, data }) => {

  const getTable1Data = (startString: string) => {
    const startIndex = data.findIndex((obj: { Text: string }) =>
      obj?.Text?.startsWith(startString)
    );


    if (startIndex !== -1) {
      const value = data[startIndex + 1]?.Text;
      if (!value.includes(":")) {
        return value;
      }
    }

    return [];
  };

  const kitchen = getTable1Data("Kitchens:");
  const exterior = getTable1Data("Exterior:");
  const zoning = getTable1Data("Zoning:");
  const famRm = getTable1Data("Fam Rm:");
  const drive = getTable1Data("Drive:");
  const cableTv = getTable1Data("Cable TV:");
  const hydro = getTable1Data("Hydro:");
  const basement = getTable1Data("Basement:");
  const garSpace = getTable1Data("Gar/Gar Spcs:");
  const gas = getTable1Data("Gas:");
  const phone = getTable1Data("Phone:");
  const fireplace = getTable1Data("Fireplace/Stv:");
  const drivePkSpaces = getTable1Data("Drive Pk Spcs:");
  const water = getTable1Data("Water:");
  const heat = getTable1Data("Heat:");
  const totalPkSpaces = getTable1Data("Tot Pk Spcs:");
  const waterSupply = getTable1Data("Water Supply:");
  const ac = getTable1Data("A/C:");
  const UFFI = getTable1Data("UFFI:");
  const sewer = getTable1Data("Sewer:");
  const centralvac = getTable1Data("Central Vac:");
  const pool = getTable1Data("Pool:");
  const retirement = getTable1Data("Retirement:");
  const apxAge = getTable1Data("Apx Age:");
  const propFeat = getTable1Data("Prop Feat:");
  const farm = getTable1Data("Farm/Agr:");
  const otherStruct = getTable1Data("Oth Struct:");
  const assessment = getTable1Data("Assessment:");
  const spaceDesign = getTable1Data("Spec Desig:");
  const polt = getTable1Data("POTL:");
  const hstApplicable = getTable1Data("HST Applicable to");
  const lotShape = getTable1Data("Lot Shape:");
  const laundryFeat = getTable1Data("Laundry Feat:");
  const salePrice = getTable1Data("Sale Price:");
  const lotSizeSource = getTable1Data("Lot Size Source:");
  const interiorFeat = getTable1Data("Interior Feat:");
  const roof = getTable1Data("Roof:");
  const foundation = getTable1Data("Foundation:");


  return (
    <div className="py-3 border-b grid grid-cols-3 divide-x-2">
      <div className=" space-y-[-10px] pr-3">
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Kitchens:</p>
          <input
            defaultValue={kitchen}
            type="text"
            name=""
            id=""
            placeholder="e.g. 1 + 1"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Fam Rm:</p>
          <input
            defaultValue={famRm}
            type="text"
            name=""
            id=""
            placeholder="e.g. N"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Basement:</p>
          <input
            defaultValue={basement}
            type="text"
            name=""
            id=""
            placeholder="e.g. Finished / Sep Entrance"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Fireplace/Stv:</p>
          <input
            defaultValue={fireplace}
            type="text"
            name=""
            id=""
            placeholder="e.g. N"
            className="border-none bg-transparent block"
          />
        </div>

        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">A/C:</p>
          <input
            defaultValue={ac}
            type="text"
            name=""
            id=""
            placeholder="e.g. Central Air"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Central Vac:</p>
          <input
            defaultValue={centralvac}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Apx Age:</p>
          <input
            defaultValue={apxAge}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Apx Sqft:</p>
          <input
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Assessment:</p>
          <input
            defaultValue={assessment}
            type="text"
            name=""
            id=""
            placeholder="e.g. 2023"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">POTL:</p>
          <input
            defaultValue={polt}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Laundry Feat:</p>
          <input
            defaultValue={laundryFeat}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
      </div>
      <div className=" space-y-[-10px] px-3">
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Exterior:</p>
          <input
            defaultValue={exterior}
            type="text"
            name=""
            id=""
            placeholder="e.g. Brick"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Drive:</p>
          <input
            defaultValue={drive}
            type="text"
            name=""
            id=""
            placeholder="e.g. Private"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Gar/Gar Spcs:</p>
          <input
            defaultValue={garSpace}
            type="text"
            name=""
            id=""
            placeholder="e.g. Attached / 1"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Drive Pk Spcs:</p>
          <input
            defaultValue={drivePkSpaces}
            type="text"
            name=""
            id=""
            placeholder="e.g. 4"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Tot Pk Spcs:</p>
          <input
            defaultValue={totalPkSpaces}
            type="text"
            name=""
            id=""
            placeholder="e.g. 5"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">UFFI:</p>
          <input
            defaultValue={UFFI}
            type="text"
            name=""
            id=""
            placeholder="e.g. "
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Pool:</p>
          <input
            defaultValue={pool}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Prop Feat:</p>
          <input
            defaultValue={propFeat}
            type="text"
            name=""
            id=""
            placeholder="e.g. Hospital, Library, Park,"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">HST Applicable to:</p>
          <input
            defaultValue={hstApplicable}
            type="text"
            name=""
            id=""
            placeholder="e.g.Included"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Sale Price:</p>
          <input
            defaultValue={salePrice}
            type="text"
            name=""
            id=""
            placeholder="e.g. "
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Interior Feat:</p>
          <input
            defaultValue={interiorFeat}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Roof:</p>
          <input
            defaultValue={roof}
            type="text"
            name=""
            id=""
            placeholder="e.g.Asphalt Shingle"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Foundation:</p>
          <input
            defaultValue={foundation}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
      </div>
      <div className=" space-y-[-10px] px-3">
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Zoning:</p>
          <input
            defaultValue={zoning}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Cable TV:</p>
          <input
            defaultValue={cableTv}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Hydro:</p>
          <input
            defaultValue={hydro}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Gas:</p>
          <input
            defaultValue={gas}
            type="text"
            name=""
            id=""
            placeholder="e.g. "
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Phone:</p>
          <input
            defaultValue={phone}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Water:</p>
          <input
            defaultValue={water}
            type="text"
            name=""
            id=""
            placeholder="e.g.Municipal "
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Water Supply:</p>
          <input
            defaultValue={waterSupply}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Sewer:</p>
          <input
            defaultValue={sewer}
            type="text"
            name=""
            id=""
            placeholder="e.g. Sewers"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Retirement:</p>
          <input
            defaultValue={retirement}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Farm/Agr:</p>
          <input
            defaultValue={farm}
            type="text"
            name=""
            id=""
            placeholder="e.g. "
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Oth Struct:</p>
          <input
            defaultValue={otherStruct}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Spec Desig:</p>
          <input
            defaultValue={spaceDesign}
            type="text"
            name=""
            id=""
            placeholder="e.g.Asphalt Shingle"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Lot Shape:</p>
          <input
            defaultValue={lotShape}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Lot Size Source:</p>
          <input
            defaultValue={lotSizeSource}
            type="text"
            name=""
            id=""
            placeholder="e.g."
            className="border-none bg-transparent block"
          />
        </div>
      </div>
    </div>
  );
};

export default Table1;
