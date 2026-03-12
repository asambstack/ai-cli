export type LearningCategory = "architecture" | "conventions" | "gotchas" | "integrations" | "domain";
export declare const LEARNING_CATEGORIES: readonly {
    readonly value: LearningCategory;
    readonly label: string;
}[];
export interface LearningEntry {
    readonly category: LearningCategory;
    readonly text: string;
    readonly date: string;
    readonly index: number;
}
export declare function parseLearnings(content: string): readonly LearningEntry[];
export declare function getLearnings(root: string): Promise<readonly LearningEntry[]>;
export declare function addLearning(root: string, category: LearningCategory, text: string): Promise<void>;
export declare function updateLearning(root: string, targetIndex: number, newText: string): Promise<void>;
export declare function deleteLearning(root: string, targetIndex: number): Promise<void>;
