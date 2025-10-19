
export enum LookType {
  HIJAB = 'HIJAB',
  NON_HIJAB = 'NON_HIJAB',
}

export interface StyleChoices {
  lookType: LookType | null;
  style: string;
  clothing: string;
  hijabStyle: string;
  hairStyle: string;
}

export interface SceneAnalysisResult {
  description: string;
  accessories: string[];
}
