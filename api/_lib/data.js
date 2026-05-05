import { readFileSync } from 'fs';
import { join } from 'path';

let _questionsData = null;

/**
 * Load and cache questions data.
 * Uses process.cwd() which points to the project root in Vercel.
 */
export function getQuestionsData() {
  if (!_questionsData) {
    const filePath = join(process.cwd(), 'api', '_data', 'questions.json');
    _questionsData = JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  return _questionsData;
}
