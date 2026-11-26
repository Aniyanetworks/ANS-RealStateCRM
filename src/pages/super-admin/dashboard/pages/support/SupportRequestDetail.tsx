import React from 'react';
import { useGetSupportRequestDetailQuery } from '../../../../../redux/api/common/supportSlice';
const SupportRequestDetail: React.FC = () => {
  const { data: request } = useGetSupportRequestDetailQuery('');
  return (
     <div>
      <h1>Support Request Detail for ID: {request?.id}</h1>
    </div>
  );
};

export default SupportRequestDetail; 