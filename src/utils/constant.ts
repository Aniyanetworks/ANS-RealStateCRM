export const getEnvUrls = () => {
  // Local URLs for development
  /* const localApiUrl = "https://api.dvrealty.ca/api/v1";
  const localBaseUrl = "https://api.dvrealty.ca/"; */

  const localApiUrl = "http://localhost:4000/api/v1";
  const localBaseUrl = "http://localhost:4000/";

  /* const localApiUrl = "https://devapi.dvrealty.ca/api/v1";
  const localBaseUrl = "https://devapi.dvrealty.ca/"; */

  const UrlLocal = "http://localhost:3000";
  const accessToken = localStorage.getItem("accessToken");

  // Production URLs
  const productionApiUrl = "https://api.dvrealty.ca/api/v1";
  const productionBaseUrl = "https://api.dvrealty.ca/";
  const UrlProd = "https://hub.dvrealty.ca";

  // Production Dev URLs
  const productionDevApiUrl = "https://devapi.dvrealty.ca/api/v1";
  const productionDevBaseUrl = "https://devapi.dvrealty.ca/";
  const UrlDev = "https://dev.dvrealty.ca";

  // Check the environment mode and hostname

  // const isDevelopment = false;
  const isDevelopment = import.meta.env.MODE === "development";
  const hostname = window.location.hostname;

  //SendBox
  const square_applicationId_sendbox = "sandbox-sq0idb-2BYUqCn2CS2X5_dynWGDrw";
  const locationId_sendbox = "LV15A747W4H7V";
  //Prod
  const square_applicationId_prod = "sq0idp-Js8wjDowqkaW66vPCA2SrQ";
  const locationId_prod = "LHZVJM5641EJP";

  // Determine which URLs to use based on environment and hostname
  let apiUrl, baseUrl, square_applicationId, locationId, appUrl;

  if (isDevelopment) {
    apiUrl = localApiUrl;
    baseUrl = localBaseUrl;
    appUrl = UrlLocal;

    /* apiUrl = productionDevApiUrl;
    baseUrl = productionDevBaseUrl; */

    /* apiUrl = productionApiUrl;
    baseUrl = productionBaseUrl; */

    square_applicationId = square_applicationId_sendbox;
    locationId = locationId_sendbox;
  } else {
    // Production environment - check hostname
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

// Destructure the URLs for easy access
export const {
  apiUrl,
  baseUrl,
  accessToken,
  square_applicationId,
  locationId,
  appUrl,
} = getEnvUrls();

/** Return a displayable URL for any stored file path.
 *  - Already an absolute URL (S3, https, http) → returned as-is
 *  - Relative/local path → prefixed with baseUrl
 */
export function getFileUrl(filePath: string | null | undefined): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  return baseUrl + filePath.replace(/^[\\/]/, '').replace(/\\/g, '/');
}

/** Return a backend-proxied URL for a PDF file to avoid browser CORS restrictions with react-pdf. */
export function getPdfProxyUrl(filePath: string | null | undefined): string {
  if (!filePath) return '';
  const fullUrl = getFileUrl(filePath);
  // Extract S3 key from the full S3 URL (everything after amazonaws.com/)
  const s3Match = fullUrl.match(/amazonaws\.com\/(.+)$/);
  if (s3Match) {
    return `${apiUrl}/common/proxy-file?key=${encodeURIComponent(s3Match[1])}`;
  }
  // For non-S3 URLs (local dev paths), use direct URL
  return fullUrl;
}
