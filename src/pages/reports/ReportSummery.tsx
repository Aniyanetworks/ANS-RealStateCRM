import { useState } from "react";

export default function SummaryReport() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange, setDateRange] = useState("2025-02-01 To 2025-02-04");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  return (
    <div className="p-8 bg-gray-100 flex justify-center min-h-screen">
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-center mb-4">Summary Report</h2>

        <div className="relative">
          <label className="font-semibold block mb-1">Choose Your Date</label>
          <div className="flex">
            <input
              type="text"
              className="w-full border p-2 rounded-l focus:ring focus:#0a2a28"
              placeholder={dateRange}
              readOnly
              onClick={() => setShowDropdown(!showDropdown)}
            />
            <button className="bg-[#0f766e] text-white px-4 rounded-r">Submit</button>
          </div>

          {showDropdown && (
            <div className="absolute left-0 mt-2 w-100 bg-white shadow-md border rounded-md p-4 z-10">
              <div className="flex gap-2 mb-4">
                {['Day', 'Week', 'Month', 'Quarter', 'Year'].map((period, index) => (
                  <button key={index} className="px-3 py-1 bg-gray-200 rounded">
                    {period}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {['Last 30 days', 'Last 90 days', 'Last Year', 'All Time'].map((range, index) => (
                  <button
                    key={index}
                    className="block w-full text-left px-3 py-2 bg-gray-200 rounded"
                    onClick={() => {
                      setDateRange(range);
                      setShowDropdown(false);
                    }}
                  >
                    {range}
                  </button>
                ))}
                
                <div className="border p-2 rounded">
                  <label className="text-sm font-semibold">Custom Range</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="date"
                      className="border p-2 rounded w-full"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                    <input
                      type="date"
                      className="border p-2 rounded w-full"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    className="w-1/2 bg-[#0f766e] text-white p-2 rounded"
                    onClick={() => {
                      setDateRange(`${customStart} To ${customEnd}`);
                      setShowDropdown(false);
                    }}
                  >
                    Apply
                  </button>
                  <button
                    className="w-1/2 bg-[#FFDFDC] text-[#EF4444] p-2 rounded"
                    onClick={() => setShowDropdown(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
