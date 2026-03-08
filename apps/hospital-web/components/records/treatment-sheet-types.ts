// 진료 시트 타입
export type TreatmentSheetType =
  | 'implant_placement'
  | 'implant_prosthesis'
  | 'implant_remove'
  | 'laminate';

// 치식도에서 치아 하나의 표시 상태
export type ToothState =
  | 'empty' // 비어 있음
  | 'selected' // 선택됨
  | 'has_value' // 저장된 데이터 있음
  | 'implant_removed'; // 임플란트 제거됨

// 임플란트 식립 진료 시트 폼 데이터
export interface ImplantPlacementFormData {
  fixture?: string;
  /** DB ImplantItem id (Fixture 선택 시 저장, 목록/뷰 표시는 fixture 문자열 사용) */
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

// 임플란트 보철 진료 시트 폼 데이터
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

// 임플란트 제거 시트 폼 데이터
export interface ImplantRemoveFormData {
  method?: string;
  comment?: string;
}

// 라미네이트 진료 시트 폼 데이터
export interface LaminateFormData {
  manufacturer?: string;
  product?: string;
  shade?: string;
  lot?: string;
  cement?: string;
  comment?: string;
}

// 편집 중인 진료 시트
export interface TreatmentSheet {
  id: string;
  tooth: number;
  type: TreatmentSheetType;
  date?: string;
  formData?:
    | ImplantPlacementFormData
    | ImplantProsthesisFormData
    | LaminateFormData;
}

// 임시 저장된 진료 기록 한 행 (왼쪽 목록용, 클릭 시 오른쪽 탭에서 수정)
export interface SavedTreatmentRecord {
  id: string;
  date: Date;
  tooth: number;
  type: TreatmentSheetType;
  formData?:
    | ImplantPlacementFormData
    | ImplantProsthesisFormData
    | ImplantRemoveFormData
    | LaminateFormData;
}
