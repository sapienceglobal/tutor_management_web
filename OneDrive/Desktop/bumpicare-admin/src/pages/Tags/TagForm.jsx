import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function TagForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    description: '',
    color: '#06A096',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch tag if editing
  const { data: tagData } = useQuery({
    queryKey: ['tag', id],
    queryFn: async () => {
      const res = await api.get(`/admin/tags/${id}`);
      return res.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (tagData?.data) {
      setFormData({
        name: tagData.data.name || '',
        slug: tagData.data.slug || '',
        category: tagData.data.category || '',
        description: tagData.data.description || '',
        color: tagData.data.color || '#06A096',
      });
    }
  }, [tagData]);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !isEdit) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, isEdit]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        return api.put(`/admin/tags/${id}`, data);
      }
      return api.post('/admin/tags', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tags']);
      alert(`Tag ${isEdit ? 'updated' : 'created'} successfully!`);
      navigate('/tags');
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to save tag');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name) {
      setError('Tag name is required');
      return;
    }

    setLoading(true);
    try {
      await saveMutation.mutateAsync(formData);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Tag' : 'Create New Tags'}
            </h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Publish'
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Basic Information</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <Label className="text-gray-700 mb-2">Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Name"
                  className="h-12 bg-gray-50"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <Label className="text-gray-700 mb-2">Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Slug"
                  className="h-12 bg-gray-50"
                />
              </div>

              {/* Types (Category) */}
              <div>
                <Label className="text-gray-700 mb-2">Types</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="h-12 bg-gray-50">
                    <SelectValue placeholder="Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Blog">Blog</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Option (Color) */}
              <div>
                <Label className="text-gray-700 mb-2">Option (Color)</Label>
                <div className="flex gap-3">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-12 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#06A096"
                    className="h-12 bg-gray-50 flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-gray-700 mb-2">Short Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short Description"
                rows={5}
                className="bg-gray-50 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-8 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}