// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React from 'react';
import { Input, Card, List, Typography, Space, Tag } from 'antd';
import { 
  SearchOutlined, 
  FileTextOutlined, 
  PlayCircleOutlined, 
  LaptopOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface KnowledgeItem {
  id: number;
  uuid: string;
  title: string;
  description: string;
  type: "document" | "tutorial" | "training";
  url: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface GlobalSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchSelect: (item: KnowledgeItem) => void;
  onTypeSelect: (type: string) => void;
  onSearchBlur: () => void;
  onSearchFocus: () => void;
  suggestions: KnowledgeItem[];
  showSuggestions: boolean;
  items: KnowledgeItem[];
  selectedType: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  searchTerm,
  onSearchChange,
  onSearchSelect,
  onTypeSelect,
  onSearchBlur,
  onSearchFocus,
  suggestions,
  showSuggestions,
  items,
  selectedType,
}) => {
  const cleanText = (html: string): string => {
    if (!html) return '';
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/style="[^"]*"/g, '')
      .replace(/class="[^"]*"/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  };

  const typeCards = [
    {
      type: "document",
      label: "Referral Forms",
      color: "#1890ff",
      icon: <FileTextOutlined />,
      count: items.filter(item => item.type === "document").length
    },
    {
      type: "tutorial",
      label: "Tutorial Videos",
      color: "#52c41a",
      icon: <PlayCircleOutlined />,
      count: items.filter(item => item.type === "tutorial").length
    },
    {
      type: "training",
      label: "Training and Appointments",
      color: "#faad14",
      icon: <LaptopOutlined />,
      count: items.filter(item => item.type === "training").length
    },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleSuggestionClick = (item: KnowledgeItem) => {
    onSearchSelect(item);
  };

  const getCleanDescription = (description: string, maxLength: number = 60): string => {
    const clean = cleanText(description);
    return clean.length > maxLength ? clean.substring(0, maxLength) + '...' : clean;
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return cleanText(text);
    const cleanTextContent = cleanText(text);
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = cleanTextContent.split(regex);
    return parts.map((part) =>
      regex.test(part) ? 
        `<mark style="background-color: #ffeb3b; padding: 0 2px; border-radius: 2px;">${part}</mark>` : 
        part
    ).join('');
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "8px 12px" }}>
      <div className='flex gap-3' style={{ position: 'relative', marginBottom: '8px' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#999', fontSize: '12px' }} />}
          placeholder="Search knowledge base..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          size="small"
          style={{
            height: '30px',
            fontSize: '12px',
            borderRadius: '4px',
          }}
          allowClear
        />

        {showSuggestions && searchTerm && suggestions.length > 0 && (
          <Card
            size="small"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              marginTop: '4px',
              maxHeight: '200px',
              overflow: 'auto'
            }}
            bodyStyle={{ padding: '0' }}
          >
            <List
              size="small"
              dataSource={suggestions}
              renderItem={(item: KnowledgeItem) => (
                <List.Item
                  style={{ padding: '4px 8px', cursor: 'pointer' }}
                  onClick={() => handleSuggestionClick(item)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span
                        style={{ fontSize: '12px', fontWeight: 500 }}
                        dangerouslySetInnerHTML={{
                          __html: highlightText(item.title, searchTerm)
                        }}
                      />
                      <Tag color={item.type === "document" ? "blue" : item.type === "tutorial" ? "green" : "orange"} style={{ fontSize: '10px' }}>
                        {item.type}
                      </Tag>
                    </div>
                    <span style={{ fontSize: '11px', color: '#888' }}
                      dangerouslySetInnerHTML={{ 
                        __html: highlightText(getCleanDescription(item.description, 40), searchTerm) 
                      }}
                    />
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {typeCards.map((card) => (
          <div
            key={card.type}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: `1px solid ${selectedType === card.type ? card.color : '#d9d9d9'}`,
              backgroundColor: selectedType === card.type ? card.color : '#fff',
              color: selectedType === card.type ? '#fff' : '#444',
              fontSize: '11px',
              cursor: 'pointer',
              transition: '0.2s',
            }}
            onClick={() => onTypeSelect(card.type)}
          >
            {card.icon} {card.count} {card.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobalSearch;
