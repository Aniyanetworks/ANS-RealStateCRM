/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useSyncMlsNumberMutation,
  useSyncPropertyFromRealtorMutation,
} from '../../../../../../redux/api/superadmin/propertyListingDataSlice';
import { mapRealtorDataToPropertyListing } from '../utils/propertyComparisonUtils';

export const usePropertyListingSync = (refetch: () => void) => {
  const [syncMlsNumber] = useSyncMlsNumberMutation();
  const [syncPropertyFromRealtor] = useSyncPropertyFromRealtorMutation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);

  const handleSyncMLS = async (
    selectedPairsToSync: string[],
    matchedPairs: any[],
    onComplete: () => void
  ) => {
    if (selectedPairsToSync.length === 0) {
      toast.error("Please select at least one pair to sync");
      return;
    }

    setIsSyncing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const pairId of selectedPairsToSync) {
        const pair = matchedPairs.find(p => p.pairId === pairId);
        if (!pair) continue;

        const mlsNumber = pair.realtorProperty.mlsNumber;
        if (!mlsNumber) {
          console.warn(`Skipping pair with no MLS number:`, pair);
          errorCount++;
          continue;
        }

        try {
          const response = await syncMlsNumber({
            uuid: pair.propertyListing.uuid,
            mlsNumber: mlsNumber,
          }).unwrap();

          if (response?.status === true) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error: any) {
          console.error(`Error syncing MLS for pair ${pairId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully synced ${successCount} MLS number(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to sync ${errorCount} MLS number(s)`);
      }

      await refetch();
      onComplete();
    } catch (error) {
      toast.error("An error occurred during sync");
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncUpdatedData = async (
    selectedDataPairsToSync: string[],
    matchedDataPairs: any[],
    onComplete: () => void
  ) => {
    if (selectedDataPairsToSync.length === 0) {
      toast.error("Please select at least one pair to sync");
      return;
    }

    setIsSyncingData(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const pairId of selectedDataPairsToSync) {
        const pair = matchedDataPairs.find(p => p.pairId === pairId);
        if (!pair) continue;

        try {
          const mappedData = mapRealtorDataToPropertyListing(pair.realtorProperty.fullRealtorData);
          

          const response = await syncPropertyFromRealtor({
            uuid: pair.propertyListing.uuid,
            realtorData: mappedData,
          }).unwrap();

          if (response?.status === true) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to sync data for pair ${pairId}:`, response);
          }
        } catch (error: any) {
          console.error(`Error syncing data for pair ${pairId}:`, error);
          const errorMessage = error?.data?.message || error?.message || "Unknown error";
          toast.error(`Error syncing ${pair.propertyListing.propertyAddress}: ${errorMessage}`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully synced updated data for ${successCount} property listing(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to sync ${errorCount} property listing(s)`);
      }

      await refetch();
      onComplete();
    } catch (error) {
      toast.error("An error occurred during data sync");
      console.error("Data sync error:", error);
    } finally {
      setIsSyncingData(false);
    }
  };

  return {
    handleSyncMLS,
    handleSyncUpdatedData,
    isSyncing,
    isSyncingData,
  };
};

