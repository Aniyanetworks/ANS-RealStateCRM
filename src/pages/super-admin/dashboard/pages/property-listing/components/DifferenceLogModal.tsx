/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal, Button, Table } from "antd";

interface DifferenceLogModalProps {
  isVisible: boolean;
  selectedPair: any;
  differenceLog: any[];
  onClose: () => void;
}

export const DifferenceLogModal = ({
  isVisible,
  selectedPair,
  differenceLog,
  onClose,
}: DifferenceLogModalProps) => {
  return (
    <Modal
      title={`Data Differences Log - ${selectedPair?.propertyListing?.propertyAddress || 'Property'}`}
      open={isVisible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {differenceLog.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-green-600 font-semibold">No differences found. All data matches!</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>{differenceLog.length}</strong> field(s) have different values between Property Listing and IDX Property.
            </p>
          </div>
          <Table
            columns={[
              {
                title: "Field",
                dataIndex: "field",
                key: "field",
                width: 200,
                render: (field: string) => (
                  <span className="font-semibold text-gray-700">{field}</span>
                ),
              },
              {
                title: "Current Value (Property Listing)",
                dataIndex: "propertyValue",
                key: "propertyValue",
                width: 250,
                render: (value: string) => (
                  <span className="text-red-600 bg-red-50 px-2 py-1 rounded">{value}</span>
                ),
              },
              {
                title: "New Value (IDX Property)",
                dataIndex: "realtorValue",
                key: "realtorValue",
                width: 250,
                render: (value: string) => (
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded">{value}</span>
                ),
              },
            ]}
            dataSource={differenceLog}
            rowKey="field"
            pagination={false}
            size="small"
          />
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> When you sync, the Property Listing will be updated with the IDX Property values shown above.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

