'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, Globe, Building, Users } from 'lucide-react';
import api from '@/lib/axios';
import ScopeToggle from '@/components/ui/ScopeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function CourseCreateForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userInstitutes, setUserInstitutes] = useState([]);
  const [currentInstitute, setCurrentInstitute] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    price: 0,
    currency: 'USD',
    tags: [],
    requirements: [],
    whatYouWillLearn: [],
    visibilityScope: 'institute',
    instituteId: null,
    enrollmentSettings: {
      allowInstituteOnly: false,
      allowedInstitutes: [],
      requireApproval: false
    }
  });

  // Load user's institutes
  useEffect(() => {
    loadUserInstitutes();
  }, []);

  const loadUserInstitutes = async () => {
    try {
      const response = await api.get('/membership/my-institutes');
      if (response.data.success) {
        setUserInstitutes(response.data.institutes);
        
        // Set current institute if available
        const current = response.data.institutes.find(inst => inst.isCurrent);
        if (current) {
          setCurrentInstitute(current);
          setFormData(prev => ({
            ...prev,
            instituteId: current.id,
            visibilityScope: 'institute'
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load institutes:', error);
    }
  };

  const handleScopeChange = (scope, instituteId) => {
    setFormData(prev => ({
      ...prev,
      visibilityScope: scope,
      instituteId: scope === 'institute' ? instituteId : null,
      enrollmentSettings: {
        ...prev.enrollmentSettings,
        allowInstituteOnly: scope === 'institute'
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate institute selection for institute scope
      if (formData.visibilityScope === 'institute' && !formData.instituteId) {
        toast.error('Please select an institute for institute-only courses');
        return;
      }

      const response = await api.post('/courses', formData);
      
      if (response.data.success) {
        toast.success('Course created successfully!');
        router.push(`/tutor/courses/${response.data.course._id}`);
      }
    } catch (error) {
      console.error('Create course error:', error);
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Create New Course</h1>
        <Button
          form="course-form"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            'Creating...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Create Course
            </>
          )}
        </Button>
      </div>

      <form id="course-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter course title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="">Select category</option>
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="marketing">Marketing</option>
                  <option value="data-science">Data Science</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your course..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <select
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visibility Scope */}
        <ScopeToggle
          scope={formData.visibilityScope}
          onScopeChange={handleScopeChange}
          instituteId={formData.instituteId}
          userInstitutes={userInstitutes}
        />

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-indigo-500 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.target.previousElementSibling;
                    addTag(input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>What Students Will Learn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.whatYouWillLearn.map((outcome, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={outcome}
                    onChange={(e) => {
                      const newOutcomes = [...formData.whatYouWillLearn];
                      newOutcomes[index] = e.target.value;
                      setFormData(prev => ({ ...prev, whatYouWillLearn: newOutcomes }));
                    }}
                    placeholder="Learning outcome..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newOutcomes = formData.whatYouWillLearn.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, whatYouWillLearn: newOutcomes }));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    whatYouWillLearn: [...prev.whatYouWillLearn, '']
                  }));
                }}
              >
                Add Learning Outcome
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
