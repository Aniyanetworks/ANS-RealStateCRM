// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import moment from "moment";
import logo from "/logo.svg";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

type TProps = {
  receiptNo: string;
  date: string;
  propertyAddress: string;
  receivedFrom: string;
  transectionType: string;
  amountReceived: string;
  amountInWords: string;
  receivedBy: string;
  bankdraftImage: any;
  signature: any;
};

const ReciptPDF = ({
  receiptNo,
  date,
  propertyAddress,
  receivedFrom,
  transectionType,
  amountReceived,
  amountInWords,
  receivedBy,
  bankdraftImage,
  signature,
}: TProps) => {
  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.container}>
          <View
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Image src={logo} style={{ width: 70 }} />
            <Text
              style={{
                marginTop: 20,
                fontSize: 20,
                color: "#0f766e",
              }}
            >
              ANS REALSTATECRM
            </Text>{" "}
            {receiptNo}
          </View>

          {/*############# Receipt No: ############### */}

          <View>
            <Text>
              <Text style={styles.span}>Receipt No:</Text> {receiptNo}
            </Text>
          </View>

          {/*############# Date: ############### */}
          <View>
            <Text>
              <Text style={styles.span}>Date:</Text>{" "}
              {moment
                .utc(date) // Parse as UTC
                .tz("America/Toronto") // Convert to Toronto timezone
                .format("DD MMMM YYYY, hh:mm A")}
            </Text>
          </View>

          {/*############# Property Address:: ############### */}
          <View>
            <Text>
              <Text style={styles.span}>Property Address:</Text>{" "}
              {propertyAddress}
            </Text>
          </View>

          {/*############# Received From: ############### */}
          <View>
            <Text>
              <Text style={styles.span}>Received From:</Text> {receivedFrom}
            </Text>
          </View>

          {/*############# Transaction Type: ############### */}
          <View>
            <Text>
              <Text style={styles.span}>Transaction Type:</Text>{" "}
              {transectionType}
            </Text>
          </View>

          {/*############# Amount Received: ############### */}
          <View>
            <Text>
              <Text style={styles.span}>Amount Received:</Text> {amountReceived}
            </Text>
          </View>

          {/*############# Amount in Words: ############### */}
          <View>
            <Text>
              <Text style={styles.span}>Amount in Words:</Text> {amountInWords}
            </Text>
          </View>

          {/*############# received by and signature ############### */}

          <View style={styles.flexBetween}>
            {/* ######### received by ############### */}
            <View>
              <Text>
                <Text style={styles.span}>Received By:</Text> {receivedBy}
              </Text>
            </View>

            {/* ######### signature ############### */}
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 40,
              }}
            >
              <Text style={styles.span}>Signature:</Text>
              <Image src={signature} style={{ width: 50, height: 50 }} />
            </View>
          </View>

          {/* ######### signature ############### */}
          <View>
            <Image src={bankdraftImage} />
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ReciptPDF;

const styles = StyleSheet.create({
  page: {
    padding: 40,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontSize: 12,
  },
  span: {
    fontWeight: "extrabold",
    fontSize: 11,
    fontFamily: "Roboto",
  },
  flexBetween: {
    display: "flex",
    flexDirection: "row",
    gap: 130,
  },
});

// #######################
// ##### print receipt #####
// #######################

// const [bankdraftImage, setBankdraftImage] = useState<string | null>(null);
// const [signature, setSignature] = useState<string | null>(null);

// this is set blob image in state
// useEffect(() => {
//   if (receiptModalData && receiptModalData?.bankDraftImagePath) {
//     convertImageToBase64(
//       `${baseUrl}${receiptModalData?.bankDraftImagePath}`,
//       "bankdraft"
//     );
//   }
//   if (receiptModalData && receiptModalData?.signature) {
//     convertImageToBase64(
//       `${baseUrl}${receiptModalData?.signature}`,
//       "signature"
//     );
//   }
// }, [receiptModalData]);

//   fn to conver image to blob from url
// const convertImageToBase64 = async (url: string, type: string) => {
//   try {
//     const response = await fetch(url);
//     const blob = await response.blob();
//     const reader = new FileReader();

//     reader.onloadend = () => {
//       if (type === "signature") {
//         setSignature(reader.result as string);
//       } else {
//         setBankdraftImage(reader.result as string);
//       }
//     };

//     reader.readAsDataURL(blob);
//   } catch (error) {
//     console.error("Error converting image to Base64:", error);
//   }
// };

//   ### fn to print
// const printReceiptPdf = async () => {
//   // Generate the PDF Blob
//   const pdfInstance = pdf(
//     <ReciptPDF
//       receiptNo={receiptModalData?.receiptId}
//       date={receiptModalData?.date}
//       propertyAddress={receiptModalData?.propertyAddress}
//       receivedFrom={
//         receiptModalData.receivedFrom +
//         " " +
//         `(${formatStringCamelCasecapitalize(receiptModalData?.representation)})`
//       }
//       amountReceived={
//         "$" + formatNumberWithCommasAndDecimals(receiptModalData.amountReceived)
//       }
//       transectionType={receiptModalData.transactionType}
//       amountInWords={numberToWords(receiptModalData.amountReceived) + "only"}
//       receivedBy={receiptModalData?.receivedBy}
//       signature={signature}
//       bankdraftImage={bankdraftImage}
//     />
//   );
//   const blob = await pdfInstance.toBlob();

//   // Open the PDF in a new tab or window for printing
//   const pdfURL = URL.createObjectURL(blob);
//   const newWindow = window.open(pdfURL, "_blank");

//   if (newWindow) {
//     // Trigger the print dialog
//     newWindow.addEventListener("load", () => {
//       newWindow.print();
//     });
//   }
// };
