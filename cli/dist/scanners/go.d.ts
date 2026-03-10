interface GoScanResult {
    readonly languages: string[];
    readonly frameworks: string[];
    readonly testRunners: string[];
    readonly buildTools: string[];
    readonly entryPoints: string[];
    readonly scripts: Record<string, string>;
    readonly keyDependencies: string[];
    readonly devDependencies: string[];
}
export declare function scanGo(root: string): Promise<GoScanResult | null>;
export {};
