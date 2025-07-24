'use client';

import { Evaluation } from '@/types/evaluation';

interface EvaluationDisplayProps {
  evaluations: Evaluation[];
}

const scoreColors = {
  0: 'text-red-600 bg-red-50',
  1: 'text-yellow-600 bg-yellow-50',
  2: 'text-green-600 bg-green-50'
};

const scoreLabels = {
  0: 'パス',
  1: '迷う',
  2: 'よい'
};

export default function EvaluationDisplay({ evaluations }: EvaluationDisplayProps) {
  if (evaluations.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        まだ評価がありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {evaluations.map((evaluation) => (
        <div key={evaluation.id} className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {evaluation.evaluator?.name || '匿名'} による評価
            </h4>
            <time className="text-sm text-gray-500">
              {new Date(evaluation.createdAt).toLocaleDateString('ja-JP')}
            </time>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">スキル</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${scoreColors[evaluation.skillScore]}`}>
                {scoreLabels[evaluation.skillScore]}
              </span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">Will</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${scoreColors[evaluation.willScore]}`}>
                {scoreLabels[evaluation.willScore]}
              </span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">マインド</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${scoreColors[evaluation.mindScore]}`}>
                {scoreLabels[evaluation.mindScore]}
              </span>
            </div>
          </div>
          
          {evaluation.comment && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">{evaluation.comment}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}