import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          候補者見極めくんへようこそ
        </h2>
        <p className="mt-3 text-xl text-gray-500">
          候補者の情報を管理し、過去の評価データを基にマッチング率を算出します
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/candidates"
            className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            候補者一覧を見る
          </Link>
          <Link
            href="/upload"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            PDFをアップロード <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}