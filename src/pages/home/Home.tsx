// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState } from 'react';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Skeleton,
  Spin,
  Tag,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import {
  CalendarOutlined,
  CloseOutlined,
  EditOutlined,
  CrownOutlined,
  FileTextOutlined,
  GiftOutlined,
  HomeOutlined,
  LoadingOutlined,
  PlusOutlined,
  TeamOutlined,
  TrophyOutlined,
  RiseOutlined,
} from '@ant-design/icons';

import Announcement from '../../components/dashboard/Announcement';
import UpcommingCalendar
  from '../../components/dashboard/Calendar/UpcommingCalendar';
import { useGetPublishedAnnouncementsListQuery } from '../../redux/api/superadmin/announcementSlice';
import { useGetCalendarEventsQuery } from '../../redux/api/superadmin/calendar/calendarEventSlice';
import NewAgent from '../../components/dashboard/NewAgent';
import {
  useGetApprovedAgetsQuery,
} from '../../redux/api/dashboard/dashboardSlice';
import {
  useGetTopAgentReportDataQuery,
  useGetAgentListDataQuery,
} from '../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useGetManualTopAgentListQuery,
  useCreateManualTopAgentMutation,
  useUpdateManualTopAgentMutation,
  useDeleteManualTopAgentMutation,
} from '../../redux/api/superadmin/manualTopAgentSlice';
import {
  useGetTradeSheetListDataQuery,
  useGetArchiveTradeSheetListDataQuery,
} from '../../redux/api/agent/trade-sheet/tradeSheetSlice';
import {
  useGetPropertyListingQuery,
} from '../../redux/api/superadmin/propertyListingDataSlice';
import { useAppSelector } from '../../redux/hooks';
import { baseUrl, getFileUrl } from '../../utils/constant';
import defaultAvatar from '../../assets/agent-2.png';
import {
  formatNumberWithCommasAndDecimals,
} from '../../utils/formatNumberWithCommasAndDecimals';

// Define TypeScript interfaces
interface Property {
  soldPrice?: string;
  salesPrice?: string;
  listingPrice?: string;
  closingDate?: string;
  propertyAddress?: string;
  mlsNumber?: string;
}

interface TradeSheet {
  id?: number;
  tradeSheetTypeId?: string;
  properties?: Property[];
  createdAt?: string;
  closingDate?: string;
  status?: string;
  tradeStatus?: string;
}

interface AgentCommission {
  agentCommissionTotal?: string;
  createdAt?: string;
  tradeSheet?: {
    id?: number;
    tradeSheetTypeId?: string;
  };
}

interface PropertyListing {
  id?: number;
  uuid?: string;
  propertyListingTypeId?: string;
  mlsNumber?: string;
  propertyAddress?: string;
  contractDate?: string;
  listingStatus?: string;
  listingPrice?: string;
  askingPrice?: string;
  city?: {
    name?: string;
  };
  state?: {
    name?: string;
  };
}

interface Agent {
  name: string;
  user?: {
    profilePicture?: string;
    userInTradeSheetSharedUser?: { tradeSheet: TradeSheet | null }[];
    tradeSheetsCreated?: TradeSheet[];
    unitsSalesTradeSheets?: TradeSheet[];
    propertyListings?: PropertyListing[];
  };
  tradeAgentCommission?: AgentCommission[];
}

interface AgentReportDataResponse {
  data?: {
    userData?: Agent[];
  };
}

// Define detailed breakdown types
interface CommissionDetail {
  commission: number;
  createdAt: string;
  tradeSheetId?: number;
  tradeSheetTypeId?: string;
}

interface TradeSheetDetail {
  id?: number;
  tradeSheetTypeId?: string;
  createdAt: string;
  closingDate?: string;
  salesPrice: number;
  soldPrice: number;
  listingPrice: number;
  totalPrice: number;
  properties?: Property[];
}

interface ListingDetail {
  id?: number;
  uuid?: string;
  propertyListingTypeId?: string;
  mlsNumber?: string;
  contractDate: string;
  propertyAddress?: string;
  listingPrice?: string;
  listingStatus?: string;
  city?: string;
  state?: string;
}

// Define TopStats type
interface TopStats {
  name: string;
  totalCommission: number;
  totalUnits: number;
  totalSales: number;
  totalListings: number;
  profilePicture: string | null;
  commissionDetails?: CommissionDetail[];
  tradeSheetDetails?: TradeSheetDetail[];
  listingDetails?: ListingDetail[];
  agentId?: number;
}

// Function to calculate top statistics
const calculateTopStats = (data?: AgentReportDataResponse) => {
  if (!data?.data?.userData || !Array.isArray(data.data.userData)) {
    return {
      topCommission: {
        name: "N/A",
        totalCommission: 0,
        profilePicture: null,
        commissionDetails: [],
      },
      topUnitSeller: {
        name: "N/A",
        totalUnits: 0,
        profilePicture: null,
        tradeSheetDetails: [],
      },
      topSellerTotal: {
        name: "N/A",
        totalSales: 0,
        profilePicture: null,
        tradeSheetDetails: [],
      },
      topListingAgent: {
        name: "N/A",
        totalListings: 0,
        profilePicture: null,
        listingDetails: [],
      },
    };
  }

  // Agents excluded from the dashboard's Top Commission / Unit Seller / Seller /
  // Listing Agent leaderboard cards (internal/test accounts, not real agent activity).
  const DASHBOARD_TOP_STATS_EXCLUDED_USER_IDS = ["UID00003"];

  const agents = data.data.userData.filter(
    (agent) => !DASHBOARD_TOP_STATS_EXCLUDED_USER_IDS.includes(agent?.user?.userTypeUId)
  );

  const stats: TopStats[] = agents.map((agent) => {
    const tradeCommissions = agent.tradeAgentCommission || [];

    // Collect commission details
    const commissionDetails: CommissionDetail[] = tradeCommissions.map(
      (trade) => ({
        commission: parseFloat(trade.agentCommissionTotal || "0"),
        createdAt: trade.createdAt || "",
        tradeSheetId: trade.tradeSheet?.id,
        tradeSheetTypeId: trade.tradeSheet?.tradeSheetTypeId,
      })
    );

    const totalCommission = tradeCommissions.reduce(
      (sum, trade) => sum + parseFloat(trade.agentCommissionTotal || "0"),
      0
    );

    // Backend already filtered: units/sales (approved + closed + date filtered by closingDate)
    const unitsSalesTradeSheets = agent?.user?.unitsSalesTradeSheets || [];
    const fallbackTradeSheets = [
      ...(agent?.user?.userInTradeSheetSharedUser
        ?.map((trade) => trade.tradeSheet)
        .filter(Boolean) || []),
      ...(agent?.user?.tradeSheetsCreated || []),
    ];

    const allTradeSheets =
      unitsSalesTradeSheets.length > 0
        ? unitsSalesTradeSheets
        : fallbackTradeSheets;

    // Backend already filtered these (approved + closed + date by closingDate)
    const totalUnits = allTradeSheets.length;

    // Collect tradesheet details - Calculate soldPrice, salesPrice, listingPrice separately
    const tradeSheetDetails: TradeSheetDetail[] = allTradeSheets.map(
      (trade) => {
        const properties = Array.isArray(trade?.properties) ? trade.properties : [];

        // Calculate total soldPrice from all properties
        const soldPrice = properties.reduce(
          (sum, property) => sum + parseFloat(property.soldPrice || "0"),
          0
        );

        const salesPrice = properties.reduce(
          (sum, property) => sum + parseFloat(property.salesPrice || "0"),
          0
        );

        const listingPrice = properties.reduce(
          (sum, property) => sum + parseFloat(property.listingPrice || "0"),
          0
        );

        const closingDate = properties[0]?.closingDate || null;

        return {
          id: trade?.id,
          tradeSheetTypeId: trade?.tradeSheetTypeId,
          createdAt: trade?.createdAt || "",
          closingDate: closingDate || "",
          salesPrice,
          soldPrice,
          listingPrice,
          totalPrice: soldPrice, // Total sales value is based on soldPrice only
          properties,
        };
      }
    );

    // Total sales is now sum of all soldPrice from all properties
    const totalSales = tradeSheetDetails.reduce(
      (sum, trade) => sum + trade.soldPrice,
      0
    );

    // PROPERTY LISTINGS CALCULATION (Based on contractDate)
    const propertyListings = agent?.user?.propertyListings || [];
    const listingDetails: ListingDetail[] = propertyListings.map((listing) => ({
      id: listing.id,
      uuid: listing.uuid,
      propertyListingTypeId: listing.propertyListingTypeId,
      mlsNumber: listing.mlsNumber,
      contractDate: listing.contractDate || "",
      propertyAddress: listing.propertyAddress || "",
      listingPrice: listing.listingPrice,
      listingStatus: listing.listingStatus,
      city: listing.city?.name,
      state: listing.state?.name,
    }));

    const totalListings = listingDetails.length;

    return {
      name: agent.name,
      profilePicture: agent.user?.profilePicture || null,
      totalCommission,
      totalUnits,
      totalSales,
      totalListings,
      commissionDetails,
      tradeSheetDetails,
      listingDetails,
    };
  });

  const getTopTied = (field: keyof TopStats) => {
    if (stats.length === 0) return [];
    const sorted = [...stats].sort((a, b) => (b[field] as number) - (a[field] as number));
    const maxVal = sorted[0][field] as number;
    if (!maxVal || maxVal === 0) return [];
    return sorted.filter((s) => (s[field] as number) === maxVal);
  };

  return {
    topCommissions: getTopTied('totalCommission'),
    topUnitSellers: getTopTied('totalUnits'),
    topSellerTotals: getTopTied('totalSales'),
    topListingAgents: getTopTied('totalListings'),
  };
};

const computeDashboardStats = (data?: AgentReportDataResponse) => {
  const agents = data?.data?.userData ?? [];
  let totalTradesheets = 0;
  let totalSales = 0;
  let totalCommissions = 0;
  let totalListings = 0;

  const agentStats = agents.map((agent) => {
    const commissions = agent.tradeAgentCommission ?? [];
    const unitsSales = (agent?.user?.unitsSalesTradeSheets ?? []) as TradeSheet[];
    const listings = (agent?.user?.propertyListings ?? []) as PropertyListing[];

    const agentCommission = commissions.reduce(
      (s, t) => s + parseFloat(t.agentCommissionTotal ?? '0'), 0
    );
    const agentSales = unitsSales.reduce((s, trade) => {
      const props = Array.isArray(trade?.properties) ? trade.properties : [];
      return s + props.reduce((ps, p) => ps + parseFloat(p.soldPrice ?? '0'), 0);
    }, 0);

    totalTradesheets += unitsSales.length;
    totalSales += agentSales;
    totalCommissions += agentCommission;
    totalListings += listings.length;

    return { name: agent.name, commission: agentCommission, units: unitsSales.length, sales: agentSales, listings: listings.length };
  });

  return {
    totalAgents: agents.length,
    totalTradesheets,
    totalSales,
    totalCommissions,
    totalListings,
    topByCommission: [...agentStats].sort((a, b) => b.commission - a.commission).slice(0, 5),
    topBySales: [...agentStats].sort((a, b) => b.sales - a.sales).slice(0, 5),
  };
};

const { RangePicker } = DatePicker;

// Custom loading icon
const loadingIcon = (
  <LoadingOutlined style={{ fontSize: 48, color: "#9F8667" }} spin />
);

const Home = () => {
  const { user } = useAppSelector((state) => state.user);
  const isSuperAdmin = user?.roleId == 1 || user?.userType === 'superAdmin';
  const PRIVILEGED_ADMIN_EMAILS = ['admin@dvrealty.ca', 'nabaa@dvrealty.ca', 'superadmin@nomail.com'];
  const isPrivilegedAdmin = isSuperAdmin && PRIVILEGED_ADMIN_EMAILS.includes(user?.email);

  const { data: newAgentsData, isLoading: newAgentsLoading } =
    useGetApprovedAgetsQuery("");
  const hasNewAgents =
    !newAgentsLoading &&
    newAgentsData?.data?.agents &&
    newAgentsData.data.agents.length > 0;

  // State to track the selected month
  const [selectedMonth, setSelectedMonth] = useState<string>("previous");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Build query parameters based on selected filter
  const buildQueryParams = () => {
    if (
      selectedMonth === "custom" &&
      dateRange &&
      dateRange[0] &&
      dateRange[1]
    ) {
      return {
        filterMonth: "custom",
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
      };
    }
    return selectedMonth;
  };

  // Pass filterMonth or custom date range to API
  const { data, isLoading, isFetching } = useGetTopAgentReportDataQuery(
    buildQueryParams()
  );

  // Calculate stats with safety check
  const statsData = React.useMemo(() => {
    if (!data || isLoading || isFetching) {
      return { topCommissions: [], topUnitSellers: [], topSellerTotals: [], topListingAgents: [] };
    }
    return calculateTopStats(data);
  }, [data, isLoading, isFetching]);

  const { topCommissions, topUnitSellers, topSellerTotals, topListingAgents } = statsData;

  const dashboardStats = React.useMemo(() => computeDashboardStats(data), [data]);

  const { data: agentListData, isLoading: agentListLoading } = useGetAgentListDataQuery(undefined);
  const allAgents: any[] = agentListData?.data?.userData ?? [];
  const agentCategoryCounts = React.useMemo(() => {
    const ourAgents = allAgents.filter(a => (a.brokerageId === 24 || a.brokerageId === '24') && a.status !== 'closed').length;
    const otherAgents = allAgents.filter(a => a.brokerageId !== 24 && a.brokerageId !== '24' && a.status !== 'closed').length;
    const approved = allAgents.filter(a => a.status === 'approved').length;
    const terminate = allAgents.filter(a => a.status === 'closed').length;
    return { ourAgents, otherAgents, approved, terminate };
  }, [allAgents]);

  // Manual "featured" top-agent entries — admin-curated, shown alongside the
  // auto-calculated cards below, always visible regardless of the date filter.
  const { data: manualTopAgentData } = useGetManualTopAgentListQuery(undefined);
  const manualTopAgents: any[] = manualTopAgentData?.data?.manualTopAgentData ?? [];
  const [createManualTopAgent, { isLoading: isCreatingManualTopAgent }] = useCreateManualTopAgentMutation();
  const [updateManualTopAgent, { isLoading: isUpdatingManualTopAgent }] = useUpdateManualTopAgentMutation();
  const [deleteManualTopAgent] = useDeleteManualTopAgentMutation();

  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [manualEntryCategory, setManualEntryCategory] = useState<string>('units');
  const [manualEntryAgentId, setManualEntryAgentId] = useState<string | undefined>(undefined);
  const [manualEntryValue, setManualEntryValue] = useState('');
  // uuid of the manual entry being edited (null = adding a new one)
  const [editingManualUuid, setEditingManualUuid] = useState<string | null>(null);

  const resetManualEntryForm = () => {
    setManualEntryCategory('units');
    setManualEntryAgentId(undefined);
    setManualEntryValue('');
    setEditingManualUuid(null);
  };

  const openEditManualTopAgent = (m: any) => {
    setEditingManualUuid(m.uuid);
    setManualEntryCategory(m.category);
    setManualEntryAgentId(m.agentId != null ? String(m.agentId) : m.agent?.id != null ? String(m.agent.id) : undefined);
    setManualEntryValue(m.value ?? '');
    setIsManualEntryModalOpen(true);
  };

  const handleCreateManualTopAgent = async () => {
    if (!manualEntryAgentId || !manualEntryValue.trim()) {
      toast.error('Please select an agent and enter a value.');
      return;
    }
    const payload = {
      category: manualEntryCategory,
      agentId: manualEntryAgentId,
      value: manualEntryValue.trim(),
    };
    try {
      if (editingManualUuid) {
        await updateManualTopAgent({ uuid: editingManualUuid, ...payload }).unwrap();
        toast.success('Manual entry updated.');
      } else {
        await createManualTopAgent(payload).unwrap();
        toast.success('Manual entry added.');
      }
      setIsManualEntryModalOpen(false);
      resetManualEntryForm();
    } catch (error: any) {
      toast.error(error?.data?.message || (editingManualUuid ? 'Failed to update manual entry' : 'Failed to add manual entry'));
    }
  };

  const handleDeleteManualTopAgent = async (uuid: string) => {
    try {
      await deleteManualTopAgent(uuid).unwrap();
      toast.success('Manual entry removed.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to remove manual entry');
    }
  };

  // Agent Birthdays card has its own filter (same options as the dashboard
  // filter above) so changing it doesn't affect the Top Report cards.
  const [bdayFilter, setBdayFilter] = useState<string>("current");
  const [bdayRange, setBdayRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [showBdayPicker, setShowBdayPicker] = useState<boolean>(false);

  const handleBdayPresetClick = (filter: string) => {
    setBdayFilter(filter);
    setBdayRange(null);
    setShowBdayPicker(false);
  };

  const handleBdayRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setBdayRange(dates);
      setBdayFilter("custom");
    } else {
      setBdayRange(null);
      if (bdayFilter === "custom") setBdayFilter("current");
    }
  };

  // Agent birthdays within the selected filter, in date order. Birth date comes
  // from AgentAccount.dob (set via the Agent submit details form), falling
  // back to User.dateOfBirth for any agent only carrying the older field.
  // It's a date-only value stored at UTC midnight, so month/day are read via
  // the UTC getters to avoid a local-timezone off-by-one on the displayed date.
  // "All Time" lists every agent by their next upcoming birthday; the other
  // filters list each birthday that falls inside the chosen date range.
  const upcomingBirthdays = React.useMemo(() => {
    const now = dayjs();
    const todayUTC = Date.UTC(now.year(), now.month(), now.date());

    let range: { start: Dayjs; end: Dayjs } | null = null;
    if (bdayFilter === 'current') range = { start: now.startOf('month'), end: now.endOf('month') };
    else if (bdayFilter === 'previous') { const p = now.subtract(1, 'month'); range = { start: p.startOf('month'), end: p.endOf('month') }; }
    else if (bdayFilter === 'lastYear') range = { start: now.startOf('year'), end: now.endOf('year') };
    else if (bdayFilter === 'custom' && bdayRange?.[0] && bdayRange?.[1])
      range = { start: bdayRange[0].startOf('day'), end: bdayRange[1].endOf('day') };

    const people = allAgents
      .filter(
        (a) =>
          (a.brokerageId === 24 || a.brokerageId === '24') &&
          a.status !== 'closed' &&
          (a.dob || a.user?.dateOfBirth)
      )
      .map((a) => {
        const dob = new Date(a.dob || a.user.dateOfBirth);
        return {
          id: a.id,
          name: a.name,
          profilePicture: a.user?.profilePicture,
          month: dob.getUTCMonth(),
          day: dob.getUTCDate(),
        };
      });

    const rows: any[] = [];
    people.forEach((p) => {
      const occurrences: number[] = [];
      if (range) {
        const startUTC = Date.UTC(range.start.year(), range.start.month(), range.start.date());
        const endUTC = Date.UTC(range.end.year(), range.end.month(), range.end.date());
        for (let y = range.start.year(); y <= range.end.year(); y++) {
          const occ = Date.UTC(y, p.month, p.day);
          if (occ >= startUTC && occ <= endUTC) occurrences.push(occ);
        }
      } else {
        let next = Date.UTC(now.year(), p.month, p.day);
        if (next < todayUTC) next = Date.UTC(now.year() + 1, p.month, p.day);
        occurrences.push(next);
      }
      occurrences.forEach((occ) => {
        rows.push({
          key: `${p.id}-${occ}`,
          id: p.id,
          name: p.name,
          profilePicture: p.profilePicture,
          occ,
          dateLabel: new Date(occ).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            ...(range && range.start.year() !== range.end.year() ? { year: 'numeric' } : {}),
            timeZone: 'UTC',
          }),
          daysUntil: Math.round((occ - todayUTC) / 86400000),
        });
      });
    });

    return rows.sort((a, b) => a.occ - b.occ);
  }, [allAgents, bdayFilter, bdayRange]);

  const { data: tradeSheetData, isLoading: tsLoading } = useGetTradeSheetListDataQuery(undefined);
  const tradeSheetList: TradeSheet[] = tradeSheetData?.data?.tradeSheetData ?? [];

  const { data: archiveData, isLoading: archiveLoading } = useGetArchiveTradeSheetListDataQuery(undefined);

  const { data: propertyData, isLoading: propertyLoading } = useGetPropertyListingQuery({});

  const { data: announcementsData, isLoading: announcementsLoading } = useGetPublishedAnnouncementsListQuery("");
  const { data: calendarData, isLoading: calendarLoading } = useGetCalendarEventsQuery("");
  const _now = new Date();
  const hasAnnouncements = (announcementsData?.data?.announcements?.length ?? 0) > 0;
  const hasUpcomingEvents = (calendarData?.data?.calendarEvents?.filter((e: any) => new Date(e.start) >= _now).length ?? 0) > 0;
  const showRightColumn = announcementsLoading || calendarLoading || hasAnnouncements || hasUpcomingEvents;
  const recentProperties = React.useMemo(() =>
    [...(propertyData?.data?.propertyListingData ?? [])]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 5),
    [propertyData]
  );
  const recentClosed: TradeSheet[] = React.useMemo(() =>
    [...(archiveData?.data?.tradeSheetData ?? [])]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 5),
    [archiveData]
  );

  const allProperties: any[] = propertyData?.data?.propertyListingData ?? [];

  // Derive a concrete date range from the active filter so we can apply it client-side
  // to tradeSheetList and allProperties (those queries don't accept date params).
  const filterDateRange = React.useMemo((): { start: Dayjs; end: Dayjs } | null => {
    const now = dayjs();
    if (selectedMonth === 'current') return { start: now.startOf('month'), end: now.endOf('month') };
    if (selectedMonth === 'previous') { const p = now.subtract(1, 'month'); return { start: p.startOf('month'), end: p.endOf('month') }; }
    if (selectedMonth === 'lastYear') return { start: now.startOf('year'), end: now.endOf('year') };
    if (selectedMonth === 'custom' && dateRange?.[0] && dateRange?.[1])
      return { start: dateRange[0].startOf('day'), end: dateRange[1].endOf('day') };
    return null; // All Time — no filter
  }, [selectedMonth, dateRange]);

  const inRange = (dateStr: string | undefined): boolean => {
    if (!filterDateRange) return true;
    if (!dateStr) return false;
    const d = dayjs(dateStr);
    return !d.isBefore(filterDateRange.start) && !d.isAfter(filterDateRange.end);
  };

  // Trade sheets filtered by createdAt (or closingDate when available)
  const filteredTradeSheets: any[] = React.useMemo(() =>
    tradeSheetList.filter((ts: any) => {
      const dateStr = ts.properties?.[0]?.closingDate ?? ts.closingDate ?? ts.createdAt;
      return inRange(dateStr);
    }),
    [tradeSheetList, filterDateRange] // eslint-disable-line
  );

  // Properties filtered by contractDate or createdAt
  const filteredProperties: any[] = React.useMemo(() =>
    allProperties.filter((p: any) => inRange(p.contractDate ?? p.createdAt)),
    [allProperties, filterDateRange] // eslint-disable-line
  );

  // Charts always show all-time data — not affected by the date filter
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    tradeSheetList.forEach((ts: any) => {
      const s = ts.status ?? 'draft';
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return counts;
  }, [tradeSheetList]);

  const propertyStatusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allProperties.forEach((p: any) => {
      // Normalize to lowercase so "Expired" and "expired" merge into one bucket
      const s = (p.listingStatus ?? 'unknown').toLowerCase();
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return counts;
  }, [allProperties]);

  // Total sales from filtered trade sheets (soldPrice across all properties)
  const totalSalesFromSheets = React.useMemo(() =>
    filteredTradeSheets.reduce((sum: number, ts: any) => {
      const props = Array.isArray(ts.properties) ? ts.properties : [];
      return sum + props.reduce((s: number, p: any) => s + (parseFloat(p.soldPrice ?? '0') || 0), 0);
    }, 0),
    [filteredTradeSheets]
  );

  // Total commissions from filtered trade sheets — same formula as Send Invoice's
  // sellingCommissionCalculation(): commission rate% × sale price, or fixed amount.
  const totalCommissionsFromSheets = React.useMemo(() => {
    let total = 0;
    filteredTradeSheets.forEach((ts: any) => {
      const agentDetail = ts.agentDetails?.[0];
      if (!agentDetail) return;

      const rep: string = ts.representationType ?? ts.representation ?? 'buyer';
      const isSellerOrLandlord = rep === 'seller' || rep === 'landlord';
      const isMultiple = rep === 'multiple';

      const calcSideCommission = (isBuyerSide: boolean): number => {
        const price = isSellerOrLandlord || isMultiple
          ? parseFloat(ts.properties?.[0]?.salesPrice ?? '0') || 0
          : parseFloat(ts.properties?.[0]?.soldPrice ?? '0') || 0;
        // Invoice swaps field names: buyer side reads sellerCommission fields
        const commissionType: string = isBuyerSide
          ? (agentDetail.sellerCommissionType ?? 'percentage')
          : (agentDetail.buyerCommissionType ?? 'percentage');
        if (commissionType === 'amount') {
          return parseFloat(String(isBuyerSide ? agentDetail.sellerCommissionAmount ?? 0 : agentDetail.buyerCommissionAmount ?? 0)) || 0;
        }
        const rate = parseFloat(String(isBuyerSide ? agentDetail.sellerCommission ?? 0 : agentDetail.buyerCommission ?? 0)) || 0;
        return (rate / 100) * price;
      };

      total += isMultiple
        ? calcSideCommission(true) + calcSideCommission(false)
        : calcSideCommission(!isSellerOrLandlord);
    });
    return total;
  }, [filteredTradeSheets]);

  // Handle date range change
  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      setSelectedMonth("custom");
    } else {
      setDateRange(null);
      if (selectedMonth === "custom") {
        setSelectedMonth("All Time");
      }
    }
  };

  // Handle preset filter click
  const handlePresetFilterClick = (
    filter: "current" | "previous" | "lastYear" | "All Time"
  ) => {
    setSelectedMonth(filter);
    setDateRange(null);
    setShowDatePicker(false);
  };

  const handleCalendarIconClick = () => {
    setShowDatePicker(!showDatePicker);
  };

  return (
    <div className="min-h-screen flex flex-col mb-5 gap-5">
      <div className="w-full">
        <div className="space-y-6">
          <div>
            <h1 className="mb-2">
              Welcome to Dream Valley Realty's Agent's Hub
            </h1>

            {/* Filter Tags and Calendar Icon */}
            <div className="flex flex-wrap gap-2 items-center">
              <Tag
                onClick={() => handlePresetFilterClick("All Time")}
                className={`cursor-pointer transition-all ${selectedMonth === "All Time"
                  ? "bg-[#9F8667] text-white border-[#9F8667]"
                  : "bg-gray-200 text-gray-700 border-gray-200"
                  }`}
              >
                All Time
              </Tag>
              <Tag
                onClick={() => handlePresetFilterClick("lastYear")}
                className={`cursor-pointer transition-all ${selectedMonth === "lastYear"
                  ? "bg-[#9F8667] text-white border-[#9F8667]"
                  : "bg-gray-200 text-gray-700 border-gray-200"
                  }`}
              >
                This Year
              </Tag>
              <Tag
                onClick={() => handlePresetFilterClick("current")}
                className={`cursor-pointer transition-all ${selectedMonth === "current"
                  ? "bg-[#9F8667] text-white border-[#9F8667]"
                  : "bg-gray-200 text-gray-700 border-gray-200"
                  }`}
              >
                This Month
              </Tag>
              <Tag
                onClick={() => handlePresetFilterClick("previous")}
                className={`cursor-pointer transition-all ${selectedMonth === "previous"
                  ? "bg-[#9F8667] text-white border-[#9F8667]"
                  : "bg-gray-200 text-gray-700 border-gray-200"
                  }`}
              >
                Previous Month
              </Tag>

              {/* Calendar Icon */}
              <div
                onClick={handleCalendarIconClick}
                className={`cursor-pointer px-1 py-0 rounded transition-all ${showDatePicker || selectedMonth === "custom"
                  ? "bg-[#9F8667] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                title="Custom Date Range"
              >
                <CalendarOutlined style={{ fontSize: "16px" }} />
              </div>

              {/* Date Range Picker */}
              {showDatePicker && (
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="YYYY-MM-DD"
                  placeholder={["Start Date", "End Date"]}
                  size="middle"
                  className={`custom-date-picker ${selectedMonth === "custom" ? "border-[#9F8667]" : ""
                    }`}
                  popupClassName="custom-date-picker-dropdown"
                  style={{
                    borderColor:
                      selectedMonth === "custom" ? "#9F8667" : undefined,
                  }}
                  open={showDatePicker ? undefined : false}
                />
              )}

              {/* Add Manual Entry sits on the filter row (right side), so the cards don't need an extra row */}
              {user?.userType === 'superAdmin' && (
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setIsManualEntryModalOpen(true)}
                  className="ml-auto"
                  style={{ borderColor: '#9F8667', color: '#9F8667' }}
                >
                  Add Manual Entry
                </Button>
              )}
            </div>

            {/* Display selected date range */}
            {selectedMonth === "custom" &&
              dateRange &&
              dateRange[0] &&
              dateRange[1] && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Selected Range: </span>
                  {dateRange[0].format("MMM DD, YYYY")} -{" "}
                  {dateRange[1].format("MMM DD, YYYY")}
                </div>
              )}

            {/* Loading Overlay */}
            {(isLoading || isFetching) && (
              <div className="relative">
                <div
                  className="absolute inset-0 bg-transparent z-10 flex items-center justify-center rounded-lg"
                  style={{ minHeight: "30px" }}
                >
                  <div className="text-center">
                    <Spin indicator={loadingIcon} />
                    <p className="mt-4 text-gray-600 font-medium">
                      Loading agent data...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards — all tied top agents per category, plus any admin-curated manual entries */}
            {(() => {
              const CATEGORY_META: Record<string, { title: string; badgeIcon: React.ReactNode; badgeColor: string }> = {
                commission: { title: "Top Commission Earner", badgeIcon: <TrophyOutlined />, badgeColor: '#D4AF37' },
                units: { title: "Top Unit Seller", badgeIcon: <RiseOutlined />, badgeColor: '#8B9DAA' },
                sales: { title: "Top Seller", badgeIcon: <CrownOutlined />, badgeColor: '#CD7F32' },
                listings: { title: "Top Listing Agent", badgeIcon: <HomeOutlined />, badgeColor: '#9F8667' },
              };

              // A bare number typed in a manual entry is shown like the computed cards
              // ("1250000" -> "$1,250,000.00" for money, "2" -> "2 Units"); anything else is shown as typed.
              const formatManualValue = (category: string, raw: any) => {
                const text = String(raw ?? '').trim();
                const num = Number(text.replace(/[$,\s]/g, ''));
                if (!text || !/^\$?\s*[\d,]+(\.\d+)?$/.test(text) || !Number.isFinite(num)) return text;
                if (category === 'sales' || category === 'commission') return `$${formatNumberWithCommasAndDecimals(num)}`;
                if (category === 'units') return `${num} Units`;
                if (category === 'listings') return `${num} Listings`;
                return text;
              };

              const manualCardFor = (category: string) =>
                manualTopAgents
                  .filter((m) => m.category === category)
                  .map((m) => {
                    const meta = CATEGORY_META[m.category] || CATEGORY_META.units;
                    return {
                      key: `manual-${m.uuid}`,
                      title: meta.title,
                      profilePicture: m.agent?.user?.profilePicture,
                      name: m.agent?.name || 'N/A',
                      value: formatManualValue(m.category, m.value),
                      breakdownData: undefined,
                      badgeIcon: meta.badgeIcon,
                      badgeColor: meta.badgeColor,
                      isManual: true,
                      onDelete: () => handleDeleteManualTopAgent(m.uuid),
                      onEdit: () => openEditManualTopAgent(m),
                    };
                  });

              // An agent with a manual entry in a category replaces their own computed card there
              // (no "Anwarul Azim 1 Units" next to the manual "Anwarul Azim 2 Units").
              const manualNames = (category: string) =>
                new Set(
                  manualTopAgents
                    .filter((m) => m.category === category)
                    .map((m) => String(m.agent?.name || '').trim().toLowerCase())
                    .filter(Boolean)
                );
              const notOverridden = (category: string) => {
                const names = manualNames(category);
                return (a: any) => !names.has(String(a?.name || '').trim().toLowerCase());
              };

              // Manual entries are inserted right after the computed entries for the
              // same category, so they sit side by side with their category's other
              // cards instead of being visually set apart as a separate group.
              const cards = [
                ...topCommissions.filter(notOverridden('commission')).map((a) => ({
                  key: `commission-${a.name}`,
                  title: "Top Commission Earner",
                  profilePicture: a.profilePicture,
                  name: a.name,
                  value: `$${formatNumberWithCommasAndDecimals(a.totalCommission)}`,
                  breakdownData: { type: "commission" as const, details: a.commissionDetails || [], total: a.totalCommission },
                  badgeIcon: <TrophyOutlined />,
                  badgeColor: '#D4AF37',
                })),
                ...manualCardFor('commission'),
                ...topUnitSellers.filter(notOverridden('units')).map((a) => ({
                  key: `units-${a.name}`,
                  title: "Top Unit Seller",
                  profilePicture: a.profilePicture,
                  name: a.name,
                  value: `${a.totalUnits} Units`,
                  breakdownData: { type: "units" as const, details: a.tradeSheetDetails || [], total: a.totalUnits },
                  badgeIcon: <RiseOutlined />,
                  badgeColor: '#8B9DAA',
                })),
                ...manualCardFor('units'),
                ...topSellerTotals.filter(notOverridden('sales')).map((a) => ({
                  key: `sales-${a.name}`,
                  title: "Top Seller",
                  profilePicture: a.profilePicture,
                  name: a.name,
                  value: `$${formatNumberWithCommasAndDecimals(a.totalSales)}`,
                  breakdownData: { type: "sales" as const, details: a.tradeSheetDetails || [], total: a.totalSales },
                  badgeIcon: <CrownOutlined />,
                  badgeColor: '#CD7F32',
                })),
                ...manualCardFor('sales'),
                ...topListingAgents.filter(notOverridden('listings')).map((a) => ({
                  key: `listings-${a.name}`,
                  title: "Top Listing Agent",
                  profilePicture: a.profilePicture,
                  name: a.name,
                  value: `${a.totalListings} Listings`,
                  breakdownData: { type: "listings" as const, details: a.listingDetails || [], total: a.totalListings },
                  badgeIcon: <HomeOutlined />,
                  badgeColor: '#9F8667',
                })),
                ...manualCardFor('listings'),
              ];

              const isSuperAdmin = user?.userType === 'superAdmin';

              return (
                <div className="my-6">
                  {cards.length === 0 ? null : (
                    <div
                      className={`grid gap-6 transition-opacity duration-300 ${isLoading || isFetching ? "opacity-30 pointer-events-none" : "opacity-100"}`}
                      style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 5)}, minmax(0, 1fr))` }}
                    >
                      {cards.map((c) => (
                        <StatCard
                          key={c.key}
                          title={c.title}
                          borderColor="border-[#9F8667]"
                          bgColor="bg-[#9F8667]"
                          profilePicture={c.profilePicture}
                          name={c.name}
                          value={c.value}
                          breakdownData={c.breakdownData}
                          badgeIcon={c.badgeIcon}
                          badgeColor={c.badgeColor}
                          isManual={(c as any).isManual}
                          onDelete={isSuperAdmin ? (c as any).onDelete : undefined}
                          onEdit={isSuperAdmin ? (c as any).onEdit : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <Modal
              title={editingManualUuid ? "Edit Manual Top Agent Entry" : "Add Manual Top Agent Entry"}
              open={isManualEntryModalOpen}
              onCancel={() => {
                setIsManualEntryModalOpen(false);
                resetManualEntryForm();
              }}
              footer={[
                <Button key="cancel" onClick={() => { setIsManualEntryModalOpen(false); resetManualEntryForm(); }}>
                  Cancel
                </Button>,
                <Button
                  key="save"
                  type="primary"
                  loading={isCreatingManualTopAgent || isUpdatingManualTopAgent}
                  onClick={handleCreateManualTopAgent}
                  style={{ background: '#9F8667', borderColor: '#9F8667' }}
                >
                  Save
                </Button>,
              ]}
            >
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Select
                    className="w-full"
                    value={manualEntryCategory}
                    onChange={setManualEntryCategory}
                    options={[
                      { value: 'commission', label: 'Top Commission Earner' },
                      { value: 'units', label: 'Top Unit Seller' },
                      { value: 'sales', label: 'Top Seller' },
                      { value: 'listings', label: 'Top Listing Agent' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                  <Select
                    className="w-full"
                    showSearch
                    placeholder="Select an agent"
                    value={manualEntryAgentId}
                    onChange={setManualEntryAgentId}
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={allAgents.map((a) => ({ value: String(a.id), label: a.name }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <Input
                    placeholder='e.g. "5 Units", "$50,000.00", "3 Listings"'
                    value={manualEntryValue}
                    onChange={(e) => setManualEntryValue(e.target.value)}
                  />
                </div>
              </div>
            </Modal>

            {/* ── Dashboard Overview ─────────────────────────────── */}
            <div className="mt-4 space-y-5">

              {/* KPI Summary Cards — privileged admins only */}
              {isPrivilegedAdmin && (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
                  {(isLoading || isFetching || agentListLoading) ? (
                    Array.from({ length: 5 }).map((_, i) => {
                      const { accent, light } = KPI_ACCENTS[i % KPI_ACCENTS.length];
                      return (
                        <div key={i} className="rounded-2xl overflow-hidden shadow-md" style={{ background: 'white' }}>
                          <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${light})` }} />
                          <div className="p-5">
                            <div className="w-10 h-10 rounded-xl animate-pulse mb-4" style={{ background: light }} />
                            <div className="h-6 rounded-lg animate-pulse mb-2" style={{ background: '#F3EDE8', width: '55%' }} />
                            <div className="h-2.5 rounded animate-pulse" style={{ background: '#F8F4F1', width: '70%' }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <KpiCard index={0} icon={<TeamOutlined />} label="Our Agents" value={String(agentCategoryCounts.ourAgents)} />
                      <KpiCard index={1} icon={<FileTextOutlined />} label="Trade Sheets" value={String(filteredTradeSheets.length)} />
                      <KpiCard index={2} icon={<HomeOutlined />} label="Listings" value={String(filteredProperties.length)} />
                      <KpiCard index={3} icon={<RiseOutlined />} label="Total Sales" value={`$${formatNumberWithCommasAndDecimals(totalSalesFromSheets)}`} />
                      <KpiCard index={4} icon={<TrophyOutlined />} label="Commissions" value={`$${formatNumberWithCommasAndDecimals(totalCommissionsFromSheets)}`} />
                    </>
                  )}
                </div>
              )}

              {/* Row 1: Agent bar chart + Tradesheet donut + Property donut */}
              <div className={`grid gap-5 ${isSuperAdmin ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                {isSuperAdmin && (
                  agentListLoading ? (
                    <div className="bg-white rounded-2xl shadow-md p-5">
                      <Skeleton active title={{ width: '40%' }} paragraph={false} />
                      <div className="flex items-end gap-4 mt-6" style={{ height: 130 }}>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2">
                            <div className="w-full rounded-t-xl animate-pulse bg-gray-200" style={{ height: [90, 130, 60, 20][i] }} />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-4 mt-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex-1 h-3 rounded bg-gray-100 animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ) : allAgents.length > 0 ? (
                    <AgentCategoryChart counts={agentCategoryCounts} />
                  ) : null
                )}

                {tsLoading ? (
                  <DonutSkeleton />
                ) : tradeSheetList.length > 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold text-gray-800 text-[13px]">Tradesheet Overview</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Distribution by status</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#FDF6EE', color: '#9F8667' }}>
                        {tradeSheetList.length} Total
                      </span>
                    </div>
                    <TradeStatusDonut statusCounts={statusCounts} total={tradeSheetList.length} />
                  </div>
                ) : null}

                {propertyLoading ? (
                  <DonutSkeleton />
                ) : allProperties.length > 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold text-gray-800 text-[13px]">Property Overview</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Distribution by status</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#FDF6EE', color: '#9F8667' }}>
                        {allProperties.length} Total
                      </span>
                    </div>
                    <PropertyStatusDonut statusCounts={propertyStatusCounts} total={allProperties.length} />
                  </div>
                ) : null}
              </div>

              {/* Announcements + Upcoming Events + Agent Birthdays */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col" style={{ maxHeight: 400 }}>
                  <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: '2px solid #F5EFE8' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FDF6EE' }}>
                      <CalendarOutlined style={{ color: '#9F8667', fontSize: 15 }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-[13px]">Announcements</p>
                      <p className="text-[11px] text-gray-400">Latest updates</p>
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    <Announcement />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col" style={{ maxHeight: 400 }}>
                  <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: '2px solid #F5EFE8' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FDF6EE' }}>
                      <CalendarOutlined style={{ color: '#9F8667', fontSize: 15 }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-[13px]">Upcoming Events</p>
                      <p className="text-[11px] text-gray-400">Scheduled calendar events</p>
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    <UpcommingCalendar />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col" style={{ maxHeight: 400 }}>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-6 py-4 shrink-0" style={{ borderBottom: '2px solid #F5EFE8' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FDF6EE' }}>
                        <GiftOutlined style={{ color: '#9F8667', fontSize: 15 }} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-[13px]">Agent Birthdays</p>
                        <p className="text-[11px] text-gray-400">
                          {bdayFilter === 'current' && 'This month'}
                          {bdayFilter === 'previous' && 'Previous month'}
                          {bdayFilter === 'custom' && bdayRange?.[0] && bdayRange?.[1] &&
                            `${bdayRange[0].format('MMM DD, YYYY')} - ${bdayRange[1].format('MMM DD, YYYY')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                    {!showBdayPicker && [
                      { key: 'current', label: 'This Month' },
                      { key: 'previous', label: 'Previous Month' },
                    ].map(({ key, label }) => (
                      <Tag
                        key={key}
                        onClick={() => handleBdayPresetClick(key)}
                        className={`cursor-pointer transition-all !m-0 ${bdayFilter === key
                          ? "bg-[#9F8667] text-white border-[#9F8667]"
                          : "bg-gray-200 text-gray-700 border-gray-200"
                          }`}
                      >
                        {label}
                      </Tag>
                    ))}
                    <div
                      onClick={() => setShowBdayPicker(!showBdayPicker)}
                      className={`cursor-pointer px-1 py-0 rounded transition-all ${showBdayPicker || bdayFilter === "custom"
                        ? "bg-[#9F8667] text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      title="Custom Date Range"
                    >
                      <CalendarOutlined style={{ fontSize: "16px" }} />
                    </div>
                    {showBdayPicker && (
                      <RangePicker
                        value={bdayRange}
                        onChange={handleBdayRangeChange}
                        format="MMM DD"
                        placeholder={["Start", "End"]}
                        size="small"
                        className="custom-date-picker"
                        popupClassName="custom-date-picker-dropdown"
                        style={{ width: 190, fontSize: 12, borderColor: bdayFilter === "custom" ? "#9F8667" : undefined }}
                      />
                    )}
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {agentListLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <LoadingOutlined style={{ color: '#9F8667', fontSize: 20 }} />
                      </div>
                    ) : upcomingBirthdays.length > 0 ? (
                      upcomingBirthdays.map((b, i) => (
                        <div
                          key={b.key}
                          className={`flex items-center gap-3 px-5 py-3 ${i !== 0 ? 'border-t' : ''}`}
                          style={{ borderColor: '#F5EFE8' }}
                        >
                          <div className="w-9 h-9 rounded-full bg-gray-50 shrink-0 overflow-hidden">
                            <img
                              className="h-full w-full object-cover"
                              src={b.profilePicture ? getFileUrl(b.profilePicture) : defaultAvatar}
                              alt={b.name}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-gray-800 truncate">{b.name}</p>
                            <p className="text-[11px] text-gray-400">{b.dateLabel}</p>
                          </div>
                          {b.daysUntil === 0 ? (
                            <span
                              className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                              style={{ background: '#FDF6EE', color: '#9F8667' }}
                            >
                              🎂 Today
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {b.daysUntil > 0
                                ? (b.daysUntil === 1 ? 'in 1 day' : `in ${b.daysUntil} days`)
                                : (b.daysUntil === -1 ? '1 day ago' : `${Math.abs(b.daysUntil)} days ago`)}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <span className="text-3xl mb-2">🎂</span>
                        <p className="text-xs">No birthdays in this period</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2 + 3: Recent Closed Tradesheets & Recent Properties side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Recent Closed Tradesheets */}
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '2px solid #F5EFE8' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FDF6EE' }}>
                        <FileTextOutlined style={{ color: '#9F8667', fontSize: 15 }} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-[13px]">Recent Closed Tradesheets</p>
                        <p className="text-[11px] text-gray-400">Latest completed transactions</p>
                      </div>
                    </div>
                    {!archiveLoading && (
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#FDF6EE', color: '#9F8667' }}>
                        {recentClosed.length} Recent
                      </span>
                    )}
                  </div>

                  {/* Column headers */}
                  {!archiveLoading && recentClosed.length > 0 && (
                    <div className="grid grid-cols-12 px-6 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="col-span-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">#</span>
                      <span className="col-span-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ref No.</span>
                      <span className="col-span-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Property</span>
                      <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Status</span>
                      <span className="col-span-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Date</span>
                    </div>
                  )}

                  <div>
                    {archiveLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-50 gap-2">
                          <div className="col-span-1 h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
                          <div className="col-span-4 h-3 rounded bg-gray-200 animate-pulse" />
                          <div className="col-span-4 h-3 rounded bg-gray-100 animate-pulse" />
                          <div className="col-span-2 h-5 w-14 rounded-full bg-gray-200 animate-pulse mx-auto" />
                          <div className="col-span-1 h-3 rounded bg-gray-100 animate-pulse" />
                        </div>
                      ))
                    ) : recentClosed.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#FDF6EE' }}>
                          <FileTextOutlined style={{ color: '#CDB499', fontSize: 22 }} />
                        </div>
                        <p className="text-[12px] text-gray-400 font-medium">No closed tradesheets yet</p>
                      </div>
                    ) : (
                      recentClosed.map((ts, i) => {
                        const address = ts.properties?.[0]?.propertyAddress;
                        const dateStr = ts.createdAt
                          ? new Date(ts.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                          : '—';
                        return (
                          <div
                            key={i}
                            className="grid grid-cols-12 items-center px-6 py-3.5 border-b border-gray-50 hover:bg-[#FDFAF7] transition-colors"
                          >
                            {/* Index */}
                            <div className="col-span-1">
                              <span
                                className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                                style={{ background: BRAND_PALETTE[Math.min(i, BRAND_PALETTE.length - 1)] }}
                              >
                                {i + 1}
                              </span>
                            </div>
                            {/* Ref */}
                            <div className="col-span-4 min-w-0">
                              <p className="text-[12px] font-semibold text-gray-800 truncate">{ts.tradeSheetTypeId || `TS-${i + 1}`}</p>
                            </div>
                            {/* Property */}
                            <div className="col-span-4 min-w-0">
                              {address ? (
                                <p className="text-[11px] text-gray-500 truncate">{address}</p>
                              ) : (
                                <span className="text-[11px] text-gray-300">—</span>
                              )}
                            </div>
                            {/* Status badge */}
                            <div className="col-span-2 flex justify-center">
                              <span
                                className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                                style={{ background: '#F0EBE5', color: '#6B5745' }}
                              >
                                Closed
                              </span>
                            </div>
                            {/* Date */}
                            <div className="col-span-1 text-right">
                              <p className="text-[10px] text-gray-400 whitespace-nowrap">{dateStr}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Recent Properties */}
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '2px solid #F5EFE8' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FDF6EE' }}>
                        <HomeOutlined style={{ color: '#9F8667', fontSize: 15 }} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-[13px]">Recent Properties</p>
                        <p className="text-[11px] text-gray-400">Latest property listings</p>
                      </div>
                    </div>
                    {!propertyLoading && (
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#FDF6EE', color: '#9F8667' }}>
                        {propertyData?.data?.propertyListingData?.length ?? 0} Total
                      </span>
                    )}
                  </div>

                  {/* Column headers */}
                  {!propertyLoading && recentProperties.length > 0 && (
                    <div className="grid grid-cols-12 px-6 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="col-span-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">#</span>
                      <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ref</span>
                      <span className="col-span-5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Address</span>
                      <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">MLS</span>
                      <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Status</span>
                    </div>
                  )}

                  <div>
                    {propertyLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-50 gap-2">
                          <div className="col-span-1 h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
                          <div className="col-span-2 h-3 rounded bg-gray-200 animate-pulse" />
                          <div className="col-span-5 h-3 rounded bg-gray-100 animate-pulse" />
                          <div className="col-span-2 h-3 rounded bg-gray-100 animate-pulse" />
                          <div className="col-span-2 h-5 w-14 rounded-full bg-gray-200 animate-pulse mx-auto" />
                        </div>
                      ))
                    ) : recentProperties.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#FDF6EE' }}>
                          <HomeOutlined style={{ color: '#CDB499', fontSize: 22 }} />
                        </div>
                        <p className="text-[12px] text-gray-400 font-medium">No properties yet</p>
                      </div>
                    ) : (
                      recentProperties.map((prop, i) => {
                        const statusRaw: string = prop.listingStatus ?? '';
                        const isActive = ['listed', 'New', 'Price Change', 'Extended', 'Exclusive', 'DFT'].includes(statusRaw);
                        const isSold = statusRaw === 'Sold';
                        const statusBg = isSold ? '#F0EBE5' : isActive ? '#EDF7F0' : '#F5F5F5';
                        const statusColor = isSold ? '#6B5745' : isActive ? '#3A7D55' : '#9CA3AF';
                        return (
                          <div
                            key={i}
                            className="grid grid-cols-12 items-center px-6 py-3.5 border-b border-gray-50 hover:bg-[#FDFAF7] transition-colors"
                          >
                            <div className="col-span-1">
                              <span
                                className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                                style={{ background: BRAND_PALETTE[Math.min(i, BRAND_PALETTE.length - 1)] }}
                              >
                                {i + 1}
                              </span>
                            </div>
                            <div className="col-span-2 min-w-0">
                              <p className="text-[11px] font-semibold text-gray-800 truncate">{prop.propertyListingTypeId || prop.mlsNumber || '—'}</p>
                            </div>
                            <div className="col-span-5 min-w-0">
                              <p className="text-[11px] text-gray-500 truncate">{prop.propertyAddress || '—'}</p>
                            </div>
                            <div className="col-span-2 text-center">
                              <p className="text-[10px] text-gray-400 truncate">{prop.mlsNumber || '—'}</p>
                            </div>
                            <div className="col-span-2 flex justify-center">
                              {statusRaw ? (
                                <span
                                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                                  style={{ background: statusBg, color: statusColor }}
                                >
                                  {statusRaw}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-300">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>{/* end side-by-side grid */}

            </div>
          </div>

          {/* Conditionally render New Agent section */}
          {hasNewAgents && (
            <div>
              <h1>New Agent</h1>
              <NewAgent />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable component for Stat Cards
interface BreakdownData {
  type: "commission" | "units" | "sales" | "listings";
  details: CommissionDetail[] | TradeSheetDetail[] | ListingDetail[];
  total: number;
}

interface StatCardProps {
  title: string;
  borderColor: string;
  bgColor: string;
  profilePicture: string | null;
  name: string;
  value: string;
  breakdownData?: BreakdownData;
  badgeIcon?: React.ReactNode;
  badgeColor?: string;
  isManual?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  borderColor,
  bgColor,
  profilePicture,
  name,
  value,
  breakdownData,
  badgeIcon,
  badgeColor = '#9F8667',
  isManual,
  onDelete,
  onEdit,
}) => {
  const { user } = useAppSelector((state) => state.user);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderBreakdownContent = () => {
    if (!breakdownData || breakdownData.details.length === 0) {
      return <div className="text-sm text-gray-500">No details available</div>;
    }

    if (breakdownData.type === "commission") {
      const details = breakdownData.details as CommissionDetail[];
      return (
        <div className="w-96 max-h-96 overflow-y-auto">
          <div className="mb-3 pb-2 border-b">
            <h4 className="font-semibold text-gray-800">
              Commissions Breakdown
            </h4>
            <p className="text-xs text-gray-500">
              Total: ${formatNumberWithCommasAndDecimals(breakdownData.total)}
            </p>
          </div>
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700">
                    ${formatNumberWithCommasAndDecimals(detail.commission)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(detail.createdAt)}
                  </span>
                </div>
                {detail.tradeSheetTypeId && (
                  <div className="text-xs text-gray-600 mt-1">
                    <span className="text-gray-500">Reference:</span>{" "}
                    <span className="font-medium text-[#9F8667]">
                      {detail.tradeSheetTypeId}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (breakdownData.type === "units") {
      const details = breakdownData.details as TradeSheetDetail[];
      return (
        <div className="w-96 max-h-96 overflow-y-auto">
          <div className="mb-3 pb-2 border-b">
            <h4 className="font-semibold text-gray-800">Top Units Breakdown</h4>
            <p className="text-xs text-gray-500">
              Total Units: {breakdownData.total}
            </p>
          </div>
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700">
                    {detail.tradeSheetTypeId
                      ? `${detail.tradeSheetTypeId}`
                      : `Tradesheet #${detail.id || index + 1}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {detail.closingDate ? formatDate(detail.closingDate) : "N/A"}
                  </span>
                </div>
                {detail.tradeSheetTypeId && (
                  <div className="text-xs mb-2">
                    <span className="text-gray-500">Reference:</span>{" "}
                    <span className="font-medium text-[#9F8667]">
                      {detail.tradeSheetTypeId}
                    </span>
                  </div>
                )}
                {detail.properties && detail.properties.length > 0 ? (
                  <div className="text-xs text-gray-600 space-y-2">
                    {detail.properties.map((property, propIndex) => (
                      <div
                        key={propIndex}
                        className="pt-1 border-t border-gray-200 first:border-t-0 first:pt-0"
                      >
                        {property.propertyAddress && (
                          <div className="mb-1">
                            <span className="text-gray-500">Property:</span>{" "}
                            {property.propertyAddress}
                          </div>
                        )}
                        {(property.salesPrice || property.soldPrice) && (
                          <div className="grid grid-cols-2 gap-2">
                            {property.salesPrice && (
                              <div>
                                <span className="text-gray-500">
                                  Sales Price:
                                </span>{" "}
                                $
                                {formatNumberWithCommasAndDecimals(
                                  parseFloat(property.salesPrice || "0")
                                )}
                              </div>
                            )}
                            {property.soldPrice && (
                              <div>
                                <span className="text-gray-500">
                                  Sold Price:
                                </span>{" "}
                                $
                                {formatNumberWithCommasAndDecimals(
                                  parseFloat(property.soldPrice || "0")
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    No properties available
                  </div>
                )}
                {detail.closingDate && (
                  <div className="text-xs text-gray-600 mt-2 pt-2 border-t">
                    <span className="text-gray-500">Closed On:</span>{" "}
                    <span className="font-medium">
                      {formatDate(detail.closingDate)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (breakdownData.type === "sales") {
      const details = breakdownData.details as TradeSheetDetail[];
      return (
        <div className="w-96 max-h-96 overflow-y-auto">
          <div className="mb-3 pb-2 border-b">
            <h4 className="font-semibold text-gray-800">Sales Breakdown</h4>
            <p className="text-xs text-gray-500">
              Total Sales Value: $
              {formatNumberWithCommasAndDecimals(breakdownData.total)}
            </p>
            <p className="text-xs text-gray-400">(Based on Sold Price)</p>
          </div>
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700">
                    {detail.tradeSheetTypeId
                      ? `TS-${detail.tradeSheetTypeId}`
                      : `Tradesheet #${detail.id || index + 1}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {detail.closingDate ? formatDate(detail.closingDate) : "N/A"}
                  </span>
                </div>
                {detail.tradeSheetTypeId && (
                  <div className="text-xs mb-2">
                    <span className="text-gray-500">Reference:</span>{" "}
                    <span className="font-medium text-[#9F8667]">
                      {detail.tradeSheetTypeId}
                    </span>
                  </div>
                )}

                {/* Show property details with individual prices */}
                {detail.properties && detail.properties.length > 0 ? (
                  <div className="space-y-2 mb-2">
                    {detail.properties.map((property, propIndex) => (
                      <div
                        key={propIndex}
                        className="text-xs border-t pt-2 first:border-t-0 first:pt-0"
                      >
                        {property.propertyAddress && (
                          <div className="mb-1 font-medium text-gray-700">
                            {property.propertyAddress}
                          </div>
                        )}
                        {property.mlsNumber && (
                          <div className="mb-1 text-gray-500">
                            MLS: {property.mlsNumber}
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          {property.listingPrice && (
                            <div>
                              <span className="text-gray-500">Listing:</span> $
                              {formatNumberWithCommasAndDecimals(
                                parseFloat(property.listingPrice || "0")
                              )}
                            </div>
                          )}
                          {property.salesPrice && (
                            <div>
                              <span className="text-gray-500">Sales:</span> $
                              {formatNumberWithCommasAndDecimals(
                                parseFloat(property.salesPrice || "0")
                              )}
                            </div>
                          )}
                          {property.soldPrice && (
                            <div className="font-medium text-[#9F8667]">
                              <span className="text-gray-500">Sold:</span> $
                              {formatNumberWithCommasAndDecimals(
                                parseFloat(property.soldPrice || "0")
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    No properties available
                  </div>
                )}

                {/* Show total sold price for this trade sheet */}
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Total Sold Value:
                    </span>
                    <span className="font-semibold text-gray-700 text-sm">
                      ${formatNumberWithCommasAndDecimals(detail.soldPrice)}
                    </span>
                  </div>
                </div>

                {/* Show closed date */}
                {detail.closingDate && (
                  <div className="text-xs text-gray-600 mt-2">
                    <span className="text-gray-500">Closed On:</span>{" "}
                    <span className="font-medium">
                      {formatDate(detail.closingDate)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (breakdownData.type === "listings") {
      const details = breakdownData.details as ListingDetail[];
      return (
        <div className="w-96 max-h-96 overflow-y-auto">
          <div className="mb-3 pb-2 border-b">
            <h4 className="font-semibold text-gray-800">
              Property Listings Breakdown
            </h4>
            <p className="text-xs text-gray-500">
              Total Listings: {breakdownData.total}
            </p>
          </div>
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700">
                    {detail.propertyListingTypeId || detail.mlsNumber
                      ? `${detail.propertyListingTypeId || detail.mlsNumber}`
                      : `Listing #${detail.id || index + 1}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(detail.contractDate)}
                  </span>
                </div>

                {(detail.propertyListingTypeId || detail.mlsNumber) && (
                  <div className="text-xs mb-2">
                    <span className="text-gray-500">Reference:</span>{" "}
                    <span className="font-medium text-[#9F8667]">
                      {detail.propertyListingTypeId || detail.mlsNumber}
                    </span>
                  </div>
                )}

                {detail.propertyAddress && (
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="text-gray-500">Property:</span>{" "}
                    {detail.propertyAddress}
                  </div>
                )}

                {(detail.city || detail.state) && (
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="text-gray-500">Location:</span>{" "}
                    {[detail.city, detail.state].filter(Boolean).join(", ")}
                  </div>
                )}

                {detail.listingPrice && (
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="text-gray-500">Listing Price:</span> $
                    {formatNumberWithCommasAndDecimals(
                      parseFloat(detail.listingPrice)
                    )}
                  </div>
                )}

                {detail.listingStatus && (
                  <div className="text-xs text-gray-600">
                    <span className="text-gray-500">Status:</span>{" "}
                    <span className="font-medium">{detail.listingStatus}</span>
                  </div>
                )}

                <div className="text-xs text-gray-600 mt-1">
                  <span className="text-gray-500">Contract Date:</span>{" "}
                  {formatDate(detail.contractDate)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const cardContent = (
    <div
      className={`relative bg-white rounded-lg shadow-md p-5 border-l-8 ${borderColor} hover:shadow-lg transition-all cursor-pointer`}
    >
      {onEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className={`absolute top-2 ${onDelete ? 'right-8' : 'right-2'} w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#9F8667] transition-colors z-10`}
          title="Edit manual entry"
        >
          <EditOutlined style={{ fontSize: 10 }} />
        </button>
      )}
      {onDelete && (
        <Popconfirm
          title="Remove this manual entry?"
          onConfirm={(e) => { e?.stopPropagation(); onDelete(); }}
          onCancel={(e) => e?.stopPropagation()}
          okText="Remove"
          cancelText="Cancel"
        >
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-400 transition-colors z-10"
            title="Remove manual entry"
          >
            <CloseOutlined style={{ fontSize: 10 }} />
          </button>
        </Popconfirm>
      )}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center">
        <span
          className={`flex items-center gap-1.5 whitespace-nowrap ${bgColor} text-white text-xs px-3 py-1 shadow-md ${badgeIcon ? 'rounded-l-full' : 'rounded-full'}`}
        >
          {title}
        </span>
        {badgeIcon && (
          <span
            className="flex items-center justify-center w-6 h-6 rounded-full shadow-md -ml-px"
            style={{
              background: `linear-gradient(145deg, ${badgeColor}ff, ${badgeColor}bb)`,
              boxShadow: `0 0 0 2px white, 0 2px 6px ${badgeColor}66`,
            }}
          >
            <span className="text-white" style={{ fontSize: 10 }}>{badgeIcon}</span>
          </span>
        )}
      </div>
      <div className="flex items-center space-x-4 mt-4">
        {profilePicture ? (
          <img
            src={getFileUrl(profilePicture)}
            alt={name}
            className="w-14 h-14 rounded-full object-cover border-2"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-sm">N/A</span>
          </div>
        )}
        <div>
          <p className="font-semibold">{name}</p>
          {(user.role === "superadmin" || user.userType === "superAdmin") && (
            <p className="text-gray-500">{value}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (breakdownData && breakdownData.details.length > 0) {
    return (
      <Popover
        content={renderBreakdownContent()}
        trigger="hover"
        placement="top"
        overlayClassName="breakdown-popover"
      >
        {cardContent}
      </Popover>
    );
  }

  return cardContent;
};

// ── Agent Category Bar Chart ─────────────────────────────────
// Warm stepped palette — darkest to lightest
const BRAND_PALETTE = ['#6B5745', '#9F8667', '#B89B7A', '#CDB499', '#DEC8B0', '#EFE0D0'];

const AGENT_BARS = [
  { key: 'ourAgents', label: 'Our Agents' },
  { key: 'otherAgents', label: 'Other Agents' },
  { key: 'approved', label: 'Approved' },
  { key: 'terminate', label: 'Terminate' },
] as const;

const CHART_H = 130;

const AgentCategoryChart: React.FC<{ counts: Record<string, number> }> = ({ counts }) => {
  const max = Math.max(...AGENT_BARS.map(b => counts[b.key] ?? 0), 1);
  const total = (counts.ourAgents ?? 0) + (counts.otherAgents ?? 0);

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="font-semibold text-gray-800 text-[13px]">Agent Overview</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Breakdown by category</p>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#FDF6EE', color: '#9F8667' }}>
          {total} Active
        </span>
      </div>

      {/* Bar columns */}
      <div className="flex items-end gap-4" style={{ height: CHART_H }}>
        {AGENT_BARS.map(({ key, label }, i) => {
          const count = counts[key] ?? 0;
          const barH = count > 0 ? Math.max(10, Math.round((count / max) * CHART_H)) : 4;
          return (
            <div key={key} className="flex-1 flex flex-col items-center justify-end gap-1.5">
              <span className="text-[12px] font-bold text-gray-700">{count}</span>
              <div
                className="w-full rounded-t-xl"
                style={{ height: barH, background: BRAND_PALETTE[i] ?? BRAND_PALETTE[3], transition: 'height 0.7s ease' }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels row */}
      <div className="flex gap-4 mt-2">
        {AGENT_BARS.map(({ key, label }) => (
          <div key={key} className="flex-1 text-center">
            <span className="text-[11px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Tradesheet Status Donut Chart ────────────────────────────
const TS_STATUS_DEFS = [
  { key: 'closed', label: 'Closed' },
  { key: 'approved', label: 'Approved' },
  { key: 'underReview', label: 'Under Review' },
  { key: 'pending', label: 'Pending' },
  { key: 'draft', label: 'Draft' },
  { key: 'rejected', label: 'Rejected' },
];
const TS_COLORS = ['#6B5745', '#9F8667', '#B89B7A', '#CDB499', '#DEC8B0', '#C17E6E'];

const TradeStatusDonut: React.FC<{ statusCounts: Record<string, number>; total: number }> = ({ statusCounts, total }) => {
  const R = 40;
  const CIRC = 2 * Math.PI * R; // ≈ 251.33

  if (total === 0) {
    return <div className="text-center text-[12px] text-gray-400 py-6">No tradesheet data</div>;
  }

  let offset = 0;
  const segments = TS_STATUS_DEFS.map(({ key, label }, i) => {
    const count = statusCounts[key] ?? 0;
    const length = (count / total) * CIRC;
    const seg = { key, label, count, length, dashOffset: -offset, color: TS_COLORS[i] ?? TS_COLORS[0] };
    offset += length;
    return seg;
  }).filter((s) => s.count > 0);

  return (
    <div className="flex items-center gap-5">
      {/* Donut SVG */}
      <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
        <svg viewBox="0 0 100 100" width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="#f3f4f6" strokeWidth="14" />
          {segments.map((seg) => (
            <circle
              key={seg.key}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${seg.length} ${CIRC - seg.length}`}
              strokeDashoffset={seg.dashOffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[20px] font-bold text-gray-800 leading-none">{total}</span>
          <span className="text-[9px] text-gray-400 mt-0.5">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {TS_STATUS_DEFS.map(({ key, label }, i) => {
          const count = statusCounts[key] ?? 0;
          if (count === 0) return null;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TS_COLORS[i] ?? TS_COLORS[0] }} />
                <span className="text-[11px] text-gray-600 truncate">{label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[10px] text-gray-400">{pct}%</span>
                <span className="text-[11px] font-semibold w-5 text-right" style={{ color: TS_COLORS[i] ?? TS_COLORS[0] }}>{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Shared donut loading skeleton ────────────────────────────
const DonutSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-md p-5">
    <Skeleton active title={{ width: '40%' }} paragraph={false} />
    <div className="flex items-center gap-5 mt-5">
      <div className="shrink-0 rounded-full animate-pulse bg-gray-200" style={{ width: 130, height: 130 }} />
      <div className="flex-1 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center gap-3">
            <div className="h-3 rounded bg-gray-200 animate-pulse" style={{ width: `${[60, 80, 50, 40, 70][i]}%` }} />
            <div className="h-3 w-6 rounded bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Property Status Donut Chart ───────────────────────────────
const PROP_COLORS = ['#6B5745', '#9F8667', '#B89B7A', '#CDB499', '#DEC8B0', '#C17E6E', '#E8C4A0', '#D4956A'];

const PropertyStatusDonut: React.FC<{ statusCounts: Record<string, number>; total: number }> = ({ statusCounts, total }) => {
  const R = 40;
  const CIRC = 2 * Math.PI * R;

  if (total === 0) {
    return <div className="text-center text-[12px] text-gray-400 py-6">No property data</div>;
  }

  // Sort statuses by count descending, assign colors
  const entries = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  let offset = 0;
  const segments = entries.map(([key, count], i) => {
    const length = (count / total) * CIRC;
    const seg = { key, count, length, dashOffset: -offset, color: PROP_COLORS[i % PROP_COLORS.length] };
    offset += length;
    return seg;
  });

  return (
    <div className="flex items-center gap-5">
      {/* Donut SVG */}
      <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
        <svg viewBox="0 0 100 100" width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="#f3f4f6" strokeWidth="14" />
          {segments.map((seg) => (
            <circle
              key={seg.key}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${seg.length} ${CIRC - seg.length}`}
              strokeDashoffset={seg.dashOffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[20px] font-bold text-gray-800 leading-none">{total}</span>
          <span className="text-[9px] text-gray-400 mt-0.5">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 overflow-hidden">
        {segments.map((seg) => {
          const pct = Math.round((seg.count / total) * 100);
          return (
            <div key={seg.key} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                <span className="text-[11px] text-gray-600 truncate">{seg.key.charAt(0).toUpperCase() + seg.key.slice(1)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[10px] text-gray-400">{pct}%</span>
                <span className="text-[11px] font-semibold w-5 text-right" style={{ color: seg.color }}>{seg.count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── KPI Summary Card ─────────────────────────────────────────
const KPI_ACCENTS = [
  { accent: '#6B5745', bg: '#F2EAE4', light: '#FAF5F1' },
  { accent: '#9F8667', bg: '#F5EDE1', light: '#FDF8F3' },
  { accent: '#7A6655', bg: '#EEE5DC', light: '#F8F3EE' },
  { accent: '#8B7355', bg: '#F0E8DC', light: '#FAF6F1' },
  { accent: '#5C4A3A', bg: '#EBE1D8', light: '#F7F3EF' },
];

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  index?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, index = 0 }) => {
  const { accent, bg, light } = KPI_ACCENTS[index % KPI_ACCENTS.length];
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-default"
      style={{ background: 'white' }}
    >
      {/* Top gradient accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent} 0%, ${bg} 100%)` }} />
      <div className="p-5">
        {/* Icon + decorative dot */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: light }}
          >
            <span style={{ color: accent, fontSize: 18 }}>{icon}</span>
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: bg }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent, opacity: 0.4 }} />
          </div>
        </div>
        {/* Value */}
        <div
          className="text-[24px] font-extrabold leading-tight truncate mb-1"
          style={{ color: '#1A1A2E' }}
        >
          {value}
        </div>
        {/* Label */}
        <div
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: accent }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

export default Home;
