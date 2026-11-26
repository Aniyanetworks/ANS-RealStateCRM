import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type TProps = {
  email: string;
  subject: string;
  message: string;
};

const EmailPDF = ({ email, subject, message }: TProps) => {
  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.container}>
          <View style={styles.section}>
            <Text style={styles.label}>Recipent's Email:</Text>
            <Text style={styles.value}>{email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Email Subject:</Text>
            <Text style={styles.value}>{subject}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.value}>{message}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default EmailPDF;

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingTop: 100,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  section: {
    flexDirection: "row",
    gap: 2,
  },
  label: {
    fontWeight: "bold",
    fontSize: 12,
  },
  value: {
    flex: 1,
    fontSize: 12,
    fontStyle: "italic",
  },
});

// const handleDownloads = async () => {
//     // Generate the PDF blob
//     const pdfInstance = pdf(<EmailPDF />);
//     const blob = await pdfInstance.toBlob();

//     // Create a temporary download link
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = "ApplicantData.pdf";

//     // Trigger the download
//     link.click();

//     // Clean up
//     URL.revokeObjectURL(link.href);
//   };

// const handleDownload = async () => {
//     // Generate the PDF Blob
//     const pdfInstance = pdf(<EmailPDF />);
//     const blob = await pdfInstance.toBlob();

//     // Create an invisible iframe
//     const iframe = document.createElement("iframe");
//     iframe.style.display = "none";
//     iframe.src = URL.createObjectURL(blob);
//     document.body.appendChild(iframe);

//     // Trigger the print dialog
//     iframe.onload = () => {
//       iframe.contentWindow?.print();

//       // Remove the iframe after printing
//       iframe.parentNode?.removeChild(iframe);
//     };
//   };
