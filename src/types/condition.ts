export interface Condition {
  id: string;
  conditionType: string;
  dueDate: string;
  conditionMetDate?: string;
  completeStatus: string;
  tradeSheetId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConditionResponse {
  status: boolean;
  data: {
    ConditionData: Condition[];
  };
  message: string;
}

export interface CreateUpdateConditionRequest {
  id?: string;
  conditionType: string;
  dueDate: string;
  conditionMetDate?: string;
  completeStatus?: string;
  tradeSheetId: number;
}