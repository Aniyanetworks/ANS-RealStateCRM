// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React from 'react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const HeaderSection: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
      <Title 
        level={3} 
        style={{ marginBottom: '4px', fontWeight: 600 }}
      >
        Knowledge Base
      </Title>
      <Text style={{ fontSize: '13px', color: '#666' }}>
        All the resources you need to get the most out of our platform
      </Text>
    </div>
  );
};

export default HeaderSection;
