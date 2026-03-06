'use client';

import { useState } from 'react';
import { Globe, Building, Users, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function ScopeToggle({ 
  scope, 
  onScopeChange, 
  instituteId, 
  userInstitutes,
  disabled = false 
}) {
  const [selectedInstitute, setSelectedInstitute] = useState(instituteId);
  
  const scopeOptions = [
    {
      value: 'global',
      label: 'Global',
      description: 'Visible to all users across all institutes',
      icon: Globe,
      color: 'blue'
    },
    {
      value: 'institute',
      label: 'Institute Only',
      description: 'Visible only to members of your institute',
      icon: Building,
      color: 'purple'
    },
    {
      value: 'private',
      label: 'Private',
      description: 'Visible only to you',
      icon: Lock,
      color: 'gray'
    }
  ];

  const handleScopeChange = (newScope) => {
    if (disabled) return;
    
    let newInstituteId = selectedInstitute;
    
    // Auto-select institute if switching to institute scope
    if (newScope === 'institute' && !selectedInstitute && userInstitutes?.length > 0) {
      newInstituteId = userInstitutes[0].id;
    }
    
    onScopeChange(newScope, newInstituteId);
  };

  const handleInstituteChange = (newInstituteId) => {
    setSelectedInstitute(newInstituteId);
    if (scope === 'institute') {
      onScopeChange('institute', newInstituteId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Visibility Scope
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scope Options */}
        <div className="space-y-3">
          <Label>Who can see this?</Label>
          <div className="grid grid-cols-1 gap-2">
            {scopeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = scope === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleScopeChange(option.value)}
                  disabled={disabled}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : 'border-slate-200 hover:border-slate-300'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 text-${option.color}-600`} />
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">
                        {option.label}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className={`w-5 h-5 rounded-full bg-${option.color}-500 flex items-center justify-center`}>
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Institute Selection (when scope is institute) */}
        {scope === 'institute' && (
          <div className="space-y-2">
            <Label>Select Institute</Label>
            {userInstitutes && userInstitutes.length > 0 ? (
              <select
                value={selectedInstitute || ''}
                onChange={(e) => handleInstituteChange(e.target.value)}
                disabled={disabled}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Choose an institute...</option>
                {userInstitutes.map((institute) => (
                  <option key={institute.id} value={institute.id}>
                    {institute.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  You need to be a member of an institute to use this scope
                </p>
              </div>
            )}
          </div>
        )}

        {/* Additional Options for Institute Scope */}
        {scope === 'institute' && selectedInstitute && (
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Allow other institutes</div>
                <div className="text-xs text-slate-500">
                  Let specific institutes also access this
                </div>
              </div>
              <Switch disabled={disabled} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Require approval</div>
                <div className="text-xs text-slate-500">
                  Users need approval to access
                </div>
              </div>
              <Switch disabled={disabled} />
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="p-3 bg-slate-100 rounded-lg">
          <div className="text-xs font-medium text-slate-600 mb-1">Preview:</div>
          <div className="text-sm text-slate-800">
            {scope === 'global' && (
              <span>🌍 This will be visible to everyone on the platform</span>
            )}
            {scope === 'institute' && selectedInstitute && (
              <span>🏢 Only members of selected institute can see this</span>
            )}
            {scope === 'private' && (
              <span>🔒 Only you can see this</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
