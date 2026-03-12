export interface AgentFile {
    readonly name: string;
    readonly filename: string;
    readonly description: string;
    readonly content: string;
}
export interface AgentSummary {
    readonly name: string;
    readonly filename: string;
    readonly description: string;
}
export declare const listAgents: () => Promise<readonly AgentSummary[]>;
export declare const getAgent: (name: string) => Promise<AgentFile | null>;
export declare const updateAgent: (name: string, content: string) => Promise<void>;
export declare const listSkills: () => Promise<readonly AgentSummary[]>;
export declare const getSkill: (name: string) => Promise<AgentFile | null>;
export declare const updateSkill: (name: string, content: string) => Promise<void>;
export declare const listRules: () => Promise<readonly AgentSummary[]>;
export declare const getRule: (name: string) => Promise<AgentFile | null>;
export declare const updateRule: (name: string, content: string) => Promise<void>;
