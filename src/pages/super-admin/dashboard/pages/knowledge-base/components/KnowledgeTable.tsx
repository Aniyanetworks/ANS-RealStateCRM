// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useRef, useState, useEffect } from "react";
import { Typography, Tooltip, Button,  Modal, Input } from "antd";
import { FileTextOutlined,  AlignLeftOutlined, YoutubeOutlined } from "@ant-design/icons";
import logo from "/logo.png";

const { Link } = Typography;

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

interface KnowledgeFileManagerProps {
  data: KnowledgeItem[];
  loading: boolean;
}

const KnowledgeFileManager: React.FC<KnowledgeFileManagerProps> = ({ data, loading }) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number | string>>(new Set());

  const [sidebarWidth, setSidebarWidth] = useState<number>(310);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<any[]>([]);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);

  // Group documents by type
  useEffect(() => {
    if (!loading && data) {
      setFetchLoading(true);

      const documentsByType = data.reduce((acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = [];
        }
        acc[item.type].push({
          ...item,
          fileData: [item],
          sortOrder: item.id
        });
        return acc;
      }, {});

      // Convert to array format similar to your original structure
      const documents = Object.keys(documentsByType).map(type => ({
        id: type,
        name: type.charAt(0).toUpperCase() + type.slice(1) + "s",
        fileData: documentsByType[type],
        sortOrder: type === "document" ? 1 : type === "tutorial" ? 2 : 3
      })).sort((a, b) => a.sortOrder - b.sortOrder);

      setKnowledgeDocuments(documents || []);
      setFetchLoading(false);
    }
  }, [data, loading]);

  const [pdfToView, setPdfToView] = useState<KnowledgeItem | any>({});
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [changeFileId, setChangeFileId] = useState<string | null>(null);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isRejectReasonViewModalVisible, setIsRejectReasonViewModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [changeFileType, setChangeFileType] = useState<string | null>(null);

  const statusOptions = [
    { value: "approved", label: "Approved" },
    { value: "underReview", label: "Under Review" },
    { value: "rejected", label: "Rejected" },
  ];

  // Add this function to determine content type
  const getContentType = (item: KnowledgeItem) => {
    if (item.type === "document") {
      return "file"; // PDF or other files
    } else if (item.type === "tutorial" || item.type === "training") {
      return "youtube"; // YouTube URLs
    }
    return "file"; // default
  };

  // Function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Function to get embed URL for YouTube
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url; // Fallback to original URL if not a valid YouTube URL
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "green";
      case "underReview":
        return "#9F8667";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  const toggleCategory = (id: number | string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(id)) {
      newCollapsed.delete(id);
    } else {
      newCollapsed.add(id);
    }
    setCollapsedCategories(newCollapsed);
  };

  useEffect(() => {
  // Clear PDF view when knowledgeDocuments changes (data loaded or changed)
  setPdfToView({});
  setError(null);
  setFileLoading(false);
}, [knowledgeDocuments]);

  

  const cancelDelete = () => {
    setIsRejectModalVisible(false);
    setIsRejectReasonViewModalVisible(false);
    setRejectReason("");
    setChangeFileId(null);
  };

  

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (pdfToView?.status) {
      setSelectedStatus(pdfToView?.status);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [pdfToView]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e) => {
    if (isResizing) {
      const newWidth = Math.max(300, Math.min(e.clientX, 500));
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const clearLoadingState = () => {
    setFileLoading(false);
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  };

  const handleViewClick = (file: KnowledgeItem) => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    setFileLoading(true);
    setPdfToView(file);
    setError(null);
    
    const timeout = setTimeout(() => {
      setFileLoading(false);
      setLoadingTimeout(null);
    }, 3000);
    
    setLoadingTimeout(timeout);
  };

  const handleDownload = async () => {
    const fileUrl = pdfToView.url;

    // Don't try to download YouTube videos
    if (getContentType(pdfToView) === "youtube") {
      window.open(pdfToView.url, '_blank');
      return;
    }

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = pdfToView.title || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };

  const sliceSize = Math.floor((sidebarWidth - 300) / 15) + (sidebarWidth > 310 ? 35 : 28);

  const getCategory = (cat_name: string) => {
    // alert(cat_name)
  let new_cat: string;

  switch (cat_name) {
    case "Documents":
      new_cat = "Referral Forms";
      break;
    case "Tutorials":
      new_cat = "Tutorial Videos";
      break;
    case "Trainings":
      new_cat = "Training and Appointments";
      break;
    default:
      new_cat = cat_name; // fallback if no match
  }

  return new_cat;
};


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div>
        <div className="flex h-[calc(100vh-7rem)]">
          {/* Sidebar */}
          <div
            style={{ width: `${sidebarWidth}px` }}
            className={`absolute lg:relative rounded-l-lg bg-white h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden py-5 ${
              collapsed
                ? collapsed && windowWidth < 1024
                  ? "block"
                  : "hidden"
                : !collapsed && windowWidth < 1024
                ? "hidden"
                : "block"
            }`}
          >
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`absolute top-2 w-[30px] right-0 lg:hidden ${!collapsed && "hidden"}`}
            >
              <svg
                fill="#000"
                height="15px"
                width="15px"
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 330 330"
              >
                <path
                  id="XMLID_92_"
                  d="M111.213,165.004L250.607,25.607c5.858-5.858,5.858-15.355,0-21.213c-5.858-5.858-15.355-5.858-21.213,0.001
                  l-150,150.004C76.58,157.211,75,161.026,75,165.004c0,3.979,1.581,7.794,4.394,10.607l150,149.996
                  C232.322,328.536,236.161,330,240,330s7.678-1.464,10.607-4.394c5.858-5.858,5.858-15.355,0-21.213L111.213,165.004z"
                />
              </svg>
            </button>

            {/* Knowledge Documents List */}
            {knowledgeDocuments?.map((category: any, index: number) => (
              <div key={index} className="">
                <div>                  
                    <div className={`px-5 py-2 hover:bg-[#F6F4F0] text-[#243451]`}>
                      <div>
                        <div
                          onClick={() => toggleCategory(category.id)}
                          className="relative flex cursor-pointer justify-between items-center"
                        >
                          <Tooltip placement="right" title={category.name} color="#fff">
                            <div className="flex items-center gap-2">
                              {category.fileData?.length == 0 ? (
                                <svg
                                  width="20px"
                                  height="20px"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z"
                                    stroke="#000000"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  width="15px"
                                  height="15px"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M0 1H6L9 4H16V14H0V1Z" fill="#000000" />
                                </svg>
                              )}
                              <p>
                                {category.name.length > sliceSize
                                  ? getCategory(category.name).slice(0, sliceSize) + "..."
                                  : getCategory(category.name)}
                              </p>
                            </div>
                          </Tooltip>

                          {category.fileData?.length == 0 ? (
                            ""
                          ) : (
                            <svg
                              width="12px"
                              height="12px"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className={`transition-transform duration-200 ${
                                collapsedCategories.has(category.id) ? "" : "rotate-90"
                              }`}
                            >
                              <path
                                d="M9 6L15 12L9 18"
                                stroke="#000000"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <div
                          className={`space-y-3 ml-6 transition-all duration-500 ease-in-out overflow-hidden ${
                            !collapsedCategories.has(category.id)
                              ? "max-h-[1000px] opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          {category.fileData?.map((file: any) => (
                            <div key={file.id}>
                              <ul className="flex cursor-pointer mt-2">
                                <Tooltip
                                  placement="right"
                                  color="#fff"
                                  title={file.title}
                                >
                                  <div className="flex items-center gap-2">
                                    {getContentType(file) === "youtube" ? (
                                      <YoutubeOutlined style={{ color: "red", fontSize: "12px" }} />
                                    ) : (
                                      <FileTextOutlined style={{ fontSize: "12px" }} />
                                    )}
                                    <p
                                      style={{
                                        color: getStatusColor(file.status),
                                      }}
                                      onClick={() => handleViewClick(file)}
                                      className="truncate max-w-[200px]"
                                    >
                                      {file.title.length > sliceSize
                                        ? file.title.slice(0, sliceSize) + "..."
                                        : file.title}
                                    </p>
                                  </div>
                                </Tooltip>
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resizer */}
          <div
            className="w-[4px] bg-gray-200 cursor-ew-resize"
            onMouseDown={handleMouseDown}
          ></div>

          {/* Main Content Area */}
          <div className="w-full bg-white rounded-r-lg shadow-md p-4">
            <div className="flex justify-between pb-4 items-center border-b mb-2">
              <h3 className="font-medium flex items-center gap-2 text-[#243451]">
                <div onClick={() => setCollapsed(!collapsed)}>
                  <AlignLeftOutlined />
                </div>
                {Object.keys(pdfToView).length > 0
                  ? pdfToView?.title
                  : "Knowledge Documents"}
              </h3>
              <div className="flex items-center">                
                {Object.keys(pdfToView).length > 0 && (
                  <button onClick={handleDownload} className="primary-btn ml-2">
                    {getContentType(pdfToView) === "youtube" ? "Watch on YouTube" : "Download"}
                  </button>
                )}
              </div>
            </div>            

            {Object.keys(pdfToView).length > 0 ? (
              <div className="w-full h-[calc(100vh-17rem)] overflow-y-auto overflow-x-hidden">
                {error && <p className="text-red-500">{error}</p>}

                {fileLoading && (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                  </div>
                )}

                {/* Content Viewer */}
                {!fileLoading && pdfToView.url && (
                  getContentType(pdfToView) === "youtube" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <div className="w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                          src={getYouTubeEmbedUrl(pdfToView.url)}                          
                          title="YouTube Video"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          onLoad={() => clearLoadingState()}
                          onError={() => {
                            setError("Failed to load video");
                            clearLoadingState();
                          }}
                        />
                      </div>
                      {pdfToView.description && (
                        <div className="mt-4 w-full max-w-4xl">
                          <div className="mt-4 w-full max-w-4xl">
  <h4 className="font-semibold mb-2">Description:</h4>
  <div 
    className="text-gray-700 prose max-w-none"
    dangerouslySetInnerHTML={{ __html: pdfToView.description }} 
  />
</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <iframe
                      src={`${pdfToView.url}#toolbar=0&navpanes=0&scrollbar=0`}
                      title="Document Preview"
                      className="w-full border-none"
                      style={{
                        minHeight: "100%",
                        width: "100%",
                        display: "block",
                        overflow: "hidden",
                      }}
                      onLoad={() => clearLoadingState()}
                      onError={() => {
                        setError("Failed to load document");
                        clearLoadingState();
                      }}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="h-[calc(100vh-14rem)] flex flex-col justify-center items-center gap-2">
                <img src={logo} alt="" className={`w-[70px]`} />
                <h2 className="tracking-widest text-[18px] 2xl:[20px] text-center playfair-display-sc-bold text-[#9F8667]">
                  KNOWLEDGE BASE
                </h2>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Reason Modals */}
      <Modal
        title="Add Reject Reasons"
        visible={isRejectModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="confirm" type="primary" danger>
            Save
          </Button>,
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <Input.TextArea
          rows={4}
          placeholder="Enter reject reason here"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      <Modal
        title="Reject Reasons View"
        visible={isRejectReasonViewModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <div>{rejectReason}</div>
      </Modal>
    </div>
  );
};

export default KnowledgeFileManager;