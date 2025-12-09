import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { productService } from '../../services/productService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatISO } from 'date-fns';

// Helper: slugify
const slugify = (s = '') =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  // form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    category: '',
    productType: '',
    brand: '',
    seller: '',
    tags: [],
    sizeGuide: '',
    isActive: true,
    specifications: [], // {title, value}
    keyInfo: [], // {title, value}
    colors: [], // ["#fff"]
    sizes: [], // ["S", "M"]
    variants: [], // { sku, variantType: "Size", value: "L", price, stock, image, color, visible, status }
    discounts: [], // { title, price, from, to }
    coverPhoto: '',
    videos: [], // urls
    images: [], // saved cloud URLs
    status: 'published',
    isDraft: false,
  });

  // local file buffers
  const [coverFile, setCoverFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]); // additional product photos
  const [videoFiles, setVideoFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]); // combined previews (existing + local)
  const [coverPreview, setCoverPreview] = useState(null);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(false);

  // fetch categories, sellers, product-types, tags
  const { data: categories = [], } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.data;
    },
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const res = await api.get('/admin/seller/get');
      return res.data.sellers;
    },
  });

  const { data: productTypes } = useQuery({
    queryKey: ['productTypes'],
    queryFn: async () => (await api.get('/admin/product-types')).data.data,
  });

  const { data: tagsList } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.get('/admin/tags')).data.data,
  });

  // fetch product for edit
  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (productData?.data) {
      const p = productData.data;
      setForm((prev) => ({
        ...prev,
        name: p.name || '',
        slug: p.slug || '',
        description: p.description || '',
        price: p.price || '',
        discountPrice: p.discountPrice || '',
        stock: p.stock || '',
        category: p.category?._id || p.category || '',
        productType: p.productType || '',
        brand: p.brand || '',
        seller: p.seller?._id || p.seller || '',
        tags: p.tags || [],
        sizeGuide: p.sizeGuide || '',
        isActive: p.isActive ?? true,
        specifications: p.specifications || [],
        keyInfo: p.keyInfo || [],
        colors: p.colors || [],
        sizes: p.sizes || [],
        variants: p.variants || [],
        discounts: p.discounts || [],
        coverPhoto: p.coverPhoto || '',
        videos: p.videos || [],
        images: p.images || [],
        status: p.status || 'published',
        isDraft: p.isDraft || false,
      }));

      // previews from existing URLs
      setImagePreviews(p.images || []);
      setCoverPreview(p.coverPhoto || null);
      setVideoPreviews(p.videos || []);
    }
  }, [productData]);

  // slug auto-generate
  useEffect(() => {
    if (!isEdit) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [form.name, isEdit]);

  // mutation for save
  const saveMutation = useMutation({
    mutationFn: (data) => (isEdit ? productService.update(id, data) : productService.add(data)),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      navigate('/products');
    },
    onError: (err) => {
      setError(err.response?.data?.message || err.message || 'Save failed');
    },
  });

  // helper: read previews
  const fileToDataUrl = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

  // file handlers
  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Cover must be an image');
    if (file.size > 8 * 1024 * 1024) return setError('Cover max 8MB');
    setCoverFile(file);
    setCoverPreview(await fileToDataUrl(file));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (valid.length !== files.length) return setError('Only images allowed for product photos');
    const oversized = valid.filter((f) => f.size > 8 * 1024 * 1024);
    if (oversized.length) return setError('Some images exceed 8MB limit');
    setImageFiles((p) => [...p, ...valid]);
    const urls = await Promise.all(valid.map((f) => fileToDataUrl(f)));
    setImagePreviews((p) => [...p, ...urls]);
  };

  const handleVideoChange = async (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith('video/'));
    if (!valid.length) return setError('Only video files allowed');
    const oversized = valid.filter((f) => f.size > 50 * 1024 * 1024);
    if (oversized.length) return setError('Video max 50MB');
    setVideoFiles((p) => [...p, ...valid]);
    const urls = await Promise.all(valid.map((f) => fileToDataUrl(f)));
    setVideoPreviews((p) => [...p, ...urls]);
  };

  const removeImagePreview = (index) => {
    // if index < existing images length, remove from form.images else from imageFiles
    if (index < form.images.length) {
      setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    } else {
      setImageFiles((prev) => prev.filter((_, i) => i !== index - form.images.length));
    }
    setImagePreviews((p) => p.filter((_, i) => i !== index));
  };

  const removeVideoPreview = (index) => {
    if (index < form.videos.length) {
      setForm((prev) => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }));
    } else {
      setVideoFiles((prev) => prev.filter((_, i) => i !== index - form.videos.length));
    }
    setVideoPreviews((p) => p.filter((_, i) => i !== index));
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setForm((prev) => ({ ...prev, coverPhoto: '' }));
  };

  // Variants management
  const addVariantRow = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: Date.now(),
          sku: `SKU-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
          variantType: '', // 'Size' or 'Color' or custom
          value: '',
          price: prev.price || 0,
          stock: prev.stock || 0,
          image: '',
          color: '',
          visible: true,
          status: 'active',
        },
      ],
    }));
  };

  const updateVariant = (index, changes) => {
    setForm((prev) => {
      const vs = [...prev.variants];
      vs[index] = { ...vs[index], ...changes };
      return { ...prev, variants: vs };
    });
  };

  const removeVariant = (index) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  };

  // Discounts
  const addDiscount = () => {
    setForm((prev) => ({
      ...prev,
      discounts: [
        ...prev.discounts,
        { id: Date.now(), title: '', price: '', from: formatISO(new Date()), to: '' },
      ],
    }));
  };
  const updateDiscount = (i, changes) => {
    setForm((prev) => {
      const d = [...prev.discounts];
      d[i] = { ...d[i], ...changes };
      return { ...prev, discounts: d };
    });
  };
  const removeDiscount = (i) => {
    setForm((prev) => ({ ...prev, discounts: prev.discounts.filter((_, idx) => idx !== i) }));
  };

  // specs & keyInfo
  const addSpec = () => {
    setForm((prev) => ({ ...prev, specifications: [...prev.specifications, { title: '', value: '' }] }));
  };
  const updateSpec = (i, changes) => {
    setForm((prev) => {
      const s = [...prev.specifications];
      s[i] = { ...s[i], ...changes };
      return { ...prev, specifications: s };
    });
  };
  const removeSpec = (i) => {
    setForm((prev) => ({ ...prev, specifications: prev.specifications.filter((_, idx) => idx !== i) }));
  };

  const addKeyInfo = () => {
    setForm((prev) => ({ ...prev, keyInfo: [...prev.keyInfo, { title: '', value: '' }] }));
  };
  const updateKeyInfo = (i, changes) => {
    setForm((prev) => {
      const k = [...prev.keyInfo];
      k[i] = { ...k[i], ...changes };
      return { ...prev, keyInfo: k };
    });
  };
  const removeKeyInfo = (i) => {
    setForm((prev) => ({ ...prev, keyInfo: prev.keyInfo.filter((_, idx) => idx !== i) }));
  };

  // Colors & sizes quick add
  const addColor = (color) => setForm((p) => ({ ...p, colors: [...p.colors, color] }));
  const removeColor = (i) => setForm((p) => ({ ...p, colors: p.colors.filter((_, idx) => idx !== i) }));
  const addSize = (size) => setForm((p) => ({ ...p, sizes: [...p.sizes, size] }));
  const removeSize = (i) => setForm((p) => ({ ...p, sizes: p.sizes.filter((_, idx) => idx !== i) }));

  // upload helper to Cloudinary (used by many places)
  const uploadToCloudinary = async (file, type = 'image') => {
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!uploadPreset || !cloudName) throw new Error('Cloudinary env missing');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);
    fd.append('folder', `products/${type}`);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type === 'video' ? 'video' : 'image'}/upload`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Upload failed');
    }
    const data = await res.json();
    return data.secure_url;
  };

  // submit handler
  const handleSubmit = async (e, asDraft = false) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      // Basic validations - Skip for draft
      if (!asDraft) {
        if (!form.name || !form.price || !form.category) {
          setError('Please fill required fields: name, price, category');
          setUploading(false);
          return;
        }
      }

      // Upload cover (skip if draft and no file)
      let coverUrl = form.coverPhoto;
      if (coverFile) {
        coverUrl = await uploadToCloudinary(coverFile, 'image');
      }

      // Upload images
      let uploadedImageUrls = [];
      if (imageFiles.length) {
        uploadedImageUrls = await Promise.all(
          imageFiles.map((f) => uploadToCloudinary(f, 'image'))
        );
      }

      // Upload videos
      let uploadedVideoUrls = [];
      if (videoFiles.length) {
        uploadedVideoUrls = await Promise.all(
          videoFiles.map((f) => uploadToCloudinary(f, 'video'))
        );
      }

      const allImages = [...form.images, ...uploadedImageUrls];
      const allVideos = [...form.videos, ...uploadedVideoUrls];

      // Build payload with draft status
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description,
        price: Number(form.price) || 0,
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        stock: form.stock ? Number(form.stock) : 0,
        category: form.category || null,
        productType: form.productType,
        brand: form.brand,
        seller: form.seller,
        tags: form.tags,
        sizeGuide: form.sizeGuide,
        isActive: asDraft ? false : form.isActive, // Inactive if draft
        status: asDraft ? 'draft' : 'published',   // Set status
        isDraft: asDraft,                          // Set draft flag
        specifications: form.specifications,
        keyInfo: form.keyInfo,
        colors: form.colors,
        sizes: form.sizes,
        variants: form.variants,
        discounts: form.discounts,
        coverPhoto: coverUrl,
        videos: allVideos,
        images: allImages,
      };

      // Call save
      await saveMutation.mutateAsync(payload);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Save failed');
    } finally {
      setUploading(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Create Product'}</h1>
          <p className="text-gray-500 mt-1">
            {isEdit ? 'Update product details' : 'Fill in the product details'}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category *</Label>

                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>

                  <SelectContent>
                    {Array.isArray(categories) &&
                      categories.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Product Type</Label>
                <Select value={form.productType} onValueChange={(v) => setForm({ ...form, productType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select product type" /></SelectTrigger>
                  <SelectContent>
                    {productTypes?.map((pt) => <SelectItem key={pt._id} value={pt._id}>{pt.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Seller</Label>
                <Select value={form.seller} onValueChange={(v) => setForm({ ...form, seller: v })}>
                  <SelectTrigger><SelectValue placeholder="Select seller" /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(sellers) && sellers?.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Brand</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <Label>Price (₹) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <Label>Discount Price (₹)</Label>
                <Input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Short Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Cover */}
              <div>
                <Label>Cover Photo</Label>
                <label className="mt-2 flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg p-4 cursor-pointer">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <div className="text-sm text-gray-500">Upload Cover photo</div>
                  <div className="text-xs text-gray-400">PNG, JPG, GIF — max 8MB</div>
                  <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                </label>
                {coverPreview && (
                  <div className="mt-2 relative">
                    <img src={coverPreview} alt="cover" className="w-full h-40 object-cover rounded" />
                    <button type="button" onClick={removeCover} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Product photos */}
              <div>
                <Label>Product Photos</Label>
                <label className="mt-2 flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg p-4 cursor-pointer">
                  <Upload className="w-8 h-8 mb-2" />
                  <div className="text-sm text-gray-500">Upload Product photo(s)</div>
                  <div className="text-xs text-gray-400">PNG, JPG, WebP — max 8MB each</div>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {imagePreviews.map((p, i) => (
                      <div key={i} className="relative group">
                        <img src={p} alt={`img-${i}`} className="h-20 w-full object-cover rounded" />
                        <button onClick={() => removeImagePreview(i)} className="absolute top-1 right-1 p-1 bg-white rounded-full shadow opacity-0 group-hover:opacity-100">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video */}
              <div>
                <Label>Upload Video</Label>
                <label className="mt-2 flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg p-4 cursor-pointer">
                  <Video className="w-8 h-8 mb-2" />
                  <div className="text-sm text-gray-500">Upload Video</div>
                  <div className="text-xs text-gray-400">MP4/MOV/AVI — max 50MB</div>
                  <input type="file" accept="video/*" multiple onChange={handleVideoChange} className="hidden" />
                </label>
                {videoPreviews.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {videoPreviews.map((v, i) => (
                      <div key={i} className="relative">
                        <video src={v} controls className="w-full h-32 object-cover rounded" />
                        <button onClick={() => removeVideoPreview(i)} className="absolute top-1 right-1 p-1 bg-white rounded-full shadow">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variant */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Variant</CardTitle>
            <div className="flex gap-2">
              <Button onClick={addVariantRow} variant="outline"><Plus className="w-4 h-4" /> Add Variant</Button>
            </div>
          </CardHeader>
          <CardContent>
            {form.variants.length === 0 && <div className="text-sm text-gray-500">No variants yet.</div>}
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">SKU</th>
                    <th className="p-2">Variant Type</th>
                    <th className="p-2">Value</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Visible</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.variants.map((v, i) => (
                    <tr key={v.id}>
                      <td className="p-2">{v.sku}</td>
                      <td className="p-2">
                        <Input value={v.variantType} onChange={(e) => updateVariant(i, { variantType: e.target.value })} />
                      </td>
                      <td className="p-2"><Input value={v.value} onChange={(e) => updateVariant(i, { value: e.target.value })} /></td>
                      <td className="p-2"><Input type="number" value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} /></td>
                      <td className="p-2"><Input type="number" value={v.stock} onChange={(e) => updateVariant(i, { stock: e.target.value })} /></td>
                      <td className="p-2"><input type="checkbox" checked={v.visible} onChange={(e) => updateVariant(i, { visible: e.target.checked })} /></td>
                      <td className="p-2">
                        <Select value={v.status} onValueChange={(val) => updateVariant(i, { status: val })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <button type="button" onClick={() => removeVariant(i)} className="p-2 rounded bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {tagsList?.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      tags: prev.tags.includes(t._id) ? prev.tags.filter((x) => x !== t._id) : [...prev.tags, t._id],
                    }));
                  }}
                  className={`px-3 py-1 rounded-full border ${form.tags.includes(t._id) ? 'bg-primary-600 text-white' : 'bg-white'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Discount */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Discount</CardTitle>
            <Button onClick={addDiscount} variant="outline"><Plus className="w-4 h-4" /> Add New Discount</Button>
          </CardHeader>
          <CardContent>
            {form.discounts.map((d, i) => (
              <div key={d.id} className="flex gap-2 items-center mb-2">
                <Input placeholder="Discount Title" value={d.title} onChange={(e) => updateDiscount(i, { title: e.target.value })} />
                <Input placeholder="Discount Price" type="number" value={d.price} onChange={(e) => updateDiscount(i, { price: e.target.value })} />
                <Input type="datetime-local" value={d.from} onChange={(e) => updateDiscount(i, { from: e.target.value })} />
                <Input type="datetime-local" value={d.to} onChange={(e) => updateDiscount(i, { to: e.target.value })} />
                <button type="button" onClick={() => removeDiscount(i)} className="p-2 bg-red-50 rounded text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Specifications & Key Info */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Specifications</CardTitle>
            <Button onClick={addSpec} variant="outline"><Plus className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            {form.specifications.map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input placeholder="Title" value={s.title} onChange={(e) => updateSpec(i, { title: e.target.value })} />
                <Input placeholder="Value" value={s.value} onChange={(e) => updateSpec(i, { value: e.target.value })} />
                <button onClick={() => removeSpec(i)} className="p-2 bg-red-50 rounded text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Key Information</CardTitle>
            <Button onClick={addKeyInfo} variant="outline"><Plus className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            {form.keyInfo.map((k, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input placeholder="Title" value={k.title} onChange={(e) => updateKeyInfo(i, { title: e.target.value })} />
                <Input placeholder="Value" value={k.value} onChange={(e) => updateKeyInfo(i, { value: e.target.value })} />
                <button onClick={() => removeKeyInfo(i)} className="p-2 bg-red-50 rounded text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Colors / Sizes */}
        <Card>
          <CardHeader><CardTitle>Colors & Sizes</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-2">
              <Label>Colors</Label>
              <div className="flex gap-2 items-center mt-2">
                <input type="color" onChange={(e) => addColor(e.target.value)} />
                <div className="flex gap-2">
                  {form.colors.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <div style={{ background: c }} className="w-6 h-6 rounded-full border" />
                      <button onClick={() => removeColor(idx)} className="text-xs text-red-500">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label>Sizes</Label>
              <div className="flex gap-2 items-center mt-2">
                <Input placeholder="Add size (e.g. M)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (e.target.value) { addSize(e.target.value); e.target.value = ''; } } }} />
                <div className="flex gap-2">
                  {form.sizes.map((s, idx) => (
                    <div key={idx} className="px-2 py-1 border rounded">{s} <button onClick={() => removeSize(idx)} className="ml-1 text-red-500">x</button></div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final actions */}
        <div className="flex justify-between items-center">
          {/* Left side - Cancel */}
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/products')}
            disabled={uploading || saveMutation.isLoading}
          >
            Cancel
          </Button>

          {/* Right side - Save buttons */}
          <div className="flex gap-3">
            {/* Save as Draft Button */}
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={uploading || saveMutation.isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {(uploading || saveMutation.isLoading) && saveAsDraft && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save as Draft
            </Button>

            {/* Publish/Update Button */}
            <Button
              type="submit"
              onClick={(e) => {
                setSaveAsDraft(false);
                handleSubmit(e, false);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={uploading || saveMutation.isLoading}
            >
              {(uploading || saveMutation.isLoading) && !saveAsDraft && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {uploading && !saveAsDraft
                ? 'Publishing...'
                : saveMutation.isLoading && !saveAsDraft
                  ? 'Publishing...'
                  : isEdit
                    ? 'Update & Publish'
                    : 'Publish Product'
              }
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}
