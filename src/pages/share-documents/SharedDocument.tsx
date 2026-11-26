import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGetShareDocumentQuery } from "../../redux/api/superadmin/shareDocumentSlice";
import { apiUrl, getFileUrl } from "../../utils/constant";
import { isBefore } from "date-fns";
import { notification } from "antd";
import { FaDownload } from 'react-icons/fa';
import { FaFileZipper } from "react-icons/fa6";

interface UploadFileType {
  filePath: string;
  uploadFileName: {
    name: string;
  };
}

const SharedDocument: React.FC = () => {
  const { uuid } = useParams<{ uuid?: string }>();
  const { data, isLoading } = useGetShareDocumentQuery(uuid);

  const [password, setPassword] = useState<string>("");
  const [isPasswordCorrect, setIsPasswordCorrect] = useState<boolean>(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  useEffect(() => {
    if(data?.data?.password === ""){
      setIsPasswordCorrect(true);
    }
  }, [data?.data?.password]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === data?.data?.password) {
      setIsPasswordCorrect(true);
    } else if(password === ""){
      notification.error({
        message: "Incorrect Password",
        description: "Please enter the correct password.",
      });
    } else {
      notification.error({
        message: "Incorrect Password",
        description: "Please enter the correct password.",
      });
    }
  };

  const expirationDate = new Date(data?.data?.expiration);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-lg font-medium text-gray-700">Loading your documents...</p>
      </div>
    );
  }

  const handleDownload = async (filePath: string) => {

    const response = await fetch(getFileUrl(filePath));
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
  
    const normalizedFilePath = filePath.replace(/\\/g, '/');
  
    const fileName = normalizedFilePath
        .replace('public/uploads/', '')
        .split('/').pop() || "file";
  
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-lg w-full bg-white shadow-md rounded-lg p-6">
        {isBefore(expirationDate, new Date()) ? (
          <div className="text-center text-red-500">
            <h2 className="text-lg font-semibold">This link has expired.</h2>
            <p className="mt-2 text-sm text-gray-600">Please contact support for further assistance.</p>
          </div>
        ) : (
          <>
            {!isPasswordCorrect && data?.data?.password !== "" && (
              <>
                <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Access Your Documents</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="flex flex-col items-center">
                    <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter password"
                    className="border rounded-md px-4 py-2 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="mt-4 w-full max-w-sm bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    Submit
                  </button>
                </div>
              </form>
              </>
            )}

            {isPasswordCorrect && (
              <>
                <div className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md mb-4">
                  <p className="text-sm font-semibold text-gray-600 w-[60px]">SN</p>
                  <p className="text-sm font-semibold text-gray-600 flex-1">Uploaded Attachments List</p>
                  <a className="text-sm font-semibold text-gray-600" href={`${apiUrl}/superadmin/download-zip?uuid=${uuid}`}>
                    <FaFileZipper />
                  </a>
                </div>
                <div className="space-y-3">
                  {data?.data?.shareDocumentDetails?.map((file: UploadFileType, index: number) => (
                    <div
                      key={index}
                      className="flex items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition"
                    >
                      <span className="text-sm font-medium text-gray-600 w-[60px]">{index + 1}.</span>
                      <a
                        href={getFileUrl(file.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm hover:underline flex-1"
                      >
                        {file.filePath.split(/[/\\]/).pop()}
                      </a>
                      <a
                        onClick={() => handleDownload(file.filePath)}
                        className="text-blue-500 text-sm ml-2 hover:underline cursor-pointer"
                      >
                        <FaDownload />
                      </a>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SharedDocument;
