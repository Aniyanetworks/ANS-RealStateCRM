/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal, Button, Table } from "antd";
import toast from "react-hot-toast";
import TableLoader from "../../../../../../components/loader/TableLoader";

interface SyncDataModalProps {
  isVisible: boolean;
  isLoading: boolean;
  matchedDataPairs: any[];
  selectedDataPairsToSync: string[];
  onCancel: () => void;
  onSelectAll: () => void;
  onSync: () => void;
  onSelectionChange: (selectedKeys: React.Key[]) => void;
  isSyncing: boolean;
  onViewDifferenceLog: (record: any) => void;
}

export const SyncDataModal = ({
  isVisible,
  isLoading,
  matchedDataPairs,
  selectedDataPairsToSync,
  onCancel,
  onSelectAll,
  onSync,
  onSelectionChange,
  isSyncing,
  onViewDifferenceLog,
}: SyncDataModalProps) => {
  const handleSyncClick = () => {
    if (isSyncing) {
      toast.error("Sync is already in progress. Please wait...");
      return;
    }
    if (selectedDataPairsToSync.length === 0) {
      toast.error("Please select at least one property pair to sync");
      return;
    }
    onSync();
  };

  return (
    <Modal
      title="Sync Updated Data from IDX"
      open={isVisible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="selectAll" onClick={onSelectAll}>
          Select All
        </Button>,
        <span
          key="sync"
          className="mx-1"
          style={{ display: 'inline-block' }}
          onClick={(e) => {
            if (selectedDataPairsToSync.length === 0 || isSyncing) {
              e.stopPropagation();
              handleSyncClick();
            }
          }}
        >
          <Button
            type="primary"
            onClick={handleSyncClick}
            loading={isSyncing}
            disabled={selectedDataPairsToSync.length === 0 || isSyncing}
            style={{ pointerEvents: selectedDataPairsToSync.length === 0 || isSyncing ? 'none' : 'auto' }}
          >
            Sync Selecteddd ({selectedDataPairsToSync.length})
          </Button>
        </span>,
      ]}
    >
      {isLoading ? (
        <TableLoader />
      ) : matchedDataPairs.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">No properties with differences found.</p>
          <p className="text-sm text-gray-400 mt-2">All matched properties are already in sync.</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          <Table
            rowSelection={{
              type: "checkbox",
              selectedRowKeys: selectedDataPairsToSync,
              onChange: onSelectionChange,
            }}
            columns={[
              {
                title: "Property Listing",
                key: "propertyListing",
                width: 250,
                render: (_, record: any) => (
                  <div>
                    {/* <div className="font-semibold text-sm">Property Listing:</div> */}
                    <div className="text-xs text-gray-600">{record.propertyListing.propertyAddress}</div>
                    <div className="text-xs text-gray-500 mt-1">MLS: {record.propertyListing.mlsNumber}</div>
                  </div>
                ),
              },
              {
                title: "IDX Property",
                key: "realtorProperty",
                width: 250,
                render: (_, record: any) => (
                  <div>
                    {/* <div className="font-semibold text-sm">IDX Property:</div> */}
                    <div className="text-xs text-gray-600">{record.realtorProperty.propertyAddress}</div>
                    <div className="text-xs text-blue-600 mt-1">MLS: {record.realtorProperty.mlsNumber}</div>
                  </div>
                ),
              },
              {
                title: "List Price",
                dataIndex: ["realtorProperty", "ListPrice"],
                key: "listPrice",
                width: 120,
                render: (price: number) => (
                  <span>${price?.toLocaleString() || "N/A"}</span>
                ),
              },
              {
                title: "Property Type",
                dataIndex: ["realtorProperty", "PropertyType"],
                key: "propertyType",
                width: 150,
              },
              {
                title: "MLS Status",
                dataIndex: ["realtorProperty", "MlsStatus"],
                key: "mlsStatus",
                width: 120,
              },
              {
                title: "Differences",
                key: "differences",
                width: 120,
                render: (_, record: any) => (
                  <div className="flex flex-col gap-1">
                    {record.hasDifferences ? (
                      <>
                        <span className="text-orange-600 font-semibold text-xs">
                          {record.differencesCount} difference(s)
                        </span>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => onViewDifferenceLog(record)}
                          className="p-0 h-auto text-blue-600"
                        >
                          View Log
                        </Button>
                      </>
                    ) : (
                      <span className="text-green-600 font-semibold text-xs">No differences</span>
                    )}
                  </div>
                ),
              },
            ]}
            dataSource={matchedDataPairs}
            rowKey="pairId"
            pagination={{ pageSize: 20 }}
          />
        </div>
      )}
    </Modal>
  );
};

