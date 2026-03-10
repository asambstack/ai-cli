import { access, symlink, readlink, unlink, mkdir, lstat } from "node:fs/promises";
import { accessSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { EDITORS, type EditorDef } from "./types.js";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function isSymlink(path: string): Promise<boolean> {
  try {
    const s = await lstat(path);
    return s.isSymbolicLink();
  } catch {
    return false;
  }
}

export function detectEditors(root: string): string[] {
  const detected: string[] = [];

  // Check global tool installations
  const homeDir = process.env.HOME ?? "";

  for (const editor of EDITORS) {
    // Check repo-level indicators
    for (const detectPath of editor.detectPaths) {
      const fullPath = join(root, detectPath);
      // Synchronous check for simplicity in detection
      try {
        accessSync(fullPath);
        if (!detected.includes(editor.id)) {
          detected.push(editor.id);
        }
        break;
      } catch {
        // Not found, continue
      }
    }

    // Check global indicators
    if (!detected.includes(editor.id)) {
      const globalPaths: Record<string, string[]> = {
        claude: [join(homeDir, ".claude")],
        opencode: [join(homeDir, ".config", "opencode")],
        cursor: [join(homeDir, ".cursor")],
      };

      const paths = globalPaths[editor.id];
      if (paths) {
        for (const p of paths) {
          try {
            accessSync(p);
            detected.push(editor.id);
            break;
          } catch {
            // Not found
          }
        }
      }
    }
  }

  return detected;
}

export async function linkEditor(
  root: string,
  editorId: string,
  contextPath: string
): Promise<{ readonly ok: boolean; readonly message: string }> {
  const editor = EDITORS.find((e) => e.id === editorId);
  if (!editor) {
    return { ok: false, message: `Unknown editor: ${editorId}` };
  }

  const targetPath = join(root, editor.path);
  const targetDir = dirname(targetPath);

  // Ensure target directory exists
  await mkdir(targetDir, { recursive: true });

  // Compute relative symlink path
  const relativeContext = relative(targetDir, contextPath);

  // If symlink already points to correct target, skip
  if (await isSymlink(targetPath)) {
    const current = await readlink(targetPath);
    if (current === relativeContext) {
      return { ok: true, message: `Already linked: ${editor.path}` };
    }
    await unlink(targetPath);
  } else if (await fileExists(targetPath)) {
    // Back up existing file
    const backup = targetPath + ".backup";
    const { rename } = await import("node:fs/promises");
    await rename(targetPath, backup);
  }

  await symlink(relativeContext, targetPath);
  return { ok: true, message: `Linked: ${editor.path} -> .ai/context.md` };
}

export async function unlinkEditor(
  root: string,
  editorId: string
): Promise<{ readonly ok: boolean; readonly message: string }> {
  const editor = EDITORS.find((e) => e.id === editorId);
  if (!editor) {
    return { ok: false, message: `Unknown editor: ${editorId}` };
  }

  const targetPath = join(root, editor.path);

  if (await isSymlink(targetPath)) {
    await unlink(targetPath);
    return { ok: true, message: `Removed: ${editor.path}` };
  }

  return { ok: true, message: `Not a symlink, skipped: ${editor.path}` };
}

export function getEditorDef(id: string): EditorDef | undefined {
  return EDITORS.find((e) => e.id === id);
}
