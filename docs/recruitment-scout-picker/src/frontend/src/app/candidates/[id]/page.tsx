'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { candidatesApi, evaluationsApi, matchingApi } from '@/lib/api';
import { CreateEvaluation } from '@/types/evaluation';
import EvaluationForm from '../../../components/EvaluationForm';
import EvaluationDisplay from '../../../components/EvaluationDisplay';

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const candidateId = params.id as string;
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);

  // 候補者データを取得
  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => candidatesApi.getById(candidateId),
    enabled: !!candidateId,
  });

  // 評価データを取得
  const { data: evaluations = [], isLoading: evaluationsLoading } = useQuery({
    queryKey: ['evaluations', candidateId],
    queryFn: () => evaluationsApi.getByCandidate(candidateId),
    enabled: !!candidateId,
  });

  // マッチ率を取得/計算
  const { data: matchData, mutate: calculateMatch } = useMutation({
    mutationFn: () => matchingApi.calculateMatch(candidateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] });
    },
  });

  // 評価を作成
  const createEvaluationMutation = useMutation({
    mutationFn: (evaluation: CreateEvaluation) => evaluationsApi.create(evaluation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', candidateId] });
      setShowEvaluationForm(false);
    },
  });

  // 候補者を削除
  const deleteCandidateMutation = useMutation({
    mutationFn: () => candidatesApi.delete(candidateId),
    onSuccess: () => {
      router.push('/candidates');
    },
  });

  const handleEvaluationSubmit = (evaluation: CreateEvaluation) => {
    createEvaluationMutation.mutate(evaluation);
  };

  const handleDelete = () => {
    if (confirm('この候補者を削除してもよろしいですか？')) {
      deleteCandidateMutation.mutate();
    }
  };

  if (candidateLoading || evaluationsLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-gray-500">候補者が見つかりません。</p>
          <Link
            href="/candidates"
            className="mt-4 inline-block text-primary-600 hover:text-primary-500"
          >
            候補者一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const displayMatchScore = matchData?.matchScore || candidate.matchScore;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/candidates"
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          ← 候補者一覧に戻る
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {candidate.currentRole} • {candidate.yearsOfExp}年の経験
            </p>
          </div>
          <div className="flex items-start space-x-4">
            {displayMatchScore !== undefined && displayMatchScore !== null ? (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {displayMatchScore}%
                </div>
                <div className="text-sm text-gray-500">マッチ率</div>
              </div>
            ) : (
              <button
                onClick={() => calculateMatch()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                マッチ率を計算
              </button>
            )}
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-600 rounded-md hover:bg-red-50"
            >
              削除
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">基本情報</h3>
            <dl className="space-y-2">
              {candidate.age && (
                <div>
                  <dt className="text-sm text-gray-500">年齢</dt>
                  <dd className="text-sm font-medium text-gray-900">{candidate.age}歳</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">取得元</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {candidate.source === 'youtrust' ? 'Youtrust' : '転職ドラフト'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">登録日</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(candidate.createdAt).toLocaleDateString('ja-JP')}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">スキル</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {candidate.will && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">やりたいこと</h3>
            <p className="text-sm text-gray-900">{candidate.will}</p>
          </div>
        )}

        {matchData && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">マッチ率の内訳</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">類似度:</span>
                <span className="ml-2 font-medium">{Math.round(matchData.breakdown.similarity * 100)}%</span>
              </div>
              <div>
                <span className="text-gray-500">評価スコア:</span>
                <span className="ml-2 font-medium">{Math.round(matchData.breakdown.evaluationScore * 100)}%</span>
              </div>
              <div>
                <span className="text-gray-500">スキルマッチ:</span>
                <span className="ml-2 font-medium">{Math.round(matchData.breakdown.skillMatch * 100)}%</span>
              </div>
            </div>
            {matchData.reasoning && matchData.reasoning.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-gray-700 mb-1">判定理由</h4>
                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                  {matchData.reasoning.map((reason: string, index: number) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">評価履歴</h2>
          {!showEvaluationForm && (
            <button
              onClick={() => setShowEvaluationForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              評価を追加
            </button>
          )}
        </div>

        {showEvaluationForm ? (
          <EvaluationForm
            candidateId={candidateId}
            onSubmit={handleEvaluationSubmit}
            onCancel={() => setShowEvaluationForm(false)}
          />
        ) : (
          <EvaluationDisplay evaluations={evaluations} />
        )}
      </div>
    </div>
  );
}