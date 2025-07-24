import { Candidate } from '@/types/candidate'

interface CandidateCardProps {
  candidate: Candidate
}

const evaluationLabels = {
  0: 'パス',
  1: '迷う',
  2: 'よい',
}

const evaluationColors = {
  0: 'bg-red-100 text-red-800',
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-green-100 text-green-800',
}

export default function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
          <p className="text-sm text-gray-600">
            {candidate.age}歳 / {candidate.currentPosition}
          </p>
        </div>
        {candidate.matchScore && (
          <div className="text-right">
            <p className="text-sm text-gray-500">マッチ率</p>
            <p className="text-2xl font-bold text-primary-600">{candidate.matchScore}%</p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">スキル</p>
        <div className="flex flex-wrap gap-1">
          {candidate.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500">
          経験年数: {candidate.experience}年 / {candidate.source}
        </p>
      </div>

      {candidate.evaluation ? (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">評価</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500">スキル</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${evaluationColors[candidate.evaluation.skill]}`}>
                {evaluationLabels[candidate.evaluation.skill]}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Will</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${evaluationColors[candidate.evaluation.will]}`}>
                {evaluationLabels[candidate.evaluation.will]}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">マインド</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${evaluationColors[candidate.evaluation.mindset]}`}>
                {evaluationLabels[candidate.evaluation.mindset]}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            評価者: {candidate.evaluation.evaluatedBy}
          </p>
        </div>
      ) : (
        <div className="border-t pt-4">
          <button className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            評価する
          </button>
        </div>
      )}
    </div>
  )
}