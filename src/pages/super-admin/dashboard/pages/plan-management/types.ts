
export interface PlanSubItem {
    name: string;
    value: number;
}

export interface PlanItem {
    id: string;
    name: string;
    value: number;
    isOptional: boolean;
    commissionOwner: number;
    commissionAgent: number;
    itemType: string;
    planSubItems: PlanSubItem[];
}

export interface Plan {
    id: string;
    uuid: string;
    name: string;
    type: string;
    planItems: PlanItem[];
}

export interface OptionalPlan {
    id: string;
    uuid: string;
    name: string;
    slug: string;
    optionalPlanName: string;
    amount: number;
}
