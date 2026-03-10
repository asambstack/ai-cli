interface LearnOptions {
    readonly category?: string;
}
export declare function learn(root: string, text: string, options: LearnOptions): Promise<void>;
export {};
