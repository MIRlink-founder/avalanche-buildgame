import type {
  TreatmentSheetType,
  ImplantPlacementFormData,
  ImplantProsthesisFormData,
  ImplantRemoveFormData,
  LaminateFormData,
} from './treatment-sheet-types';

export function getDefaultFormDataForSheet(
  type: TreatmentSheetType,
):
  | ImplantPlacementFormData
  | ImplantProsthesisFormData
  | ImplantRemoveFormData
  | LaminateFormData
  | undefined {
  switch (type) {
    case 'implant_placement':
      return {
        initialFixation: '30N',
        boneQuality: 'D2',
        keratinizedGingiva: '충분',
        sinusLift: '안함',
        surgeryCount: '1회법',
        prosthesisTiming: '3개월 후',
      } satisfies ImplantPlacementFormData;
    case 'implant_prosthesis':
      return {
        method: 'Cement type',
        cementationType: '영구 접착',
        abutmentType: 'Transfer(SCRP)',
        abutmentSubType: '기성 Abut',
        torque: '30N',
        hexStatus: 'hex',
        sizeNotEntered: true,
      } satisfies ImplantProsthesisFormData;
    case 'implant_remove':
      return { method: '단순' } satisfies ImplantRemoveFormData;
    case 'laminate':
      return {} satisfies LaminateFormData;
    default:
      return undefined;
  }
}
