/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal, Button, Table } from "antd";
import toast from "react-hot-toast";
import TableLoader from "../../../../../../components/loader/TableLoader";

interface SyncMLSModalProps {
  isVisible: boolean;
  isLoading: boolean;
  matchedPairs: any[];
  selectedPairsToSync: string[];
  onCancel: () => void;
  onSelectAll: () => void;
  onSync: () => void;
  onSelectionChange: (selectedKeys: React.Key[]) => void;
  isSyncing: boolean;
}

export const SyncMLSModal = ({
  isVisible,
  isLoading,
  matchedPairs,
  selectedPairsToSync,
  onCancel,
  onSelectAll,
  onSync,
  onSelectionChange,
  isSyncing,
}: SyncMLSModalProps) => {
  const handleSyncClick = () => {
    if (isSyncing) {
      toast.error("Sync is already in progress. Please wait...");
      return;
    }
    if (selectedPairsToSync.length === 0) {
      toast.error("Please select at least one property pair to sync");
      return;
    }
    onSync();
  };

  return (
    <Modal
      title="Sync MLS Numbers from IDX"
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
          style={{ display: 'inline-block' }}
          onClick={(e) => {
            if (selectedPairsToSync.length === 0 || isSyncing) {
              e.stopPropagation();
              handleSyncClick();
            }
          }}
        >
          <Button
            type="primary"
            className="mx-3"
            onClick={handleSyncClick}
            loading={isSyncing}
            disabled={selectedPairsToSync.length === 0 || isSyncing}
            style={{ pointerEvents: selectedPairsToSync.length === 0 || isSyncing ? 'none' : 'auto' }}
          >
            Sync Selected ({selectedPairsToSync.length})
          </Button>
        </span>,
      ]}
    >
      {isLoading ? (
        <TableLoader />
      ) : matchedPairs.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">No matched pairs found.</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          <Table
            rowSelection={{
              type: "checkbox",
              selectedRowKeys: selectedPairsToSync,
              onChange: onSelectionChange,
            }}
            columns={[
              {
                title: "Property Listing Address",
                key: "propertyAddress",
                width: 250,
                render: (_, record: any) => (
                  <div>
                    <div className="text-xs text-gray-600">{record.propertyListing.propertyAddress}</div>
                    <div className="text-xs text-gray-500 mt-1">Current MLS: {record.propertyListing.currentMLS}</div>
                  </div>
                ),
              },
              {
                title: "IDX Property",
                key: "realtorProperty",
                width: 250,
                render: (_, record: any) => (
                  <div>
                    <div className="text-xs text-gray-600">{record.realtorProperty.propertyAddress}</div>
                    <div className="text-xs text-blue-600 mt-1">MLS: {record.realtorProperty.mlsNumber}</div>
                  </div>
                ),
              },
              {
                title: "Realtor MLS Number",
                dataIndex: ["realtorProperty", "mlsNumber"],
                key: "mlsNumber",
                width: 150,
                render: (mlsNumber: string) => (
                  <span className="font-semibold text-blue-600">{mlsNumber || "N/A"}</span>
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
                title: "Match Score",
                dataIndex: "similarity",
                key: "similarity",
                width: 100,
                render: (similarity: number, record: any) => (
                  <span className={record.isExactMatch ? "text-green-600 font-semibold" : "text-orange-600"}>
                    {record.isExactMatch ? "Exact" : `${Math.round(similarity)}%`}
                  </span>
                ),
              },
            ]}
            dataSource={matchedPairs}
            rowKey="pairId"
            pagination={{ pageSize: 20 }}
          />
        </div>
      )}
    </Modal>
  );
};

