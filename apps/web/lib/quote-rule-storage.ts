type SavedQuoteRulesResetInput = {
  fileName: unknown;
  defaultVersion: unknown;
  currentVersion: number;
  defaultRuleName: string;
};

export function shouldResetSavedQuoteRules(input: SavedQuoteRulesResetInput): boolean {
  if (input.defaultVersion === input.currentVersion) {
    return false;
  }
  if (typeof input.fileName !== "string" || !input.fileName.trim()) {
    return true;
  }
  const fileName = input.fileName.trim();
  return fileName === input.defaultRuleName || fileName.startsWith(`${input.defaultRuleName}（已编辑`);
}
