import React from 'react';
import { 
  FaUsers, 
  FaUserTie, 
  FaShoppingCart, 
  FaTicketAlt, 
  FaFileContract, 
  FaHome 
} from 'react-icons/fa';
import { formatNumberWithCommasAndDecimals } from '../../utils/formatNumberWithCommasAndDecimals';
import { Link } from 'react-router-dom';

interface DataType {
  id: number;
  status: string;
  user?: {
    clientAgent?: any[];
    invoiceAgent?: any[];
    requests?: any[];
    tradeSheetsCreated?: any[];
    userInTradeSheetSharedUser?: any[];
    propertyListingCreated?: any[];
    userInPropertyListingUser?: any[];
  };
  tradeAgentCommission?: any[];
}

interface AgentDashboardStatsProps {
  filteredData: DataType[];
}

const StatCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white rounded-md shadow hover:shadow-md transition-shadow duration-300 p-4">
    <div className="flex items-center mb-2.5">
      <div className="p-2 rounded-full bg-blue-50 text-blue-600 mr-3">
        {icon}
      </div>
      <h4 className="font-semibold text-gray-800">{title}</h4>
    </div>
    <div className="space-y-1.5 text-xs text-gray-600">
      {children}
    </div>
  </div>
);

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center py-0.5">
    <span >{label}</span>
    <span className="font-medium  ">{value}</span>
  </div>
);

const AgentDashboardStats: React.FC<AgentDashboardStatsProps> = ({ filteredData }) => {
  return (
    <div className="my-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
        <StatCard title="Agents Overview" icon={<FaUserTie size={18} />}>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/agent-management">
            <StatItem 
              label="Total Agents" 
              value={filteredData.length} 
            />
          </Link>
          
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/agent-management/approved">
            <StatItem 
              label="Approved" 
              value={filteredData.filter(agent => agent.status === "approved").length} 
            />
          </Link>

          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/agent-management/pending">
            <StatItem 
              label="Pending" 
              value={filteredData.filter(agent => agent.status === "pending").length} 
            />
          </Link>

          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/agent-management/draft">
            <StatItem 
              label="Draft" 
              value={filteredData.filter(agent => agent.status === "draft").length} 
            />
          </Link>

          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/agent-management/underReview">
            <StatItem 
              label="Under Review" 
              value={filteredData.filter(agent => agent.status === "underReview").length} 
            />
          </Link>

          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/agent-management/rejected">
            <StatItem 
              label="Rejected" 
              value={filteredData.filter(agent => agent.status === "rejected").length} 
            />
          </Link>

          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/agent-management/closed">
            <StatItem 
              label="Terminated" 
              value={filteredData.filter(agent => agent.status === "closed").length} 
            />
          </Link>
        </StatCard>

        
        <StatCard title="Trade Sheets" icon={<FaFileContract size={18} />}>
          <Link className='hover:text-blue-500'    to="/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list">
            <StatItem 
              label="Total Trade Sheets" 
              value={new Set([
                ...filteredData.flatMap(agent => 
                  agent.user?.tradeSheetsCreated?.filter(sheet => 
                    sheet.status !== "archive").map(sheet => sheet.id) || []),
                ...filteredData.flatMap(agent => 
                  agent.user?.userInTradeSheetSharedUser?.filter(shared => 
                    shared.tradeSheet?.status !== "archive")
                    .map(shared => shared.tradeSheet.id) || [])
              ]).size} 
            />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list/closed">
          <StatItem 
            label="Closed" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.tradeSheetsCreated?.filter(sheet => 
                  sheet.tradeStatus === "closed").map(sheet => sheet.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInTradeSheetSharedUser?.filter(shared => 
                  shared.tradeSheet?.tradeStatus === "closed")
                  .map(shared => shared.tradeSheet.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list/dft">
          <StatItem 
            label="DFT" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.tradeSheetsCreated?.filter(sheet => 
                  sheet.tradeStatus === "dft").map(sheet => sheet.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInTradeSheetSharedUser?.filter(shared => 
                  shared.tradeSheet?.tradeStatus === "dft")
                  .map(shared => shared.tradeSheet.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list/soldConditional">
          <StatItem 
            label="Sold Conditional" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.tradeSheetsCreated?.filter(sheet => 
                  sheet.tradeStatus === "soldConditional").map(sheet => sheet.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInTradeSheetSharedUser?.filter(shared => 
                  shared.tradeSheet?.tradeStatus === "soldConditional")
                  .map(shared => shared.tradeSheet.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list/pending">
          <StatItem 
            label="Pending" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.tradeSheetsCreated?.filter(sheet => 
                  sheet.tradeStatus === "pending").map(sheet => sheet.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInTradeSheetSharedUser?.filter(shared => 
                  shared.tradeSheet?.tradeStatus === "pending")
                  .map(shared => shared.tradeSheet.id) || [])
            ]).size} 
          />
          </Link>
        </StatCard>

        <StatCard title="Property Listings" icon={<FaHome size={18} />}>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/property-listing">
            <StatItem 
              label="Total Listings" 
              value={new Set([
                ...filteredData.flatMap(agent => 
                  agent.user?.propertyListingCreated?.map(listing => listing.id) || []),
                ...filteredData.flatMap(agent => 
                  agent.user?.userInPropertyListingUser?.map(shared => 
                    shared.propertyListing.id) || [])
              ]).size} 
            />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/property-listing/listed">
          <StatItem 
            label="Listed" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.propertyListingCreated?.filter(listing =>  listing.listingStatus === "listed")
                  .map(listing => listing.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInPropertyListingUser?.filter(shared => 
                  shared.propertyListing?.listingStatus === "listed")
                  .map(shared => shared.propertyListing.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/property-listing/sold">
          <StatItem 
            label="Sold" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.propertyListingCreated?.filter(listing => 
                  listing.listingStatus === "sold")
                  .map(listing => listing.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInPropertyListingUser?.filter(shared => 
                  shared.propertyListing?.listingStatus === "sold")
                  .map(shared => shared.propertyListing.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/property-listing/leased">
          <StatItem 
            label="Leased" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.propertyListingCreated?.filter(listing => 
                  listing.status === "leased")
                  .map(listing => listing.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInPropertyListingUser?.filter(shared => 
                  shared.propertyListing?.status === "leased")
                  .map(shared => shared.propertyListing.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/property-listing/expired">
          <StatItem 
            label="Expired" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.propertyListingCreated?.filter(listing => 
                  listing.status === "expired")
                  .map(listing => listing.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInPropertyListingUser?.filter(shared => 
                  shared.propertyListing?.status === "expired")
                  .map(shared => shared.propertyListing.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/property-listing/dft">
          <StatItem 
            label="Dft" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.propertyListingCreated?.filter(listing => 
                  listing.status === "dft")
                  .map(listing => listing.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInPropertyListingUser?.filter(shared => 
                  shared.propertyListing?.status === "dft")
                  .map(shared => shared.propertyListing.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/property-listing/extended">
          <StatItem 
            label="Extended" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.propertyListingCreated?.filter(listing => 
                  listing.status === "extended")
                  .map(listing => listing.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInPropertyListingUser?.filter(shared => 
                  shared.propertyListing?.status === "extended")
                  .map(shared => shared.propertyListing.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/property-listing/exclusive">
          <StatItem 
            label="Exclusive" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.propertyListingCreated?.filter(listing => 
                  listing.status === "exclusive")
                  .map(listing => listing.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInPropertyListingUser?.filter(shared => 
                  shared.propertyListing?.status === "exclusive")
                  .map(shared => shared.propertyListing.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/property-listing/suspended">
          <StatItem 
            label="Suspended" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.propertyListingCreated?.filter(listing => 
                  listing.status === "suspended")
                  .map(listing => listing.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInPropertyListingUser?.filter(shared => 
                  shared.propertyListing?.status === "suspended")
                  .map(shared => shared.propertyListing.id) || [])
            ]).size} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/super-admin/property-listing/terminated">
          <StatItem 
            label="Terminated" 
            value={new Set([
              ...filteredData.flatMap(agent => 
                agent.user?.propertyListingCreated?.filter(listing => 
                  listing.listingStatus === "terminated")
                  .map(listing => listing.id) || []),
              ...filteredData.flatMap(agent => 
                agent.user?.userInPropertyListingUser?.filter(shared => 
                  shared.propertyListing?.listingStatus === "terminated")
                  .map(shared => shared.propertyListing.id) || [])
            ]).size} 
          />
          </Link>
        </StatCard>

        <StatCard title="Client Management" icon={<FaUsers size={18} />}>
          <Link className='hover:text-blue-500'    to="/dashboard/clients/client-list">
            <StatItem 
              label="Total Clients" 
              value={filteredData.reduce((sum, agent) => 
                sum + (agent.user?.clientAgent?.length || 0), 0)} 
            />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/clients/client-list/buyer">
            <StatItem 
              label="Buyers" 
              value={filteredData.reduce((sum, agent) => 
                sum + (agent.user?.clientAgent?.filter(client => 
                  client.clientUser?.clientType?.toLowerCase() === "buyer").length || 0), 0)} 
            />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/clients/client-list/seller">
            <StatItem 
              label="Sellers" 
              value={filteredData.reduce((sum, agent) => 
                sum + (agent.user?.clientAgent?.filter(client => 
                  client.clientUser?.clientType?.toLowerCase() === "seller").length || 0), 0)} 
            />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/clients/client-list/tenant">
            <StatItem 
              label="Tenants" 
              value={filteredData.reduce((sum, agent) => 
                sum + (agent.user?.clientAgent?.filter(client => 
                  client.clientUser?.clientType?.toLowerCase() === "tenant").length || 0), 0)} 
            />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/clients/client-list/landlord">
          <StatItem 
            label="Landlords" 
            value={filteredData.reduce((sum, agent) => 
              sum + (agent.user?.clientAgent?.filter(client => 
                client.clientUser?.clientType?.toLowerCase() === "landlord").length || 0), 0)} 
          />
          </Link>
        </StatCard>

        <StatCard title="Marketplace Activity" icon={<FaShoppingCart size={18} />}>
        <Link className='hover:text-blue-500'    to="/dashboard/invoice/order-history">
          <StatItem 
            label="Total Purchases" 
            value={`$${formatNumberWithCommasAndDecimals(filteredData.reduce((sum, agent) => 
              sum + (agent.user?.invoiceAgent?.reduce((total, invoice) => 
          total + (invoice.total_amount || 0), 0) || 0), 0))}`} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/invoice/order-history/Due">
          <StatItem 
            label="Due Payments" 
            value={`$${formatNumberWithCommasAndDecimals(filteredData.reduce((sum, agent) => 
              sum + (agent.user?.invoiceAgent?.filter(invoice => 
          invoice.status === "Due").reduce((total, invoice) => 
          total + (invoice.total_amount || 0), 0) || 0), 0))}`} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/invoice/borrow-product-list">
          <StatItem 
            label="Borrowed Order" 
            value={formatNumberWithCommasAndDecimals(filteredData.reduce((sum, agent) => 
              sum + (agent.user?.invoiceAgent?.flatMap(invoice => 
          invoice.invoiceItems).filter(item => 
          item.order_item_status === "Borrow").length || 0), 0))} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/invoice/borrow-product-list/due_date">
          <StatItem 
            label="Borrowed Return Date Expired" 
            value={formatNumberWithCommasAndDecimals(filteredData.reduce((sum, agent) => 
              sum + (agent.user?.invoiceAgent?.flatMap(invoice => 
          invoice.invoiceItems).filter(item => 
          item.order_item_status === "Borrow" && new Date(item.due_date) <= new Date()).length || 0), 0))} 
          />
          </Link>
        </StatCard>

        <StatCard title="Support Tickets" icon={<FaTicketAlt size={18} />}>
          <Link className='hover:text-blue-500'    to="/dashboard/support/requests">
            <StatItem 
              label="Total Tickets" 
              value={filteredData.reduce((sum, agent) => 
                sum + (agent.user?.requests?.filter(item => item.teamId == '1')?.length || 0), 0)} 
            />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/support/requests/filter/open">
          <StatItem 
            label="Open" 
            value={filteredData.reduce((sum, agent) => 
              sum + (agent.user?.requests?.filter(item => item.teamId == '1')?.filter(ticket => 
                ticket.status === "open").length || 0), 0)} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/support/requests/filter/completed">
          <StatItem 
            label="Completed" 
            value={filteredData.reduce((sum, agent) => 
              sum + (agent.user?.requests?.filter(item => item.teamId == '1')?.filter(ticket => 
                ticket.status === "completed").length || 0), 0)} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/support/requests/filter/closed">
          <StatItem 
            label="Closed" 
            value={filteredData.reduce((sum, agent) => 
              sum + (agent.user?.requests?.filter(item => item.teamId == '1')?.filter(ticket => 
                ticket.status === "closed").length || 0), 0)} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/support/requests/filter/inProgress">
          <StatItem 
            label="In Progress" 
            value={filteredData.reduce((sum, agent) => 
              sum + (agent.user?.requests?.filter(item => item.teamId == '1')?.filter(ticket => 
                ticket.status === "inProgress").length || 0), 0)} 
          />
          </Link>
        </StatCard>
        <StatCard title="Art-Work Tickets" icon={<FaTicketAlt size={18} />}>
          <Link className='hover:text-blue-500'    to="/dashboard/support/art-work/request">
            <StatItem 
              label="Total Tickets" 
              value={filteredData.reduce((sum, agent) => 
                sum + (agent.user?.requests?.filter(item => item.teamId == '2')?.length || 0), 0)} 
            />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/support/art-work/request/filter/open">
          <StatItem 
            label="Open" 
            value={filteredData.reduce((sum, agent) => 
              sum + (agent.user?.requests?.filter(item => item.teamId == '2')?.filter(ticket => 
                ticket.status === "open").length || 0), 0)} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/support/art-work/request/filter/completed">
          <StatItem 
            label="Completed" 
            value={filteredData.reduce((sum, agent) => 
              sum + (agent.user?.requests?.filter(item => item.teamId == '2')?.filter(ticket => 
                ticket.status === "completed").length || 0), 0)} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/support/art-work/request/filter/closed">
          <StatItem 
            label="Closed" 
            value={filteredData.reduce((sum, agent) => 
              sum + (agent.user?.requests?.filter(item => item.teamId == '2')?.filter(ticket => 
                ticket.status === "closed").length || 0), 0)} 
          />
          </Link>
          <Link className='hover:text-blue-500'    to="/dashboard/support/art-work/request/filter/inProgress">
          <StatItem 
            label="In Progress" 
            value={filteredData.reduce((sum, agent) => 
              sum + (agent.user?.requests?.filter(item => item.teamId == '2')?.filter(ticket => 
                ticket.status === "inProgress").length || 0), 0)} 
          />
          </Link>
        </StatCard>
      </div>
    </div>
  );
};

export default AgentDashboardStats; 