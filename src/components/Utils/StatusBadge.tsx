import { Tag } from "antd";

const statusMap: { [key: string]: { color: string; text: string } } = {
  active: { color: 'success', text: 'Active' },
  inactive: { color: 'error', text: 'Inactive' },
  pending: { color: 'warning', text: 'Pending' },
  approved: { color: 'success', text: 'Approved' },
  underReview: { color: 'warning', text: 'Under Review' },
  draft: { color: 'default', text: 'Draft' },
  blocked: { color: 'error', text: 'Blocked' },
  rejected: { color: 'error', text: 'Rejected' },
  expired: { color: 'default', text: 'Expired' },
};

const getStatusBadge = (status: string) => {
  const statusInfo = statusMap[status];

  if (!statusInfo) {
    return <span>Unknown Status</span>;
  }

  return (
    <div>
      <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
    </div>
  );
};

export default getStatusBadge;