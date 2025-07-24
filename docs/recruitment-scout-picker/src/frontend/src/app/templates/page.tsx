'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { templatesApi } from '@/lib/api';
import { EvaluationTemplate } from '@/types/template';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [positionFilter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesApi.getAll(
        positionFilter ? { position: positionFilter } : undefined
      );
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return;
    
    try {
      await templatesApi.delete(id);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('テンプレートの削除に失敗しました');
    }
  };

  const handleDuplicate = async (template: EvaluationTemplate) => {
    const name = prompt('新しいテンプレート名を入力してください', `${template.name} (コピー)`);
    if (!name) return;
    
    try {
      await templatesApi.duplicate(template.id, name);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      alert('テンプレートの複製に失敗しました');
    }
  };

  const positions = Array.from(new Set(templates.map(t => t.position))).sort();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">評価テンプレート管理</h1>
        <button
          onClick={() => router.push('/templates/new')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          新規テンプレート作成
        </button>
      </div>

      <div className="mb-4">
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">すべての職種</option>
          {positions.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          テンプレートがありません
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    職種: {template.position} | 作成者: {template.createdBy.name}
                  </p>
                  {template.description && (
                    <p className="text-gray-700 mb-2">{template.description}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>スキル重み: {template.skillWeight}</span>
                    <span>Will重み: {template.willWeight}</span>
                    <span>マインド重み: {template.mindWeight}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    項目数: {template.items.length}
                    {template.isPublic && (
                      <span className="ml-2 text-green-600">公開</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/templates/${template.id}`)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    詳細
                  </button>
                  <button
                    onClick={() => router.push(`/templates/${template.id}/edit`)}
                    className="text-green-500 hover:text-green-700"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="text-purple-500 hover:text-purple-700"
                  >
                    複製
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}