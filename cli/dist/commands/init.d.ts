interface InitOptions {
    readonly all?: boolean;
    readonly editors?: readonly string[];
}
export declare function init(root: string, options: InitOptions): Promise<void>;
export {};
