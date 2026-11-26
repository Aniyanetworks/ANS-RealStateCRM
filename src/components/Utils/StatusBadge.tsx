import { Tag } from "antd";

const statusMap: { [key: string]: { color: string; text: string } } = {
  active: { color: 'success', text: 'Active' }, // Green
  inactive: { color: 'error', text: 'Inactive' }, // Red
  pending: { color: 'warning', text: 'Pending' }, // Yellow
  approved: { color: 'success', text: 'Approved' }, // Green
  underReview: { color: 'warning', text: 'Under Review' }, // Yellow
  draft: { color: 'default', text: 'Draft' }, // Default
  blocked: { color: 'error', text: 'Blocked' }, // Red
  rejected: { color: 'error', text: 'Rejected' }, // Red
  expired: { color: 'default', text: 'Expired' }, // Default
};

const getStatusBadge = (status: string) => {
  const statusInfo = statusMap[status];

  if (!statusInfo) {
    return <span>Unknown Status</span>;
  }

  return (
    // <span
    //   style={{
    //     backgroundColor: statusInfo.color,
    //     color: '#fff',
    //     padding: '2px 8px',
    //     borderRadius: '4px',
    //     fontSize: '12px',
    //     fontWeight: 'bold',
    //   }}
    // >
    //   {statusInfo.text}
    // </span>
    <div>
      <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
    </div>
  );
};

export default getStatusBadge;