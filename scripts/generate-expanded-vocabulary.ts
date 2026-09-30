// Run with Node 24: node --import tsx scripts/generate-expanded-vocabulary.ts
// Source archives and licenses are documented in docs/vocabulary-sources.md.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { starterVocabulary } from "../src/data/content";
import { shuffleDeterministic } from "../src/utils/random";

const db = new DatabaseSync("work/wnjpn.db", { readOnly: true });
const jm = JSON.parse(readFileSync(`work/jmdict-common/${readdirSync("work/jmdict-common").find(f => f.endsWith(".json"))}`, "utf8"));
const rows = db.prepare(`SELECT w.lemma, w.pos, s.synset, d.def FROM word w
  JOIN sense s ON s.wordid=w.wordid JOIN synset_def d ON d.synset=s.synset
  WHERE w.lang='jpn' AND s.src='hand' AND d.lang='jpn' ORDER BY s.synset, d.sid`).all() as {lemma:string;pos:string;synset:string;def:string}[];
const meanings = new Map<string, typeof rows>();
for (const row of rows) meanings.set(row.lemma, [...(meanings.get(row.lemma) ?? []), row]);
const english = new Map<string, Set<string>>();
const normalize = (text:string) => text.toLowerCase().replace(/\([^)]*\)/g, "").replace(/_/g," ").trim();
for (const row of db.prepare("SELECT s.synset,w.lemma FROM sense s JOIN word w ON s.wordid=w.wordid WHERE w.lang='eng'").all() as {synset:string;lemma:string}[]) {
  if (!english.has(row.synset)) english.set(row.synset,new Set());
  english.get(row.synset)!.add(normalize(row.lemma));
}
const seen = new Set(starterVocabulary.map(v=>v.word));
const candidates: any[] = [];
for (const entry of jm.words) {
  const forms = entry.kanji.length ? entry.kanji : entry.kana;
  const form = forms.find((f:any)=>f.common && f.tags.length===0);
  if (!form || seen.has(form.text) || !/^[\p{Script=Han}ぁ-ゖァ-ヶー々]+$/u.test(form.text)) continue;
  const readings = entry.kana.filter((k:any)=>!k.tags.some((t:string)=>['ok','rk','ik'].includes(t)) && (!entry.kanji.length || k.appliesToKanji.includes('*') || k.appliesToKanji.includes(form.text)));
  const reading = readings.find((k:any)=>k.common) ?? readings[0];
  if (!reading || !/^[ぁ-ゖァ-ヶー]+$/.test(reading.text)) continue;
  const senses = entry.sense.filter((s:any)=>(s.appliesToKanji.includes('*') || s.appliesToKanji.includes(form.text)) && (s.appliesToKana.includes('*') || s.appliesToKana.includes(reading.text)) && !s.misc.some((t:string)=>['arch','obs','rare','vulg','derog'].includes(t)));
  const matches: any[] = [];
  for (let i=0;i<senses.length;i++) {
    const glosses = senses[i].gloss.map((g:any)=>normalize(g.text));
    for (const meaning of meanings.get(form.text) ?? []) {
      if (/[A-Za-z0-9]/.test(meaning.def) || meaning.def.length < 5 || meaning.def.length > 150) continue;
      if (glosses.some((g:string)=>english.get(meaning.synset)?.has(g))) matches.push({...meaning,sense:i});
    }
  }
  matches.sort((a,b)=>a.sense-b.sense || a.def.length-b.def.length);
  if (!matches.length) continue;
  const m = matches[0];
  candidates.push({ id:`v-jm-${entry.id}`, word:form.text, reading:reading.text, definition:m.def, pos:({n:'名詞',v:'動詞',a:'形容詞',r:'副詞'} as Record<string,string>)[m.pos], synset:m.synset, readings: [...new Set(readings.map((r:any)=>r.text))], sense:m.sense });
  seen.add(form.text);
}
console.log('Matched candidates:', candidates.length);
// Spread selection across the dictionary, rather than truncating alphabetical order.
const rank = (id:string) => createHash('sha256').update(id).digest('hex');
candidates.sort((a,b)=>a.sense-b.sense || rank(a.id).localeCompare(rank(b.id)));
const needed = 6000-starterVocabulary.length;
if(candidates.length<needed) throw new Error(`Need ${needed} candidates, only found ${candidates.length}`);
const selected = candidates.slice(0,needed).map(({sense,...entry})=>entry);
const allReadings = new Map<string, Set<string>>();
for (const entry of jm.words) for (const form of entry.kanji) {
  if (!allReadings.has(form.text)) allReadings.set(form.text,new Set());
  for (const kana of entry.kana) if (kana.appliesToKanji.includes('*') || kana.appliesToKanji.includes(form.text)) allReadings.get(form.text)!.add(kana.text);
}
for(const entry of selected) entry.readings=[...new Set([...entry.readings,...(allReadings.get(entry.word) ?? [])])];
const kana = (reading:string) => reading.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const pool = [...new Set(selected.map(entry=>kana(entry.reading)))];
for(const entry of selected) {
  const correct = kana(entry.reading);
  const valid = new Set(entry.readings.map(kana));
  const candidates = shuffleDeterministic(pool.filter(value=>!valid.has(value) && Math.abs(value.length-correct.length)<=1),entry.id)
    .map(value=>({value,score:[...value].reduce((sum,c,i)=>sum+Number(c===correct[i]),0)-Math.abs(value.length-correct.length)}))
    .sort((a,b)=>b.score-a.score);
  entry.choices=shuffleDeterministic([correct,...candidates.slice(0,3).map(c=>c.value)],`${entry.id}-choices`);
  if (!/\p{Script=Han}/u.test(entry.word)) {
    const validSenses = new Set((meanings.get(entry.word) ?? []).map(m=>m.synset));
    const seenDefinitions = new Set([entry.definition]);
    const distractors = shuffleDeterministic(selected.filter(other=>other.pos===entry.pos && !validSenses.has(other.synset)),entry.id)
      .sort((a,b)=>Math.abs(a.definition.length-entry.definition.length)-Math.abs(b.definition.length-entry.definition.length))
      .filter(other=>{ if(seenDefinitions.has(other.definition)) return false; seenDefinitions.add(other.definition); return true; }).slice(0,3);
    entry.meaningChoices=shuffleDeterministic([entry.definition,...distractors.map(other=>other.definition)],`${entry.id}-meanings`);
  }
}
writeFileSync('src/data/expandedVocabulary.json', JSON.stringify(selected));
console.log(`Generated ${selected.length} additional entries; ${starterVocabulary.length+selected.length} total.`);
