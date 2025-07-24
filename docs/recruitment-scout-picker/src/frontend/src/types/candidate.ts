export interface Candidate {
  id: string
  name: string
  age: number
  currentPosition: string
  experience: number // 経験年数
  skills: string[]
  source: 'youtrust' | 'draft' | 'other'
  importedAt: Date
  profileUrl?: string
  evaluation?: {
    skill: 0 | 1 | 2
    will: 0 | 1 | 2
    mindset: 0 | 1 | 2
    evaluatedBy: string
    evaluatedAt: Date
  }
  matchScore?: number // 0-100
}