// const capitalizeWords = (str: string): string => {
//   return str
//     .split(' ')
//     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(' ');
// };

// const numberToWords = (num: number): string => {
//   const ones: string[] = [
//     '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
//     'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
//     'seventeen', 'eighteen', 'nineteen'
//   ];
//   const tens: string[] = [
//     '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
//   ];
//   const thousands: string[] = ['', 'thousand', 'million', 'billion'];

//   if (num === 0) return 'Zero';

//   let words = '';
//   let chunkIndex = 0;

//   while (num > 0) {
//     const chunk = num % 1000;
//     if (chunk > 0) {
//       const chunkWords: string[] = [];
//       if (chunk > 99) {
//         chunkWords.push(ones[Math.floor(chunk / 100)]);
//         chunkWords.push('hundred');
//       }
//       const tenPart = chunk % 100;
//       if (tenPart < 20) {
//         chunkWords.push(ones[tenPart]);
//       } else {
//         chunkWords.push(tens[Math.floor(tenPart / 10)]);
//         chunkWords.push(ones[tenPart % 10]);
//       }
//       words = chunkWords.join(' ') + ' ' + thousands[chunkIndex] + ' ' + words;
//     }
//     num = Math.floor(num / 1000);
//     chunkIndex++;
//   }

//   return capitalizeWords(words.trim());
// };

// export default numberToWords;



const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .map(word => {
      // Skip capitalization if the word is "and"
      if (word.toLowerCase() === 'and') {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};


const numberToWords = (num: number): string => {

  if(!num)
  {
    return '';
  }
  const ones: string[] = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
    'seventeen', 'eighteen', 'nineteen'
  ];
  const tens: string[] = [
    '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
  ];
  const thousands: string[] = ['', 'thousand', 'million', 'billion'];

  if (num === 0) return 'Zero dollars and zero cents';

  let words = '';
  let chunkIndex = 0;

  // Split the number into dollars and cents
  const [dollars, cents] = num?.toString().split('.').map(Number);

  // Process dollars
  let dollarChunk = dollars;
  while (dollarChunk > 0) {
    const chunk = dollarChunk % 1000;
    if (chunk > 0) {
      const chunkWords: string[] = [];
      if (chunk > 99) {
        chunkWords.push(ones[Math.floor(chunk / 100)]);
        chunkWords.push('hundred');
      }
      const tenPart = chunk % 100;
      if (tenPart < 20) {
        chunkWords.push(ones[tenPart]);
      } else {
        chunkWords.push(tens[Math.floor(tenPart / 10)]);
        chunkWords.push(ones[tenPart % 10]);
      }
      words = chunkWords.join(' ') + ' ' + thousands[chunkIndex] + ' ' + words;
    }
    dollarChunk = Math.floor(dollarChunk / 1000);
    chunkIndex++;
  }

  // Process cents
  let centsWords = '';
  if (cents) {
    if (cents < 20) {
      centsWords = ones[cents];
    } else {
      centsWords = tens[Math.floor(cents / 10)] + (cents % 10 > 0 ? ' ' + ones[cents % 10] : '');
    }
  }

  // Construct final string without extra "Dollar"
  words = words.trim() + ' dollar' + (dollars !== 1 ? 's' : '');
  if (cents) {
      centsWords = centsWords.trim();
      words += ' and ' + centsWords + ' cent' + (cents !== 1 ? 's' : '');
  }
  
  return capitalizeWords(words);
};

export default numberToWords;
