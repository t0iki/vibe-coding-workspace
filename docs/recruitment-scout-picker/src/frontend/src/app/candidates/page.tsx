'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { candidatesApi, matchingApi } from '@/lib/api'
import CandidateList from '../../components/CandidateList'
import CandidateFilters from '../../components/CandidateFilters'

export default function CandidatesPage() {
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterEvaluated, setFilterEvaluated] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [page, setPage] = useState(1)

  // 候補者データを取得
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['candidates', page, filterSource, search],
    queryFn: () => candidatesApi.getAll({
      page,
      limit: 20,
      source: filterSource !== 'all' ? filterSource : undefined,
      search: search || undefined,
    }),
  })

  // マッチ率を一括計算
  const calculateAllMatchScores = async () => {
    if (data?.candidates) {
      const candidateIds = data.candidates.map((c: any) => c.id)
      await matchingApi.calculateBatch(candidateIds)
      refetch()
    }
  }

  const filteredCandidates = data?.candidates?.filter((candidate: any) => {
    if (filterEvaluated === 'evaluated' && (!candidate.evaluations || candidate.evaluations.length === 0)) {
      return false
    }
    if (filterEvaluated === 'not-evaluated' && candidate.evaluations && candidate.evaluations.length > 0) {
      return false
    }
    return true
  }) || []

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-red-600">エラーが発生しました。</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            候補者一覧
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            登録されている候補者の一覧です。評価やマッチング率を確認できます。
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={calculateAllMatchScores}
            className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            マッチ率を一括計算
          </button>
        </div>
      </div>

      <div className="mt-6">
        <input
          type="text"
          placeholder="名前、役職、スキルで検索..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      <CandidateFilters
        filterSource={filterSource}
        setFilterSource={setFilterSource}
        filterEvaluated={filterEvaluated}
        setFilterEvaluated={setFilterEvaluated}
      />

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
        </div>
      ) : (
        <>
          <CandidateList candidates={filteredCandidates} />
          
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  前へ
                </button>
                <button
                  onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{data.pagination.total}</span> 件中{' '}
                    <span className="font-medium">{(page - 1) * 20 + 1}</span> から{' '}
                    <span className="font-medium">{Math.min(page * 20, data.pagination.total)}</span> 件を表示
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      前へ
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {page} / {data.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                      disabled={page === data.pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      次へ
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}