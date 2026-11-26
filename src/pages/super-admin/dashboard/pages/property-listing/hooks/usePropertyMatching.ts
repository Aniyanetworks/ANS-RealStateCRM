/* eslint-disable @typescript-eslint/no-explicit-any */

import toast from 'react-hot-toast';
import {
  normalizeAddress,
  extractAddressParts,
  calculateSimilarity,
} from '../utils/propertyListingUtils';
import { comparePropertyData } from '../utils/propertyComparisonUtils';

export const usePropertyMatching = (
  realtorData: any,
  tableData: any[]
) => {
  const findAndMatchProperties = () => {
    if (!realtorData?.data || !tableData) {
      toast.error("Unable to fetch data for matching");
      return { pairs: [], propertiesWithoutMLSCount: 0 };
    }

    const propertiesWithoutMLS = tableData.filter((listing: any) => {
      const mls = listing.mlsNumber;
      if (!mls) return true;
      const trimmedMls = String(mls).trim().toLowerCase();
      return trimmedMls === '' || trimmedMls === 'null';
    });

    if (propertiesWithoutMLS.length === 0) {
      toast.success("All property listings already have MLS numbers!");
      return { pairs: [], propertiesWithoutMLSCount: 0 };
    }

    const pairs: any[] = [];

    propertiesWithoutMLS.forEach((property: any) => {
      if (!property.propertyAddress) return;

      const propertyAddressParts = extractAddressParts(property.propertyAddress);
      const propertyStreetParts = [
        propertyAddressParts.streetNumber,
        propertyAddressParts.streetName
      ].filter(Boolean);
      
      if (propertyStreetParts.length === 0) return;
      
      const normalizedPropertyStreet = normalizeAddress(propertyStreetParts);
      if (!normalizedPropertyStreet) return;

      const potentialMatches: any[] = [];
      
      realtorData.data.forEach((realtorProperty: any) => {
        let realtorStreetParts: string[] = [];
        
        if (realtorProperty.StreetNumber && realtorProperty.StreetName) {
          realtorStreetParts = [
            String(realtorProperty.StreetNumber).trim(),
            String(realtorProperty.StreetName).trim()
          ];
        } else if (realtorProperty.StreetName) {
          const extracted = extractAddressParts(realtorProperty.StreetName);
          if (extracted.streetNumber && extracted.streetName) {
            realtorStreetParts = [extracted.streetNumber, extracted.streetName];
          } else {
            realtorStreetParts = [realtorProperty.StreetName];
          }
        } else if (realtorProperty.StreetNumber) {
          realtorStreetParts = [String(realtorProperty.StreetNumber).trim()];
        }

        if (realtorStreetParts.length === 0) return;

        const normalizedRealtorStreet = normalizeAddress(realtorStreetParts);
        const similarity = calculateSimilarity(normalizedPropertyStreet, normalizedRealtorStreet);
        
        const isExactMatch = normalizedRealtorStreet === normalizedPropertyStreet;
        const isPotentialMatch = similarity >= 50;
        
        if (isExactMatch || isPotentialMatch) {
          potentialMatches.push({
            ...realtorProperty,
            similarity: isExactMatch ? 100 : similarity,
            isExactMatch: isExactMatch,
            normalizedAddress: normalizedRealtorStreet,
            realtorStreetParts: realtorStreetParts
          });
        }
      });
      
      potentialMatches.sort((a, b) => {
        if (a.isExactMatch && !b.isExactMatch) return -1;
        if (!a.isExactMatch && b.isExactMatch) return 1;
        return b.similarity - a.similarity;
      });
      
      const matchingRealtorProperties = potentialMatches.filter(m => m.isExactMatch || m.similarity >= 50);

      matchingRealtorProperties.forEach((realtorProperty: any) => {
        const mlsNumber = realtorProperty.ListingKey || 
                         realtorProperty.MlsNumber || 
                         realtorProperty.MLSNumber || 
                         realtorProperty.mlsNumber || 
                         "";

        pairs.push({
          pairId: `${property.uuid}_${realtorProperty.ListingKey}`,
          propertyListing: {
            uuid: property.uuid,
            propertyAddress: property.propertyAddress,
            currentMLS: property.mlsNumber || "N/A",
            id: property.id,
          },
          realtorProperty: {
            ListingKey: realtorProperty.ListingKey,
            mlsNumber: mlsNumber,
            propertyAddress: [
              realtorProperty.StreetNumber,
              realtorProperty.StreetName,
              realtorProperty.City
            ].filter(Boolean).join(" "),
            ListPrice: realtorProperty.ListPrice,
            PropertyType: realtorProperty.PropertyType,
            MlsStatus: realtorProperty.MlsStatus,
          },
          similarity: realtorProperty.similarity || 100,
          isExactMatch: realtorProperty.isExactMatch !== false
        });
      });
    });

    return { pairs, propertiesWithoutMLSCount: propertiesWithoutMLS.length };
  };

  const findAndMatchPropertiesForDataSync = () => {
    if (!realtorData?.data || !tableData) {
      toast.error("Unable to fetch data for matching");
      return { pairs: [], propertiesWithMLSCount: 0 };
    }

    const propertiesWithMLS = tableData.filter((listing: any) => {
      const mls = listing.mlsNumber;
      if (!mls) return false;
      const trimmedMls = String(mls).trim().toLowerCase();
      return trimmedMls !== '' && trimmedMls !== 'null';
    });

    if (propertiesWithMLS.length === 0) {
      toast.error("No property listings with MLS numbers found!");
      return { pairs: [], propertiesWithMLSCount: 0 };
    }

    const pairs: any[] = [];

    propertiesWithMLS.forEach((property: any) => {
      const propertyMLS = String(property.mlsNumber).trim();

      const matchingRealtorProperty = realtorData.data.find((realtorProperty: any) => {
        const realtorMLS = realtorProperty.ListingKey || 
                          realtorProperty.MlsNumber || 
                          realtorProperty.MLSNumber || 
                          realtorProperty.mlsNumber || 
                          "";
        return String(realtorMLS).trim() === propertyMLS;
      });

      if (matchingRealtorProperty) {
        const differences = comparePropertyData(property, matchingRealtorProperty, tableData);
        
        pairs.push({
          pairId: `${property.uuid}_${matchingRealtorProperty.ListingKey}`,
          propertyListing: {
            uuid: property.uuid,
            propertyAddress: property.propertyAddress,
            mlsNumber: property.mlsNumber,
            id: property.id,
            fullData: property,
          },
          realtorProperty: {
            ListingKey: matchingRealtorProperty.ListingKey,
            mlsNumber: matchingRealtorProperty.ListingKey || 
                     matchingRealtorProperty.MlsNumber || 
                     matchingRealtorProperty.MLSNumber || 
                     matchingRealtorProperty.mlsNumber || 
                     "",
            propertyAddress: [
              matchingRealtorProperty.StreetNumber,
              matchingRealtorProperty.StreetName,
              matchingRealtorProperty.City
            ].filter(Boolean).join(" "),
            ListPrice: matchingRealtorProperty.ListPrice,
            PropertyType: matchingRealtorProperty.PropertyType,
            MlsStatus: matchingRealtorProperty.MlsStatus,
            fullRealtorData: matchingRealtorProperty,
          },
          differencesCount: differences.length,
          hasDifferences: differences.length > 0,
        });
      }
    });

    return { pairs, propertiesWithMLSCount: propertiesWithMLS.length };
  };

  return {
    findAndMatchProperties,
    findAndMatchPropertiesForDataSync,
  };
};

