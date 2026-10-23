const indicators = require('./indicators.json');
const severityOrder = ['high', 'medium', 'low'];
// Accept severity strings or finding objects to keep sorting straightforward.
function compareSeverity(a, b) {
  return severityOrder.indexOf(a.severity || a) - severityOrder.indexOf(b.severity || b);
}
function classifyFileName(fileName) {
  const name = fileName.toLowerCase();
  const normalized = name.replace(/[ -]/g, '_');
  const parts = name.split('.');
  const last = parts.length > 1 ? `.${parts.at(-1)}` : '';
  if (indicators.noteKeywords.some((word) => normalized.includes(word)) && indicators.noteExtensions.includes(last)) {
    return { ruleId: 'ransom-note-name', severity: 'high', title: 'Possible ransom note filename', reason: 'This filename contains a possible ransom-note keyword and a note-style extension.' };
  }
  if (indicators.familyExtensions.includes(last)) {
    return { ruleId: 'family-extension', severity: 'high', title: 'Extension used by known ransomware families', reason: `The ${last} extension is a possible indicator associated with a ransomware family.` };
  }
  if (indicators.genericExtensions.includes(last)) {
    return { ruleId: 'generic-extension', severity: 'medium', title: 'Encrypted-style file extension', reason: `The ${last} extension is a possible sign of an encrypted or renamed file.` };
  }
  if (parts.length >= 3 && indicators.documentExtensions.includes(`.${parts.at(-2)}`)
      && !indicators.benignSecondExtensions.includes(last) && last.length >= 3 && last.length <= 10) {
    return { ruleId: 'double-extension', severity: 'low', title: 'Document with an unusual extra extension', reason: 'An unusual extension after a document extension is a possible sign of file renaming.' };
  }
  return null;
}
module.exports = { classifyFileName, severityOrder, compareSeverity };
