interface Table2Props {
  table2Data: {
    Text: string;
  }[];
}

const Table2: React.FC<Table2Props> = ({ table2Data }) => {
  function formatArray(array: any[], chunkSize: number) {
    const filteredArray = array.filter((obj) => {
      return !String(obj.Text).match(/^\d+$/);
    });

    const result = [];
    for (let i = 0; i < filteredArray.length; i += chunkSize) {
      result.push(filteredArray.slice(i, i + chunkSize));
    }
    return result;
  }

  const formattedData = formatArray(table2Data?.slice(5), 7);

  return (
    <div className="py-3 border-b">
      <table>
        <thead className="text-[13px]">
          <th className="max-w-[10px]">#</th>
          <th className="w-[90px]">Room</th>
          <th className="w-[70px]">Level</th>
          <th className="w-[70px]">Length(ft)</th>
          <th className="w-[70px]">Width(ft)</th>
          <th>Description</th>
        </thead>
        <tbody>
          {formattedData.map((data: { Text: string }[], index: number) => (
            <tr key={index}>
              <td>
                <p>{index + 1}</p>
              </td>
              {data?.map((item: { Text: string }, i: number) => (
                <td key={i}>
                  <input
                    value={
                      i === 0 && /^[0-9]+ /.test(item?.Text)
                        ? item?.Text.split(" ").slice(1).join(" ")
                        : item?.Text
                    }
                    type="text"
                    name=""
                    id=""
                    placeholder="e.g."
                    className="border-none text-center bg-transparent block"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table2;
