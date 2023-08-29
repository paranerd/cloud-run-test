export interface Event {
  readonly clientId: string;
  readonly eventName: string;
}

export type VisitorEventCounts = Record<string, number>;

export interface Visitor {
  clientId: string;
  group: string;
  lastModified: number;
  restored?: boolean;
  coupon?: boolean;
  eventCounts: VisitorEventCounts;
}

export interface Coupon {
  value: number;
  code: string;
}

export type VisitorSplit = [never: number, dynamic: number, always: number];

export type ReductionMatrixRow = Record<number, number>;
export type ReductionMatrix = Record<string, ReductionMatrixRow>;

export interface Config {
  serviceUrl: string;
  token: string;
  supportedEvents: string[];
  visitorSplit: VisitorSplit;
  reductionMatrix: ReductionMatrix;
  archiveAge: number;
}
