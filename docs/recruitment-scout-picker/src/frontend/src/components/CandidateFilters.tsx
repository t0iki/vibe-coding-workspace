interface CandidateFiltersProps {
  filterSource: string
  setFilterSource: (value: string) => void
  filterEvaluated: string
  setFilterEvaluated: (value: string) => void
}

export default function CandidateFilters({
  filterSource,
  setFilterSource,
  filterEvaluated,
  setFilterEvaluated,
}: CandidateFiltersProps) {
  return (
    <div className="mt-6 flex flex-wrap gap-4">
      <div>
        <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700">
          取得元
        </label>
        <select
          id="source-filter"
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
        >
          <option value="all">すべて</option>
          <option value="youtrust">yOUTRUST</option>
          <option value="draft">転職ドラフト</option>
          <option value="other">その他</option>
        </select>
      </div>

      <div>
        <label htmlFor="evaluated-filter" className="block text-sm font-medium text-gray-700">
          評価状態
        </label>
        <select
          id="evaluated-filter"
          value={filterEvaluated}
          onChange={(e) => setFilterEvaluated(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
        >
          <option value="all">すべて</option>
          <option value="evaluated">評価済み</option>
          <option value="not-evaluated">未評価</option>
        </select>
      </div>
    </div>
  )
}