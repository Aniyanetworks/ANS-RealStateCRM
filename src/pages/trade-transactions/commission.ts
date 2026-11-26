// Trade finalize calculation — the same rules as Accounting → Trade List → Commissions
// (components/accounting/tabs/Commission.tsx for buyer and multiple representation,
// CommissionSeller.tsx for single seller representation), so finalizing here saves identical values.
/* eslint-disable @typescript-eslint/no-explicit-any */

export type CommissionCalc = {
  mode: "buyer" | "seller" | "none";
  plan: any;
  price: number;
  propertyCommission: number;
  commissionAgent: number;
  commissionBuyerAgent: number;
  commissionOwner: number;
  buySaleAdminFees: number;
  isAgentHst: boolean;
  base: number;
  baseTax: number;
  baseTotal: number;
  agent: number;
  agentTax: number;
  agentTotal: number;
  buyerAgent: number;
  unclaimedTax: number;
  net: number;
  netTax: number;
  netTotal: number;
};

const fx = (n: number) => Number(n.toFixed(2));

export function calcCommission(t: any): CommissionCalc {
  const d = t?.agentDetails?.[0] || {};
  const rep = t?.representation;
  // Which existing tab applied: Commission.tsx (multiple or buyer), CommissionSeller.tsx (single seller), none otherwise.
  const mode: CommissionCalc["mode"] = t?.representationType === "multiple" || rep === "buyer" ? "buyer" : rep === "seller" ? "seller" : "none";
  let propertyCommission = 2.5, commissionAgent = 0, commissionBuyerAgent = 0, commissionOwner = 0, buySaleAdminFees = 0, isAgentHst = false, plan: any = null;
  const fromPlan = (account: any) => {
    plan = account?.plan || null;
    commissionOwner = Number(plan?.planItems?.[1]?.commissionOwner || 0);
    buySaleAdminFees = Number(plan?.planItems?.[1]?.planSubItems?.[0]?.value || 0);
    isAgentHst = Boolean(account?.hstNo);
  };
  if (mode === "seller") {
    propertyCommission = Number(d.sellerCommission ?? 2.5) + Number(d.buyerCommission ?? 2.5);
    commissionAgent = Number(d.sellerCommission ?? 2.5);
    commissionBuyerAgent = Number(d.buyerCommission ?? 2.5);
    fromPlan(d.sellerAgentAccount);
  } else if (mode === "buyer" && rep === "seller") {
    propertyCommission = Number(d.sellerCommission || 2.5);
    commissionAgent = Number(d.sellerCommission ?? 2.5);
    fromPlan(d.sellerAgentAccount);
  } else if (mode === "buyer" && rep === "buyer") {
    propertyCommission = Number(d.buyerCommission || 2.5);
    commissionAgent = Number(d.buyerCommission ?? 2.5);
    fromPlan(d.buyerAgentAccount);
  }
  const p = t?.properties?.[0] || {};
  const price = Number((rep === "buyer" ? p.soldPrice : p.salesPrice) || 0);
  const base = fx((price * propertyCommission) / 100);
  const baseTax = fx((base * 13) / 100);
  const agent = fx((base * commissionAgent) / 100);
  const agentTax = fx((agent * (isAgentHst ? 13 : 0)) / 100);
  const buyerAgent = mode === "seller" ? fx((base * commissionBuyerAgent) / 100) : 0;
  const net = fx(base - agent - buyerAgent);
  const netTax = fx((net * 13) / 100);
  return {
    mode, plan, price, propertyCommission, commissionAgent, commissionBuyerAgent, commissionOwner, buySaleAdminFees, isAgentHst,
    base, baseTax, baseTotal: fx(base + baseTax),
    agent, agentTax, agentTotal: fx(agent + agentTax),
    buyerAgent,
    unclaimedTax: fx((agent * (isAgentHst ? 0 : 13)) / 100),
    net, netTax, netTotal: fx(net + netTax),
  };
}

/** Body for POST /accounting/trade-accounting/transactions/create (same fields the existing tabs send). */
export function finalizePayload(t: any, c: CommissionCalc) {
  const p = t?.properties?.[0] || {};
  return {
    tradeSheetId: t?.id,
    closingDate: p.closingDate,
    listingPrice: p.listingPrice,
    salesPrice: p.salesPrice,
    soldPrice: p.soldPrice,
    commissionProperty: c.propertyCommission || 2.5,
    commissionAgent: c.commissionAgent,
    commissionOwner: c.commissionOwner,
    buySaleAdminFees: c.buySaleAdminFees,
    tax: 13.0,
    baseOfficeCommissionSelling: c.baseTotal.toFixed(2),
    baseOfficeCommissionTax: c.baseTax.toFixed(2),
    baseOfficeCommissionTotal: c.baseTotal.toFixed(2),
    agentCommissionSelling: c.agentTotal.toFixed(2),
    agentCommissionTax: c.agentTax.toFixed(2),
    agentCommissionTotal: c.agentTotal.toFixed(2),
    netCommissionSelling: c.netTotal.toFixed(2),
    netCommissionTax: c.netTax.toFixed(2),
    netCommissionTotal: c.netTotal.toFixed(2),
  };
}
