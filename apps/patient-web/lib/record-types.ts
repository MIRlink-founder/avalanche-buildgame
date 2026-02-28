export type TreatmentSheetType =
  | 'implant_placement'
  | 'implant_prosthesis'
  | 'laminate';

export interface ImplantPlacementFormData {
  fixture?: string;
  fixtureItemId?: number;
  initialFixation?: string;
  boneQuality?: 'D1' | 'D2' | 'D3' | 'D4';
  keratinizedGingiva?: '충분' | '부족' | 'FGG 필요' | 'FGG함';
  sinusLift?: '안함' | 'Crestal' | 'Lateral';
  sinusLiftMaterials?: string[];
  boneGraft?: string[];
  surgeryCount?: '1회법' | '2회법';
  healingInput?: boolean;
  prosthesisTiming?: string;
  comment?: string;
}

export interface ImplantProsthesisFormData {
  method?: string;
  methodDirectInput?: string;
  cementationType?: '영구 접착' | '임시 접착';
  abutmentType?: string;
  abutmentSubType?: string;
  abutmentOverdent?: string;
  abutmentPreset?: string;
  abutmentDirectInput?: string;
  torque?: string;
  hexStatus?: 'hex' | 'non_hex';
  sizeNotEntered?: boolean;
  diameter?: number;
  cuff?: number;
  height?: number;
  comment?: string;
}

export interface LaminateFormData {
  manufacturer?: string;
  product?: string;
  shade?: string;
  lot?: string;
  cement?: string;
  comment?: string;
}

export interface TreatmentSheet {
  id: string;
  tooth: number;
  type: TreatmentSheetType;
  formData?:
    | ImplantPlacementFormData
    | ImplantProsthesisFormData
    | LaminateFormData;
}

export interface LatestRecordPayload {
  version: number;
  preInfo?: unknown;
  treatmentSheets: TreatmentSheet[];
}
