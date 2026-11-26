import moment from "moment-timezone";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Utility to convert all images in a section to CORS-safe data URLs
export const preprocessImages = async (element: HTMLElement) => {
  const images = element.getElementsByTagName("img");
  const promises = Array.from(images).map((img) => {
    // Skip if already a data URL
    if (img.src.startsWith("data:")) return Promise.resolve();
    return new Promise((resolve) => {
      const proxyImg = new window.Image();
      proxyImg.crossOrigin = "Anonymous";
      proxyImg.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = proxyImg.width;
          canvas.height = proxyImg.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(proxyImg, 0, 0);
          img.src = canvas.toDataURL("image/png");
        } catch (e) {
          // fallback: leave image as is
        }
        resolve(undefined);
      };
      proxyImg.onerror = () => resolve(undefined);
      // Add cache busting param
      proxyImg.src = img.src.includes("?") ? `${img.src}&t=${Date.now()}` : `${img.src}?t=${Date.now()}`;
    });
  });
  await Promise.all(promises);
};

export const formatDate = (isoDate: any) => {
  const torontoTime = moment.tz(isoDate, "UTC").tz("America/Toronto");
  const formatTime = torontoTime.format("YYYY-MM-DDTHH:mm");
  return formatTime;
};

export const formatDateHumanFormat = (isoDate: any) => {
  const torontoTime = moment.tz(isoDate, "UTC").tz("America/Toronto");
  const formatTime = torontoTime.format("DD MMMM hh:mm A");
  return formatTime;
};

export const generatePDFFromElement = async (
  element: HTMLElement,
  setValue?: (field: string, value: File) => void
) => {
  if (!element) {
    throw new Error("Element is null or undefined");
  }
  
  // Store original styles to restore later
  const originalStyles = {
    display: element.style.display,
    visibility: element.style.visibility,
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    width: element.style.width,
    height: element.style.height,
    opacity: element.style.opacity,
    zIndex: element.style.zIndex,
  };
  
  // Store parent styles if element has a parent
  const parent = element.parentElement;
  const originalParentStyles = parent ? {
    display: parent.style.display,
    visibility: parent.style.visibility,
    opacity: parent.style.opacity,
  } : null;
  
  try {
    // Make element and parent fully visible for html2canvas
    if (parent) {
      parent.style.display = "block";
      parent.style.visibility = "visible";
      parent.style.opacity = "1";
    }
    
    element.style.display = "block";
    element.style.visibility = "visible";
    element.style.position = "absolute";
    element.style.left = "0";
    element.style.top = "0";
    element.style.opacity = "1";
    element.style.zIndex = "9999";
    element.style.width = element.scrollWidth > 0 ? `${element.scrollWidth}px` : "800px";
    element.style.height = "auto";
    
    // Force a reflow
    void element.offsetHeight;
    
    // Wait for styles to apply and DOM to update
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Preprocess images first
    try {
      await preprocessImages(element);
    } catch (imgError) {
      console.warn("Image preprocessing warning:", imgError);
      // Continue even if image preprocessing fails
    }
    
    // Wait for images to load with timeout
    const images = element.getElementsByTagName("img");
    if (images.length > 0) {
      const imageLoadPromises = Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
              resolve(undefined);
            } else {
              const timeout = setTimeout(() => {
                console.warn(`Image load timeout for: ${img.src}`);
                resolve(undefined);
              }, 3000);
              
              img.onload = () => {
                clearTimeout(timeout);
                resolve(undefined);
              };
              img.onerror = () => {
                clearTimeout(timeout);
                console.warn(`Image load error for: ${img.src}`);
                resolve(undefined); // Continue even if image fails
              };
            }
          })
      );
      await Promise.all(imageLoadPromises);
    }
    
    // Wait for final layout
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate canvas with error handling
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(element, {
        scale: 1.5, // Reduced scale for better performance
        useCORS: true,
        logging: false,
        allowTaint: false,
        backgroundColor: "#ffffff",
        removeContainer: false,
        imageTimeout: 5000,
        onclone: (clonedDoc) => {
          // Ensure cloned element is visible
          const clonedElement = clonedDoc.getElementById("printSection");
          if (clonedElement) {
            (clonedElement as HTMLElement).style.display = "block";
            (clonedElement as HTMLElement).style.visibility = "visible";
            (clonedElement as HTMLElement).style.opacity = "1";
          }
        },
      });
    } catch (canvasError: any) {
      console.error("html2canvas error:", canvasError);
      throw new Error(`Failed to generate canvas: ${canvasError?.message || "Unknown error"}`);
    }
    
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("Generated canvas is empty or invalid");
    }
    
    // Generate PDF
    const imgData = canvas.toDataURL("image/png", 0.92);
    if (!imgData || imgData === "data:,") {
      throw new Error("Failed to convert canvas to image data");
    }
    
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasHeight / canvasWidth;
    const imgHeight = pdfWidth * ratio;
    
    // Add image to PDF
    if (imgHeight > pdfHeight) {
      // Multi-page PDF
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    } else {
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
    }
    
    // Generate file
    const pdfBlob = pdf.output("blob");
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error("Generated PDF blob is empty");
    }
    
    const pdfFile = new File([pdfBlob], "Cheque-Pickup-Receipt.pdf", {
      type: "application/pdf",
    });
    
    if (setValue && pdfFile) {
      setValue("attachments", pdfFile);
    }
    
    return pdfFile;
  } catch (error: any) {
    console.error("Error in generatePDFFromElement:", error);
    throw new Error(`PDF generation failed: ${error?.message || "Unknown error"}`);
  } finally {
    // Restore original styles
    element.style.display = originalStyles.display;
    element.style.visibility = originalStyles.visibility;
    element.style.position = originalStyles.position;
    element.style.left = originalStyles.left;
    element.style.top = originalStyles.top;
    element.style.width = originalStyles.width;
    element.style.height = originalStyles.height;
    element.style.opacity = originalStyles.opacity;
    element.style.zIndex = originalStyles.zIndex;
    
    if (parent && originalParentStyles) {
      parent.style.display = originalParentStyles.display;
      parent.style.visibility = originalParentStyles.visibility;
      parent.style.opacity = originalParentStyles.opacity;
    }
  }
};

