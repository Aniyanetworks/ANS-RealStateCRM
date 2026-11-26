import {
  FormSectionHeading,
  InPutField,
  SubSectionHeading,
} from "../shared/FormHelpers";
type PropertyType = {
  id: number;
  name: string;
  value: string;
};

const propertyFeatures: PropertyType[] = [
  { id: 1, name: "Arts Centre", value: "arts_centre" },
  { id: 2, name: "Beach", value: "beach" },
  { id: 3, name: "Campground", value: "campground" },
  { id: 4, name: "Clear View", value: "clear_view" },
  { id: 5, name: "Cul de Sac/Dead End", value: "cul_de_sac" },
  { id: 6, name: "Electric Car Charger", value: "electric_car_charger" },
  { id: 7, name: "Fenced Yard", value: "fenced_yard" },
  { id: 8, name: "Galf", value: "galf" },
  { id: 9, name: "Greenbelt", value: "greenbelt" },
  { id: 10, name: "Hospital", value: "hospital" },
  { id: 11, name: "Island", value: "island" },
  { id: 12, name: "Lake Access", value: "lake_access" },
  { id: 13, name: "Lake Backlot", value: "lake_backlot" },
  { id: 14, name: "Lake/Pond", value: "lake_pond" },
  { id: 15, name: "Level", value: "level" },
  { id: 16, name: "Library", value: "library" },
  { id: 17, name: "Marina", value: "marina" },
  { id: 18, name: "Other", value: "other" },
  { id: 19, name: "Park", value: "park" },
  { id: 20, name: "Part Cleared", value: "part_cleared" },
  { id: 21, name: "Place of Worship", value: "place_or_worship" },
  { id: 22, name: "Public Transit", value: "public_transit" },
  { id: 23, name: "Ravine", value: "ravine" },
  { id: 24, name: "Rec./Commun. Centre", value: "rec_commun_centre" },
  { id: 25, name: "River/Stream", value: "river_or_stream" },
  { id: 26, name: "Rolling", value: "rolling" },
  { id: 27, name: "School", value: "school" },
  { id: 28, name: "School Bus Route", value: "school_bus_route" },
  { id: 29, name: "Skiing", value: "skiing" },
  { id: 30, name: "Stopping", value: "stopping" },
  { id: 31, name: "Terraced", value: "terraced" },
  { id: 32, name: "Tiled/Drainage", value: "tiled_drainage" },
  { id: 33, name: "Waterfront", value: "waterfront" },
  { id: 34, name: "Wooded/Treed", value: "wooded_or_treed" },
];

const otherStructures: PropertyType[] = [
  { id: 1, name: "Aux Residences", value: "aux_residences" },
  { id: 2, name: "Barn", value: "barn" },
  { id: 3, name: "Box Stall", value: "box_stall" },
  { id: 4, name: "Drive Shed", value: "drive_shed" },
  { id: 5, name: "Garden Shed", value: "garden_shed" },
  { id: 5, name: "Greenhouse", value: "greenhouse" },
  { id: 5, name: "Indoor Arena", value: "indoor_arena" },
  { id: 5, name: "Kennel", value: "Kennel" },
  { id: 5, name: "Paddocks", value: "paddocks" },
  { id: 5, name: "Workshops", value: "workshops" },
];

const Page2 = () => {
  return (
    <div className="bg-white px-12 py-8">
      <h3 className=" bg-darkBlue text-white px-3 py-[2px] ">
        EXTERIOR (continued)
      </h3>

      <div className=" grid grid-cols-5">
        <div className="border-r pr-2 pt-3 border-darkBlue">
          <div>
            <div className="flex gap-2 items-end">
              <FormSectionHeading className="bg-transparent mt-1 px-0">
                <span className="bg-pink-500 px-1">MUNICIPALITY</span>
              </FormSectionHeading>

              <p>(check 1)</p>
            </div>
            <div className="my-2">
              <label htmlFor="attached" className="flex items-center gap-2">
                <input type="checkbox" name="" id="attached" />
                Attached
              </label>
              <label htmlFor="built-in" className="flex items-center gap-2">
                <input type="checkbox" name="" id="built-in" />
                Built-In
              </label>
              <label htmlFor="carport" className="flex items-center gap-2">
                <input type="checkbox" name="" id="carport" />
                Carport
              </label>
              <label htmlFor="detached" className="flex items-center gap-2">
                <input type="checkbox" name="" id="detached" />
                Detached
              </label>
              <label htmlFor="none" className="flex items-center gap-2">
                <input type="checkbox" name="" id="none" />
                None
              </label>
              <label htmlFor="other" className="flex items-center gap-2">
                <input type="checkbox" name="" id="other" />
                Other
              </label>
            </div>
          </div>

          <div>
            <div className="flex gap-2 items-end ">
              <SubSectionHeading
                className="text-white"
                title=" GARAGE PARKING SPACES"
              ></SubSectionHeading>

              <div className="max-w-[50px]">
                <InPutField inputClass="!bg-transparent" />
              </div>
            </div>
            <div className="">
              <FormSectionHeading className="bg-transparent mt-1 px-0">
                <span className="bg-pink-500 px-1">PARKING/DRIVING</span>
              </FormSectionHeading>
              <p>(check 1)</p>
            </div>

            <div className="my-2">
              <label htmlFor="available" className="flex items-center gap-2">
                <input type="checkbox" name="" id="available" />
                Available
              </label>
              <label htmlFor="circular" className="flex items-center gap-2">
                <input type="checkbox" name="" id="circular" />
                Circular
              </label>
              <label htmlFor="front-yard" className="flex items-center gap-2">
                <input type="checkbox" name="" id="front-yard" />
                Front Yard
              </label>
              <label htmlFor="lane" className="flex items-center gap-2">
                <input type="checkbox" name="" id="lane" />
                Lane
              </label>
              <label htmlFor="mutual" className="flex items-center gap-2">
                <input type="checkbox" name="" id="mutual" />
                Mutual
              </label>
              <label htmlFor="none" className="flex items-center gap-2">
                <input type="checkbox" name="" id="none" />
                None
              </label>
              <label htmlFor="other" className="flex items-center gap-2">
                <input type="checkbox" name="" id="other" />
                Other
              </label>
              <label htmlFor="private" className="flex items-center gap-2">
                <input type="checkbox" name="" id="private" />
                Private
              </label>
              <label
                htmlFor="private-double"
                className="flex items-center gap-2"
              >
                <input type="checkbox" name="" id="private-double" />
                Private Double
              </label>
              <label htmlFor="right-of-way" className="flex items-center gap-2">
                <input type="checkbox" name="" id="right-of-way" />
                Right-Of-Way
              </label>
            </div>
          </div>

          <div>
            <div className="flex gap-2 items-end ">
              <SubSectionHeading
                className="text-white px-2 py-1"
                title=" DRIVING PARKING SPACES"
              ></SubSectionHeading>
              <div className="max-w-[50px]">
                <InPutField inputClass="!bg-transparent" />
              </div>
            </div>
            <div className="flex gap-2 mt-2 items-end ">
              <SubSectionHeading
                className="text-white px-2 py-1"
                title="  Total PARKING SPACES"
              ></SubSectionHeading>
              <div className="max-w-[50px]">
                <InPutField inputClass="!bg-transparent" />
              </div>
            </div>

            <div>
              <FormSectionHeading className="bg-transparent mt-1 px-0">
                <span className="bg-pink-500 px-1">WATER</span>
              </FormSectionHeading>
              <p>(check 1)</p>
            </div>

            <div className="my-2">
              <label htmlFor="both" className="flex items-center gap-2">
                <input type="checkbox" name="" id="both" />
                Both
              </label>
              <label htmlFor="municipal" className="flex items-center gap-2">
                <input type="checkbox" name="" id="municipal" />
                Municipal
              </label>
              <label htmlFor="none" className="flex items-center gap-2">
                <input type="checkbox" name="" id="none" />
                None
              </label>
              <label htmlFor="other" className="flex items-center gap-2">
                <input type="checkbox" name="" id="other" />
                Other
              </label>
              <label htmlFor="well" className="flex items-center gap-2">
                <input type="checkbox" name="" id="well" />
                Well
              </label>
            </div>
          </div>

          <div>
            <div className="flex  gap-2">
              <FormSectionHeading className="bg-transparent mt-1 px-0">
                <span className="bg-pink-500 px-1">POOL</span>
              </FormSectionHeading>
              <p>(check 1)</p>
            </div>
            <div className="my-2">
              <label htmlFor="above_ground" className="flex items-center gap-2">
                <input type="checkbox" name="" id="above_ground" />
                Above Ground
              </label>
              <label htmlFor="indoor" className="flex items-center gap-2">
                <input type="checkbox" name="" id="indoor" />
                Indoor
              </label>
              <label htmlFor="inground" className="flex items-center gap-2">
                <input type="checkbox" name="" id="inground" />
                Inground
              </label>
              <label htmlFor="none" className="flex items-center gap-2">
                <input type="checkbox" name="" id="none" />
                None
              </label>
            </div>
          </div>
        </div>
        <div className="border-r px-2 pt-3 border-darkBlue">
          <div>
            <div className="flex  gap-1">
              <div>
                <FormSectionHeading className="bg-transparent mt-1 px-0">
                  <span className="bg-pink-500 px-1">SEWERS</span>
                </FormSectionHeading>
              </div>
              <span>(check 1)</span>
            </div>
            <div className="my-2">
              <label htmlFor="holding_Tank" className="flex items-center gap-2">
                <input type="checkbox" name="" id="holding_Tank" />
                Holding Tank
              </label>
              <label htmlFor="None" className="flex items-center gap-2">
                <input type="checkbox" name="" id="None" />
                None
              </label>
              <label htmlFor="Others" className="flex items-center gap-2">
                <input type="checkbox" name="" id="Others" />
                Others
              </label>
              <label htmlFor="Septic" className="flex items-center gap-2">
                <input type="checkbox" name="" id="Septic" />
                Septic
              </label>
              <label htmlFor="Sewer" className="flex items-center gap-2">
                <input type="checkbox" name="" id="Sewer" />
                Sewer
              </label>
            </div>
          </div>

          <div>
            <SubSectionHeading
              title="RETIREMENT COMMUNITY"
              className="bg-transparent  border-2 border-darkBlue"
            />
            <div className="flex gap-5  mt-2">
              <label htmlFor="yes" className="flex items-center gap-2">
                <input type="checkbox" name="retirement" id="yes" />
                Yes
              </label>
              <label htmlFor="no" className="flex items-center gap-2">
                <input type="checkbox" name="retirement" id="no" />
                No
              </label>
            </div>
          </div>

          <div>
            <SubSectionHeading
              title="PHYSICALLY HANDICAPPED EQUIPPED"
              className="bg-transparent text-[12px]  border-2 border-darkBlue"
            />
            <div className="flex gap-5 mt-2">
              <label htmlFor="p_yes" className="flex items-center gap-2">
                <input type="checkbox" name="handicapped" id="p_yes" />
                Yes
              </label>
              <label htmlFor="p_no" className="flex items-center gap-2">
                <input type="checkbox" name="handicapped" id="p_no" />
                No
              </label>
            </div>
          </div>

          <div>
            <div className="">
              <div>
                <FormSectionHeading className="bg-transparent mt-1 px-0">
                  <span className="bg-pink-500 px-1">SPECIAL DESIGNATION</span>
                </FormSectionHeading>
              </div>
              <span>(check up to 6)</span>
            </div>

            <div className="my-2">
              <label
                htmlFor="accessibility"
                className="flex items-center gap-2"
              >
                <input type="checkbox" name="" id="accessibility" />
                Accessibility
              </label>
              <label
                htmlFor="expropriation"
                className="flex items-center gap-2"
              >
                <input type="checkbox" name="" id="expropriation" />
                Expropriation
              </label>
              <label htmlFor="Heritage" className="flex items-center gap-2">
                <input type="checkbox" name="" id="Heritage" />
                Heritage
              </label>
              <label htmlFor="Landlease" className="flex items-center gap-2">
                <input type="checkbox" name="" id="Landlease" />
                Landlease
              </label>
              <label htmlFor="Others" className="flex items-center gap-2">
                <input type="checkbox" name="" id="Others" />
                Others
              </label>
              <label htmlFor="Unknown" className="flex items-center gap-2">
                <input type="checkbox" name="" id="Unknown" />
                Unknown
              </label>
            </div>
          </div>

          <div>
            <SubSectionHeading
              title="APPROXIMATE AGE"
              className="bg-transparent text-[12px]  border-2 border-darkBlue"
            />
            <p>check 1</p>
            <div className="my-2">
              <label htmlFor="new" className="flex items-center gap-2">
                <input type="checkbox" name="" id="new" />
                New
              </label>
              <label htmlFor="0-5 years" className="flex items-center gap-2">
                <input type="checkbox" name="" id="0-5 years" />
                0-5 Years
              </label>
              <label htmlFor="0-5_years" className="flex items-center gap-2">
                <input type="checkbox" name="" id="0-5_years" />
                0-5 Years
              </label>
              <label htmlFor="6-15_years" className="flex items-center gap-2">
                <input type="checkbox" name="" id="6-15_years" />
                6-15 Years
              </label>
              <label htmlFor="16-30_years" className="flex items-center gap-2">
                <input type="checkbox" name="" id="16-30_years" />
                16-30 Years
              </label>
              <label htmlFor="31-50_years" className="flex items-center gap-2">
                <input type="checkbox" name="" id="31-50_years" />
                31-50 Years
              </label>
              <label htmlFor="51-99_years" className="flex items-center gap-2">
                <input type="checkbox" name="" id="51-99_years" />
                51-99 Years
              </label>
              <label htmlFor="100+_years" className="flex items-center gap-2">
                <input type="checkbox" name="" id="100+_years" />
                100 + Years
              </label>
            </div>
          </div>

          <div>
            <SubSectionHeading
              title="APPROX SQUARE FOOTAGE
              "
              className="bg-transparent text-[12px]  border-2 border-darkBlue"
            />
            <p>check 1</p>
            <div className="my-2">
              <label htmlFor="less_700" className="flex items-center gap-2">
                <input type="checkbox" name="" id="less_700" />
                Less than 700
              </label>
              <label htmlFor="700_1100" className="flex items-center gap-2">
                <input type="checkbox" name="" id="700_1100" />
                700-1100
              </label>
              <label htmlFor="1100-1500" className="flex items-center gap-2">
                <input type="checkbox" name="" id="1100-1500" />
                1100-1500
              </label>
              <label htmlFor="1500_1200" className="flex items-center gap-2">
                <input type="checkbox" name="" id="1500_1200" />
                1500-2000
              </label>
              <label htmlFor="2000_2500" className="flex items-center gap-2">
                <input type="checkbox" name="" id="2000_2500" />
                2000-2500
              </label>
              <label htmlFor="2500_3000" className="flex items-center gap-2">
                <input type="checkbox" name="" id="2500_3000" />
                2500-3000
              </label>
              <label htmlFor="3000_3500" className="flex items-center gap-2">
                <input type="checkbox" name="" id="3000_3500" />
                3000-3500
              </label>
              <label htmlFor="3500_5000" className="flex items-center gap-2">
                <input type="checkbox" name="" id="3500_5000" />
                3500-5000
              </label>
              <label htmlFor="5000+" className="flex items-center gap-2">
                <input type="checkbox" name="" id="5000+" />
                5000 +
              </label>
            </div>
          </div>
        </div>
        <div className="border-r px-2 pt-3 border-darkBlue">
          <div>
            <SubSectionHeading
              title="PROPERTY FEATURES/AREA INFLUENCES"
              className="bg-transparent text-[12px] text-center  border-2 border-darkBlue"
            />
            <p>check up to 6</p>
            <div className="my-2">
              {propertyFeatures.map((feature) => (
                <label
                  htmlFor={feature.value}
                  className="flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    name={feature.value}
                    id={feature.value}
                  />
                  {feature.name}
                </label>
              ))}
              <label htmlFor="less_700" className="flex items-center gap-2">
                <input type="checkbox" name="" id="less_700" />
                Less than 700
              </label>
            </div>
          </div>
        </div>
        <div className="border-r px-2 pt-3 border-darkBlue">
          <div>
            <SubSectionHeading
              title="OTHER STRUCTURES"
              className="bg-transparent text-[12px] text-center  border-2 border-darkBlue"
            />
            <p>check up to 2</p>

            <div className="my-2">
              {otherStructures.map((feature) => (
                <label
                  htmlFor={feature.value}
                  className="flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    name={feature.value}
                    id={feature.value}
                  />
                  {feature.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default Page2;
