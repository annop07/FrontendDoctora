'use client';

import React, { useState, useEffect } from 'react';

interface Specialty {
  id: number;
  name: string;
  description: string;
  doctorCount: number;
}

interface SpecialtyFormsProps {
  createFormOpen: boolean;
  editFormOpen: boolean;
  editingSpecialty: Specialty | null;
  onCreateClose: () => void;
  onEditClose: () => void;
  onSpecialtyCreated: () => void;
  onSpecialtyUpdated: () => void;
  apiBaseUrl: string;
  getAuthHeaders: () => Record<string, string>;
  handleApiError: (response: Response, context: string) => Promise<void>;
}

const SpecialtyForms: React.FC<SpecialtyFormsProps> = ({
  createFormOpen,
  editFormOpen,
  editingSpecialty,
  onCreateClose,
  onEditClose,
  onSpecialtyCreated,
  onSpecialtyUpdated,
  apiBaseUrl,
  getAuthHeaders,
  handleApiError
}) => {
  return (
    <>
      {createFormOpen && (
        <CreateSpecialtyForm
          onClose={onCreateClose}
          onSpecialtyCreated={onSpecialtyCreated}
          apiBaseUrl={apiBaseUrl}
          getAuthHeaders={getAuthHeaders}
          handleApiError={handleApiError}
        />
      )}
      {editFormOpen && (
        <EditSpecialtyForm
          editingSpecialty={editingSpecialty}
          onClose={onEditClose}
          onSpecialtyUpdated={onSpecialtyUpdated}
          apiBaseUrl={apiBaseUrl}
          getAuthHeaders={getAuthHeaders}
          handleApiError={handleApiError}
        />
      )}
    </>
  );
};

interface CreateSpecialtyFormProps {
  onClose: () => void;
  onSpecialtyCreated: () => void;
  apiBaseUrl: string;
  getAuthHeaders: () => Record<string, string>;
  handleApiError: (response: Response, context: string) => Promise<void>;
}

const CreateSpecialtyForm: React.FC<CreateSpecialtyFormProps> = ({
  onClose,
  onSpecialtyCreated,
  apiBaseUrl,
  getAuthHeaders,
  handleApiError
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a specialty name');
      return;
    }

    setLoading(true);
    setSubmitError('');
    
    try {
      const headers = getAuthHeaders();
      const url = `${apiBaseUrl}/api/admin/specialties`;
      
      console.log('Sending request to:', url);
      console.log('With data:', formData);
      console.log('With headers:', headers);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        alert('Specialty created successfully!');
        onClose();
        onSpecialtyCreated();
      } else {
        await handleApiError(response, 'Creating specialty');
      }
    } catch (error) {
      console.error('Error creating specialty:', error);
      const errorMessage = (error as Error).message;
      setSubmitError(errorMessage);
      alert('Error creating specialty: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Specialty</h3>
        
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Specialty Name</label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              required
              placeholder="e.g., Cardiology, Neurology"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 h-24"
              placeholder="Brief description of the specialty"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Specialty'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EditSpecialtyFormProps {
  editingSpecialty: Specialty | null;
  onClose: () => void;
  onSpecialtyUpdated: () => void;
  apiBaseUrl: string;
  getAuthHeaders: () => Record<string, string>;
  handleApiError: (response: Response, context: string) => Promise<void>;
}

const EditSpecialtyForm: React.FC<EditSpecialtyFormProps> = ({
  editingSpecialty,
  onClose,
  onSpecialtyUpdated,
  apiBaseUrl,
  getAuthHeaders,
  handleApiError
}) => {
  const [formData, setFormData] = useState({
    name: editingSpecialty?.name || '',
    description: editingSpecialty?.description || ''
  });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingSpecialty) {
      setFormData({
        name: editingSpecialty.name,
        description: editingSpecialty.description
      });
    }
  }, [editingSpecialty]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a specialty name');
      return;
    }

    if (!editingSpecialty) {
      alert('No specialty selected for editing');
      return;
    }

    setLoading(true);
    setSubmitError('');
    
    try {
      const headers = getAuthHeaders();
      const url = `${apiBaseUrl}/api/admin/specialties/${editingSpecialty.id}`;
      
      console.log('Sending update request to:', url);
      console.log('With data:', formData);
      console.log('With headers:', headers);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        alert('Specialty updated successfully!');
        onClose();
        onSpecialtyUpdated();
      } else {
        await handleApiError(response, 'Updating specialty');
      }
    } catch (error) {
      console.error('Error updating specialty:', error);
      const errorMessage = (error as Error).message;
      setSubmitError(errorMessage);
      alert('Error updating specialty: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Edit Specialty</h3>
        
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Specialty Name</label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              required
              placeholder="e.g., Cardiology, Neurology"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 h-24"
              placeholder="Brief description of the specialty"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Specialty'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialtyForms;