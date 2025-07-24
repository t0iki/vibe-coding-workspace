import { Candidate } from '@/types/candidate'
import CandidateCard from './CandidateCard'

interface CandidateListProps {
  candidates: Candidate[]
}

export default function CandidateList({ candidates }: CandidateListProps) {
  if (candidates.length === 0) {
    return (
      <div className="mt-8 text-center py-12">
        <p className="text-gray-500">候補者が見つかりませんでした</p>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {candidates.map((candidate) => (
        <CandidateCard key={candidate.id} candidate={candidate} />
      ))}
    </div>
  )
}