'use client';

import { useState } from 'react';
import { CreateEvaluation } from '@/types/evaluation';

interface EvaluationFormProps {
  candidateId: string;
  onSubmit: (evaluation: CreateEvaluation) => void;
  onCancel: () => void;
}

const scoreLabels = {
  0: 'パス',
  1: '迷う',
  2: 'よい'
};

export default function EvaluationForm({ candidateId, onSubmit, onCancel }: EvaluationFormProps) {
  const [evaluation, setEvaluation] = useState<CreateEvaluation>({
    candidateId,
    skillScore: 1,
    willScore: 1,
    mindScore: 1,
    comment: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(evaluation);
  };

  const ScoreSelector = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: 0 | 1 | 2; 
    onChange: (value: 0 | 1 | 2) => void;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {([0, 1, 2] as const).map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              value === score
                ? score === 0
                  ? 'bg-red-500 text-white'
                  : score === 1
                  ? 'bg-yellow-500 text-white'
                  : 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {scoreLabels[score]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">評価を入力</h3>
        
        <div className="space-y-6">
          <ScoreSelector
            label="スキル評価"
            value={evaluation.skillScore}
            onChange={(value) => setEvaluation({ ...evaluation, skillScore: value })}
          />
          
          <ScoreSelector
            label="Will評価"
            value={evaluation.willScore}
            onChange={(value) => setEvaluation({ ...evaluation, willScore: value })}
          />
          
          <ScoreSelector
            label="マインド評価"
            value={evaluation.mindScore}
            onChange={(value) => setEvaluation({ ...evaluation, mindScore: value })}
          />
          
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              コメント（任意）
            </label>
            <textarea
              id="comment"
              rows={4}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={evaluation.comment}
              onChange={(e) => setEvaluation({ ...evaluation, comment: e.target.value })}
              placeholder="候補者についてのコメントを入力してください..."
            />
          </div>
        </div>
        
        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
          >
            評価を保存
          </button>
        </div>
      </div>
    </form>
  );
}