export type InternshipType = 'INSTITUTION' | 'PROFESSIONAL';
export type InternshipStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
export type ReplacementStatus = 'COVERED' | 'NEEDS_REPLACEMENT' | 'URGENT_EMPTY';
export type NotificationType = 'ENDING_SOON' | 'TEAM_EMPTY' | 'COMPLETION_INCOMPLETE' | 'ACCEPTANCE_LETTER_PENDING' | 'PLAN_STARTING_SOON';
export interface MonthlyCostInput {
    type: InternshipType;
    baseSalary: number;
    mealAllowancePerDay: number;
    workingDays: number;
    attendanceDays: number;
}
export interface ReplacementInput {
    activeInstitutionCount: number;
    soonestEndDate: Date | string | null;
    replacementCandidate: string | null;
    minimumInstitutionNeed: number;
    today?: Date;
}
export interface NotificationIntern {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: InternshipStatus;
    type: InternshipType;
    division: string;
    team: string;
    acceptanceLetterSent: boolean;
    completionComplete: boolean;
}
export interface NotificationTeamRequirement {
    id: string;
    division: string;
    team: string;
    activeInstitutionCount: number;
    activeProfessionalCount: number;
    minimumInstitutionNeed: number;
    soonestEndDate: string | Date | null;
    replacementCandidate: string | null;
}
export interface NotificationItem {
    type: NotificationType;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'danger';
    sourceId: string;
}
export declare const addDays: (date: Date, days: number) => Date;
export declare const calculateStatus: (startDate: string, endDate: string, today?: Date, manuallyTerminated?: boolean) => InternshipStatus;
export declare const formatDuration: (startDate: string, endDate: string) => string;
export declare const excelSerialToDate: (serial: number) => string;
export declare const calculateMonthlyCost: (input: MonthlyCostInput) => {
    totalMealAllowance: number;
    totalMonthlyCost: number;
};
export declare const evaluateReplacementStatus: (input: ReplacementInput) => ReplacementStatus;
export declare const detectNotifications: (input: {
    today?: Date;
    interns: NotificationIntern[];
    teamRequirements: NotificationTeamRequirement[];
}) => NotificationItem[];
