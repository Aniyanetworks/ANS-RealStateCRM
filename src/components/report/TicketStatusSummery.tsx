interface Ticket {    
      status: string;
      type: string;
      priority: string;
  }
  
  interface Props {
    filteredData: Ticket[];
  }
  
  const TicketStatusSummary: React.FC<Props> = ({ filteredData }) => {
    const statusCounts = filteredData.reduce((acc, item) => {
      const status = item?.status?.toLowerCase();
      if (status) {
        acc[status] = (acc[status] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);



    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 my-3">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Tickets</span>
            <span className="text-lg font-semibold text-blue-600">
              {filteredData.length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Open</span>
            <span className="text-lg font-semibold text-green-600">
              {statusCounts.open || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Pending</span>
            <span className="text-lg font-semibold text-yellow-600">
              {statusCounts.pending || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">In Progress</span>
            <span className="text-lg font-semibold text-teal-600">
              {statusCounts.inprogress || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Completed</span>
            <span className="text-lg font-semibold text-teal-600">
              {statusCounts.completed || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Closed</span>
            <span className="text-lg font-semibold text-gray-600">
              {statusCounts.closed || 0}
            </span>
          </div>
        </div>

      </div>
    );
  };
  
  export default TicketStatusSummary;