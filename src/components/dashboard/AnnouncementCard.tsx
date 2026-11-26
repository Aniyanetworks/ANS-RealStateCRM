import { format } from 'date-fns';
import { useState } from 'react';
import { Modal } from 'antd';

type AnnouncementData = {
  id: number;
  image: string;
  title: string;
  created_at: string;
  date: string;
  description: string;
};

interface AnnouncementCardProps {
  announcement: AnnouncementData;
  index: number;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  index,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formattedDate = format(new Date(announcement.date), 'MMMM dd, yyyy');
  
  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div>
      <div className={`px-5 py-4 ${index !== 0 && "border-t border-gray-100"} space-y-1.5`}>
        <h3 className="text-[13px] font-semibold text-gray-800">{announcement.title}</h3>
        <p className="text-[11px] text-gray-400">{formattedDate}</p>
        <div className="flex items-center gap-2">
          <div className="text-[12px] leading-relaxed text-gray-600">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: truncateDescription(announcement.description) 
              }}
            />
            {announcement.description.length > 150 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 text-[#0f766e] hover:underline"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={announcement.title}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <div className="p-4">
          <p className="text-gray-600 mb-4">{formattedDate}</p>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: announcement.description }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AnnouncementCard;
