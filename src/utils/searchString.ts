export const searchSingleString = (
  data: { Text: string }[],
  startString: string
) => {
  const startIndex = data.findIndex((obj: { Text: string }) =>
    obj?.Text?.startsWith(startString)
  );

  if (startIndex !== -1) {
    const getData = data.slice(startIndex, startIndex + 1);

    return getData.length > 0
      ? getData[0]?.Text
        ? getData[0]?.Text?.split(":")[1]
        : ""
      : getData;
  }

  return [];
};
