'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { uploadApi } from '@/lib/api'

export default function UploadPage() {
  const router = useRouter()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState<any[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const pdfFiles = files.filter(file => file.type === 'application/pdf')
    setSelectedFiles(prev => [...prev, ...pdfFiles])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 単一ファイルアップロード
  const uploadSingleMutation = useMutation({
    mutationFn: (file: File) => uploadApi.uploadPDF(file, setUploadProgress),
    onSuccess: (data) => {
      setUploadResults([data])
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'アップロードに失敗しました')
    },
  })

  // 複数ファイルアップロード
  const uploadBulkMutation = useMutation({
    mutationFn: (files: File[]) => uploadApi.uploadBulk(files, setUploadProgress),
    onSuccess: (data) => {
      setUploadResults(data.candidates || [])
      if (data.errors && data.errors.length > 0) {
        alert(`一部のファイルでエラーが発生しました:\n${data.errors.join('\n')}`)
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'アップロードに失敗しました')
    },
  })

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploadProgress(0)
    setUploadResults([])

    if (selectedFiles.length === 1) {
      uploadSingleMutation.mutate(selectedFiles[0])
    } else {
      uploadBulkMutation.mutate(selectedFiles)
    }
  }

  const isUploading = uploadSingleMutation.isPending || uploadBulkMutation.isPending

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          候補者PDFアップロード
        </h1>

        <div className="space-y-6">

          {/* ファイルアップロードエリア */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDFファイル
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>ファイルを選択</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".pdf"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="pl-1">またはドラッグ&ドロップ</p>
                </div>
                <p className="text-xs text-gray-500">PDF形式のみ対応</p>
              </div>
            </div>
          </div>

          {/* 選択されたファイル一覧 */}
          {selectedFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                選択されたファイル ({selectedFiles.length}件)
              </h3>
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2 flex-1 w-0 truncate">
                        {file.name}
                      </span>
                      <span className="ml-2 text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => removeFile(index)}
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        削除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* アップロード進捗 */}
          {isUploading && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-600 text-center">
                アップロード中... {uploadProgress}%
              </p>
            </div>
          )}

          {/* アップロード結果 */}
          {uploadResults.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">
                アップロード完了
              </h3>
              <p className="text-sm text-green-700 mb-3">
                {uploadResults.length}件の候補者情報が登録されました
              </p>
              <ul className="space-y-1">
                {uploadResults.map((candidate, index) => (
                  <li key={index} className="text-sm text-green-600">
                    ✓ {candidate.name || candidate.candidate?.name || `候補者${index + 1}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => router.push('/candidates')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              キャンセル
            </button>
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'アップロード中...' : 'アップロード'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}