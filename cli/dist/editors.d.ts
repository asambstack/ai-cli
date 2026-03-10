import { type EditorDef } from "./types.js";
export declare function detectEditors(root: string): string[];
export declare function linkEditor(root: string, editorId: string, contextPath: string): Promise<{
    readonly ok: boolean;
    readonly message: string;
}>;
export declare function unlinkEditor(root: string, editorId: string): Promise<{
    readonly ok: boolean;
    readonly message: string;
}>;
export declare function getEditorDef(id: string): EditorDef | undefined;
