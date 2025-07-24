'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { templatesApi } from '@/lib/api';
import { EvaluationTemplateItem } from '@/types/template';

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    position: '',
    skillWeight: 1.0,
    willWeight: 1.0,
    mindWeight: 1.0,
    isPublic: false,
  });
  const [items, setItems] = useState<EvaluationTemplateItem[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.position) {
      alert('テンプレート名と職種は必須です');
      return;
    }

    if (items.length === 0) {
      alert('評価項目を少なくとも1つ追加してください');
      return;
    }

    try {
      setLoading(true);
      await templatesApi.create({
        ...formData,
        items: items.map((item, index) => ({ ...item, order: index })),
      });
      router.push('/templates');
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('テンプレートの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        category: 'skill',
        name: '',
        description: '',
        weight: 1.0,
        required: false,
        order: items.length,
      },
    ]);
  };

  const updateItem = (index: number, updates: Partial<EvaluationTemplateItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">新規テンプレート作成</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">基本情報</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                テンプレート名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="例: フロントエンドエンジニア"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                職種 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="例: Engineer"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">説明</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              rows={3}
              placeholder="このテンプレートの説明を入力"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">スキル重み</label>
              <input
                type="number"
                value={formData.skillWeight}
                onChange={(e) => setFormData({ ...formData, skillWeight: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Will重み</label>
              <input
                type="number"
                value={formData.willWeight}
                onChange={(e) => setFormData({ ...formData, willWeight: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">マインド重み</label>
              <input
                type="number"
                value={formData.mindWeight}
                onChange={(e) => setFormData({ ...formData, mindWeight: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">公開テンプレートにする</span>
            </label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">評価項目</h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              項目を追加
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              評価項目を追加してください
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border p-4 rounded">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">カテゴリ</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(index, { category: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="skill">スキル</option>
                        <option value="will">Will</option>
                        <option value="mind">マインド</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">項目名</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, { name: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="例: React経験"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">重み</label>
                      <input
                        type="number"
                        value={item.weight}
                        onChange={(e) => updateItem(index, { weight: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm font-medium mb-1">説明</label>
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="評価項目の詳細説明"
                    />
                  </div>

                  <div className="mt-2 flex justify-between items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.required}
                        onChange={(e) => updateItem(index, { required: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">必須項目</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/templates')}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '作成中...' : '作成'}
          </button>
        </div>
      </form>
    </div>
  );
}