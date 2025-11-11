export interface Language {
  code: string;
  name: string;
}

export enum Feature {
  None,
  DescribeScene,
  Person,
  Ask,
  Navigation,
  RememberPerson,
}

export interface RememberedPerson {
  id?: number;
  name: string;
  imageBase64: string;
}
