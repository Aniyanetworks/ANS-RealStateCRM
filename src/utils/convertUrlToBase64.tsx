export const convertUrlToBase64 = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Ensure CORS is handled if the image is hosted remotely
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.height = img.height;
          canvas.width = img.width;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL());  // Resolves with the base64 string
        } else {
          reject(new Error("Failed to get canvas context"));
        }
      };
  
      img.onerror = (error) => reject(error);
  
      img.src = imageUrl;
    });
  };
  