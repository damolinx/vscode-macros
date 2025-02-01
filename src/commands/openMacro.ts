import { selectMacroFile } from "../common/selectMacroFile";
import { showTextDocument } from "../common/vscodeEx";

export async function openMacro() {
  const uri = await selectMacroFile({ hideOpenPerItem: true });
  if (uri) {
    await showTextDocument(uri);
  }
}