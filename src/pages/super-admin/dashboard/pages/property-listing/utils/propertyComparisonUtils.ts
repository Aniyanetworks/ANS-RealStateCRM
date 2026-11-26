/* eslint-disable @typescript-eslint/no-explicit-any */

export const comparePropertyData = (
  propertyListing: any,
  realtorProperty: any,
  tableData: any[]
) => {
  const differences: any[] = [];
  
  const fieldMappings = [
    {
      propertyField: 'listingPrice',
      realtorField: 'ListPrice',
      label: 'Listing Price / List Price',
      format: (val: any) => val ? `$${Number(val).toLocaleString()}` : 'N/A'
    },
    {
      propertyField: 'address',
      realtorField: 'propertyAddress',
      label: 'Property Address',
      format: (val: any) => val || 'N/A'
    },
    {
      propertyField: 'propertyType',
      realtorField: 'PropertyType',
      label: 'Property Type',
      format: (val: any) => val || 'N/A'
    },
    {
      propertyField: 'listingStatus',
      realtorField: 'MlsStatus',
      label: 'Listing Status / MLS Status',
      format: (val: any) => val || 'N/A'
    },
    {
      propertyField: 'bedrooms',
      realtorField: 'BedroomsTotal',
      label: 'Bedrooms',
      format: (val: any) => val || 'N/A'
    },
    {
      propertyField: 'bathrooms',
      realtorField: 'BathroomsTotalInteger',
      label: 'Bathrooms',
      format: (val: any) => val || 'N/A'
    },
    {
      propertyField: 'squareFeet',
      realtorField: 'LivingArea',
      label: 'Square Feet / Living Area',
      format: (val: any) => val ? `${Number(val).toLocaleString()} sq ft` : 'N/A'
    },
    {
      propertyField: 'lotSize',
      realtorField: 'LotSizeSquareFeet',
      label: 'Lot Size',
      format: (val: any) => val ? `${Number(val).toLocaleString()} sq ft` : 'N/A'
    },
    {
      propertyField: 'yearBuilt',
      realtorField: 'YearBuilt',
      label: 'Year Built',
      format: (val: any) => val || 'N/A'
    },
    {
      propertyField: 'mlsNumber',
      realtorField: 'mlsNumber',
      label: 'MLS Number',
      format: (val: any) => val || 'N/A'
    },
  ];

  const fullPropertyListing = tableData.find((p: any) => p.uuid === propertyListing.uuid);
  
  fieldMappings.forEach((mapping) => {
    let propertyValue = fullPropertyListing?.[mapping.propertyField];
    
    if (mapping.propertyField === 'listingPrice' && !propertyValue) {
      propertyValue = fullPropertyListing?.askingPrice;
    }
    
    if (mapping.propertyField === 'address' && !propertyValue) {
      propertyValue = fullPropertyListing?.propertyAddress;
    }
    
    let realtorValue = realtorProperty[mapping.realtorField];
    
    if (mapping.realtorField === 'propertyAddress') {
      realtorValue = [
        realtorProperty.StreetNumber,
        realtorProperty.StreetName,
        realtorProperty.City
      ].filter(Boolean).join(" ");
    }
    
    if (mapping.realtorField === 'mlsNumber') {
      realtorValue = realtorProperty.ListingKey || 
                    realtorProperty.MlsNumber || 
                    realtorProperty.MLSNumber || 
                    realtorProperty.mlsNumber || 
                    null;
    }
    
    const normalizedPropertyValue = propertyValue !== null && propertyValue !== undefined 
      ? String(propertyValue).trim().toLowerCase() 
      : '';
    const normalizedRealtorValue = realtorValue !== null && realtorValue !== undefined 
      ? String(realtorValue).trim().toLowerCase() 
      : '';
    
    if (normalizedPropertyValue !== normalizedRealtorValue) {
      differences.push({
        field: mapping.label,
        propertyValue: mapping.format(propertyValue),
        realtorValue: mapping.format(realtorValue),
        propertyRawValue: propertyValue,
        realtorRawValue: realtorValue,
      });
    }
  });

  return differences;
};

export const mapRealtorDataToPropertyListing = (realtorProperty: any) => {
  const mappedData: any = {};

  if (realtorProperty.ListingKey || realtorProperty.MlsNumber || realtorProperty.MLSNumber || realtorProperty.mlsNumber) {
    mappedData.mlsNumber = realtorProperty.ListingKey || 
                           realtorProperty.MlsNumber || 
                           realtorProperty.MLSNumber || 
                           realtorProperty.mlsNumber || 
                           null;
  }

  if (realtorProperty.ListPrice !== undefined && realtorProperty.ListPrice !== null) {
    mappedData.listingPrice = parseFloat(realtorProperty.ListPrice);
  }

  if (realtorProperty.PropertyType !== undefined && realtorProperty.PropertyType !== null) {
    mappedData.propertyType = realtorProperty.PropertyType || null;
  }

  if (realtorProperty.MlsStatus !== undefined && realtorProperty.MlsStatus !== null) {
    mappedData.listingStatus = realtorProperty.MlsStatus || null;
  }

  const addressParts = [
    realtorProperty.StreetNumber,
    realtorProperty.StreetName,
    realtorProperty.City
  ].filter(Boolean);
  
  if (addressParts.length > 0) {
    mappedData.address = addressParts.join(" ").trim() || null;
  }

  if (realtorProperty.ExpirationDate) {
    mappedData.expiryDate = realtorProperty.ExpirationDate;
  } else if (realtorProperty.ExpiryDate) {
    mappedData.expiryDate = realtorProperty.ExpiryDate;
  }

  if (realtorProperty.BedroomsTotal !== undefined && realtorProperty.BedroomsTotal !== null) {
    mappedData.bedrooms = parseInt(realtorProperty.BedroomsTotal) || null;
  }

  if (realtorProperty.BathroomsTotalInteger !== undefined && realtorProperty.BathroomsTotalInteger !== null) {
    mappedData.bathrooms = parseInt(realtorProperty.BathroomsTotalInteger) || null;
  }

  if (realtorProperty.LivingArea !== undefined && realtorProperty.LivingArea !== null) {
    mappedData.squareFeet = parseFloat(realtorProperty.LivingArea) || null;
  }

  if (realtorProperty.LotSizeSquareFeet !== undefined && realtorProperty.LotSizeSquareFeet !== null) {
    mappedData.lotSize = parseFloat(realtorProperty.LotSizeSquareFeet) || null;
  }

  if (realtorProperty.YearBuilt !== undefined && realtorProperty.YearBuilt !== null) {
    mappedData.yearBuilt = parseInt(realtorProperty.YearBuilt) || null;
  }

  return mappedData;
};

