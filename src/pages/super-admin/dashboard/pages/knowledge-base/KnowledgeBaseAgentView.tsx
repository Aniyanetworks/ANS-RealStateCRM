import React, { useState, useMemo } from "react";
import { Typography, Empty, Card } from "antd";
import { useGetKnowledgeBaseQuery } from "../../../../../redux/api/superadmin/knowledgeBase/knowledgeBaseSlice";
import KnowledgeTable from "./components/KnowledgeTable";
import HeaderSection from "./components/HeaderSection";
import GlobalSearch from "./components/GlobalSearch";

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

const KnowledgeBase: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data, isLoading } = useGetKnowledgeBaseQuery([]);

  const items: KnowledgeItem[] = useMemo(() => {
    return Array.isArray(data) ? data : data?.data || [];
  }, [data]);

  const hasActiveFilter = useMemo(() => {
    return searchTerm !== "" || selectedType !== "all";
  }, [searchTerm, selectedType]);

  const filteredData = useMemo(() => {
    let filtered = items;

    if (selectedType !== "all") {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => 
        item.title?.toLowerCase().includes(searchTermLower) ||
        item.description?.toLowerCase().includes(searchTermLower)
      );
    }

    return filtered;
  }, [items, searchTerm, selectedType]);

  const suggestions = useMemo(() => {
    if (!searchTerm || !showSuggestions) return [];
    
    return items
      .filter((item: KnowledgeItem) => {
        const cleanDescription = item.description?.replace(/<[^>]*>/g, '') || '';
        return (
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cleanDescription.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
      .slice(0, 5);
  }, [items, searchTerm, showSuggestions]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(true);
  };

  const handleSearchSelect = (item: KnowledgeItem) => {
    setSearchTerm(item.title);
    setSelectedType(item.type);
    setShowSuggestions(false);
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setSearchTerm("");
    setShowSuggestions(false);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSearchFocus = () => {
    if (searchTerm) {
      setShowSuggestions(true);
    }
  };
  
  const showEmptyResults = hasActiveFilter && !isLoading && filteredData.length === 0;

  return (
    <div style={{ padding: "0px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      
      <HeaderSection />

      <GlobalSearch
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchSelect={handleSearchSelect}
        onTypeSelect={handleTypeSelect}
        onSearchBlur={handleSearchBlur}
        onSearchFocus={handleSearchFocus}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        items={items}
        selectedType={selectedType}
      />

      {showEmptyResults && (
        <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Empty
            description={
              <div>
                <Text style={{ fontSize: '16px' }}>
                  No results found for your search
                </Text>
                <br />
                <Text type="secondary">
                  Try adjusting your search terms or select a different category
                </Text>
              </div>
            }
          />
        </Card>
      )}

      {!showEmptyResults && (
        <KnowledgeTable
          data={hasActiveFilter ? filteredData : items}
          loading={isLoading}
        />
      )}
    </div>
  );
};

export default KnowledgeBase;