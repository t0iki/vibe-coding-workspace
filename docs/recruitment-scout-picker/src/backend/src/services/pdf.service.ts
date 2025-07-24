import PDFParser from 'pdf2json';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

interface ParsedCandidate {
  name: string;
  skills: string[];
  currentRole?: string;
  yearsOfExp?: number;
  will?: string;
  source: 'youtrust' | 'draft';
  rawText: string;
}

export class PDFParseService {
  private parser: PDFParser;

  constructor() {
    this.parser = new PDFParser(null, 1);
  }

  async parsePDF(filePath: string): Promise<ParsedCandidate> {
    return new Promise((resolve, reject) => {
      this.parser.on('pdfParser_dataError', reject);
      this.parser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          const text = this.extractText(pdfData);
          const candidate = this.extractCandidateInfo(text, filePath);
          resolve(candidate);
        } catch (error) {
          reject(error);
        }
      });

      this.parser.loadPDF(filePath);
    });
  }

  private extractText(pdfData: any): string {
    let text = '';
    if (pdfData.Pages) {
      pdfData.Pages.forEach((page: any) => {
        if (page.Texts) {
          page.Texts.forEach((textItem: any) => {
            if (textItem.R) {
              textItem.R.forEach((r: any) => {
                if (r.T) {
                  text += decodeURIComponent(r.T) + ' ';
                }
              });
            }
          });
          text += '\n';
        }
      });
    }
    return text;
  }

  private extractCandidateInfo(text: string, filePath: string): ParsedCandidate {
    const filename = path.basename(filePath).toLowerCase();
    const source = filename.includes('youtrust') ? 'youtrust' : 'draft';

    // 基本的な情報抽出（実装は簡略化）
    const candidate: ParsedCandidate = {
      name: this.extractName(text),
      skills: this.extractSkills(text),
      source,
      rawText: text
    };

    // 現在の役職
    const roleMatch = text.match(/現在の役職[:：]\s*([^\n]+)/i);
    if (roleMatch) {
      candidate.currentRole = roleMatch[1].trim();
    }

    // 経験年数
    const expMatch = text.match(/経験年数[:：]\s*(\d+)/i);
    if (expMatch) {
      candidate.yearsOfExp = parseInt(expMatch[1], 10);
    }

    // Will（やりたいこと）
    const willMatch = text.match(/やりたいこと[:：]\s*([^\n]+)/i);
    if (willMatch) {
      candidate.will = willMatch[1].trim();
    }

    return candidate;
  }

  private extractName(text: string): string {
    // 名前の抽出ロジック（簡略化）
    const nameMatch = text.match(/氏名[:：]\s*([^\n]+)/i) || 
                      text.match(/名前[:：]\s*([^\n]+)/i) ||
                      text.match(/^([^\n]{2,10})\s/);
    
    return nameMatch ? nameMatch[1].trim() : '不明';
  }

  private extractSkills(text: string): string[] {
    const skills: string[] = [];
    
    // プログラミング言語
    const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Ruby', 'PHP', 'C#', 'Swift', 'Kotlin'];
    languages.forEach(lang => {
      if (text.includes(lang)) {
        skills.push(lang);
      }
    });

    // フレームワーク・ライブラリ
    const frameworks = ['React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express', 'Django', 'Rails', 'Spring'];
    frameworks.forEach(fw => {
      if (text.includes(fw)) {
        skills.push(fw);
      }
    });

    // データベース
    const databases = ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch'];
    databases.forEach(db => {
      if (text.includes(db)) {
        skills.push(db);
      }
    });

    // クラウド
    const clouds = ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes'];
    clouds.forEach(cloud => {
      if (text.includes(cloud)) {
        skills.push(cloud);
      }
    });

    return [...new Set(skills)]; // 重複を除去
  }

  async saveUploadedFile(file: any, uploadDir: string): Promise<string> {
    const filename = `${Date.now()}-${file.filename}`;
    const filepath = path.join(uploadDir, filename);
    
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filepath, await file.toBuffer());
    
    return filepath;
  }
}