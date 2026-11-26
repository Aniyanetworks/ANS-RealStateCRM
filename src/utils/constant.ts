export const getEnvUrls = () => {

  const localApiUrl = "http://localhost:4000/api/v1";
  const localBaseUrl = window.location.origin + "/"; // demo: uploaded files are static assets served by the app itself


  const UrlLocal = "http://localhost:3000";
  const accessToken = localStorage.getItem("accessToken");

  const productionApiUrl = "https://demo.invalid/api/v1";
  const productionBaseUrl = "https://demo.invalid/";
  const UrlProd = "https://demo.invalid";

  const productionDevApiUrl = "https://demo.invalid/api/v1";
  const productionDevBaseUrl = window.location.origin + "/";
  const UrlDev = "https://demo.invalid";


  const isDevelopment = import.meta.env.MODE === "development";
  const hostname = window.location.hostname;

  const square_applicationId_sendbox = "sandbox-sq0idb-2BYUqCn2CS2X5_dynWGDrw";
  const locationId_sendbox = "LV15A747W4H7V";
  const square_applicationId_prod = "sq0idp-Js8wjDowqkaW66vPCA2SrQ";
  const locationId_prod = "LHZVJM5641EJP";

  let apiUrl, baseUrl, square_applicationId, locationId, appUrl;

  if (isDevelopment) {
    apiUrl = localApiUrl;
    baseUrl = localBaseUrl;
    appUrl = UrlLocal;



    square_applicationId = square_applicationId_sendbox;
    locationId = locationId_sendbox;
  } else {
    if (hostname.includes("hub.dvrealty.ca")) {
      apiUrl = productionApiUrl;
      baseUrl = productionBaseUrl;
      appUrl = UrlProd;

      square_applicationId = square_applicationId_prod;
      locationId = locationId_prod;
    } else {
      apiUrl = productionDevApiUrl;
      baseUrl = productionDevBaseUrl;
      appUrl = UrlDev;

      square_applicationId = square_applicationId_sendbox;
      locationId = locationId_sendbox;
    }
  }

  return {
    apiUrl,
    baseUrl,
    accessToken,
    square_applicationId,
    locationId,
    appUrl,
  };
};

export const {
  apiUrl,
  baseUrl,
  accessToken,
  square_applicationId,
  locationId,
  appUrl,
} = getEnvUrls();

export function getFileUrl(filePath: string | null | undefined): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  return baseUrl + filePath.replace(/^[\\/]/, '').replace(/\\/g, '/');
}

export function getPdfProxyUrl(filePath: string | null | undefined): string {
  if (!filePath) return '';
  const fullUrl = getFileUrl(filePath);
  const s3Match = fullUrl.match(/amazonaws\.com\/(.+)$/);
  if (s3Match) {
    return `${apiUrl}/common/proxy-file?key=${encodeURIComponent(s3Match[1])}`;
  }
  return fullUrl;
}
