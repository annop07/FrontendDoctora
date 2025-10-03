'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Stethoscope, Building, Plus, Search } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useAdminData } from '@/hooks/useAdminData';
import DoctorForm from '@/components/admin/DoctorForm';
import DoctorEditForm from '@/components/admin/DoctorEditForm';
import SpecialtyForms from '@/components/admin/SpecialtyForms';
import DoctorsTable from '@/components/admin/DoctorsTable';
import SpecialtiesTable from '@/components/admin/SpecialtiesTable';

interface Doctor {
  id: number;
  doctorName: string;
  email: string;
  specialty: { id: number; name: string };
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  roomNumber: string;
  isActive: boolean;
  bio?: string;
}

interface Specialty {
  id: number;
  name: string;
  description: string;
  doctorCount: number;
}

const AdminDashboard = () => {
  const { logout } = useAuth();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
  
  const {
    doctors,
    specialties,
    users,
    loading,
    error,
    backendStatus,
    loadData,
    loadDoctors,
    loadSpecialties,
    checkBackendConnection,
    toggleDoctorStatus,
    deleteSpecialty,
    deleteDoctor
  } = useAdminData(apiBaseUrl);

  const [activeTab, setActiveTab] = useState('doctors');
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [showEditDoctor, setShowEditDoctor] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showCreateSpecialty, setShowCreateSpecialty] = useState(false);
  const [showEditSpecialty, setShowEditSpecialty] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Filter functions
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !filterSpecialty || doctor.specialty.id.toString() === filterSpecialty;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && doctor.isActive) ||
                         (filterStatus === 'inactive' && !doctor.isActive);
    
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const filteredSpecialties = specialties.filter(specialty =>
    specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    specialty.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowEditDoctor(true);
  };

  const handleCloseEditDoctor = () => {
    setShowEditDoctor(false);
    setEditingDoctor(null);
  };

  const handleEditSpecialty = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setShowEditSpecialty(true);
  };

  const handleCloseEditSpecialty = () => {
    setShowEditSpecialty(false);
    setEditingSpecialty(null);
  };

  const handleDoctorCreated = async () => {
    await loadDoctors();
    await loadSpecialties(); // Refresh to update counts
  };

  const handleDoctorUpdated = async () => {
    await loadDoctors();
    await loadSpecialties(); // Refresh to update counts
  };

  const handleSpecialtyCreated = async () => {
    await loadSpecialties();
  };

  const handleSpecialtyUpdated = async () => {
    await loadSpecialties();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-600" />
              <span className="ml-2 text-xl font-semibold">Admin Dashboard</span>
              
              {/* Backend Status Indicator */}
              <div className="ml-4 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  backendStatus === 'connected' ? 'bg-green-500' : 
                  backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {backendStatus === 'connected' ? 'Backend Connected' : 
                   backendStatus === 'disconnected' ? 'Backend Disconnected' : 'Checking...'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Administrator</span>
              <button 
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Connection Error */}
      {backendStatus === 'disconnected' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Backend Connection Failed</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <div className="mt-3 text-sm text-red-700">
              <p className="font-medium">To fix this issue:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Start your Spring Boot backend: <code className="bg-red-100 px-1 rounded">mvn spring-boot:run</code></li>
                <li>Verify it's running on port 8082: <code className="bg-red-100 px-1 rounded">curl {apiBaseUrl}/api/specialties</code></li>
                <li>Check CORS configuration in your backend</li>
                <li>Ensure your database is running</li>
              </ol>
            </div>
            <button 
              onClick={checkBackendConnection}
              className="mt-3 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && backendStatus !== 'disconnected' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">System Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button 
              onClick={loadData}
              className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content - only show if backend is connected */}
      {backendStatus === 'connected' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Navigation */}
          <div className="flex space-x-8 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'doctors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Stethoscope className="w-5 h-5 mr-2" />
                Manage Doctors
              </div>
            </button>
            <button
              onClick={() => setActiveTab('specialties')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'specialties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Manage Specialties
              </div>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {activeTab === 'doctors' && (
              <>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Specialties</option>
                  {specialties.map(specialty => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                <button
                  onClick={() => setShowCreateDoctor(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Doctor
                </button>
              </>
            )}
            
            {activeTab === 'specialties' && (
              <button
                onClick={() => setShowCreateSpecialty(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Specialty
              </button>
            )}
          </div>

          {/* Content Tables */}
          {activeTab === 'doctors' && (
            <DoctorsTable
              doctors={filteredDoctors}
              loading={loading}
              onToggleStatus={toggleDoctorStatus}
              onEdit={handleEditDoctor}
              onDelete={deleteDoctor}
            />
          )}

          {activeTab === 'specialties' && (
            <SpecialtiesTable
              specialties={filteredSpecialties}
              onEdit={handleEditSpecialty}
              onDelete={deleteSpecialty}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <DoctorForm
        isOpen={showCreateDoctor}
        onClose={() => setShowCreateDoctor(false)}
        onDoctorCreated={handleDoctorCreated}
        users={users}
        specialties={specialties}
        doctors={doctors}
        apiBaseUrl={apiBaseUrl}
      />

      <DoctorEditForm
        isOpen={showEditDoctor}
        doctor={editingDoctor}
        onClose={handleCloseEditDoctor}
        onDoctorUpdated={handleDoctorUpdated}
        specialties={specialties}
        apiBaseUrl={apiBaseUrl}
      />

      <SpecialtyForms
        createFormOpen={showCreateSpecialty}
        editFormOpen={showEditSpecialty}
        editingSpecialty={editingSpecialty}
        onCreateClose={() => setShowCreateSpecialty(false)}
        onEditClose={handleCloseEditSpecialty}
        onSpecialtyCreated={handleSpecialtyCreated}
        onSpecialtyUpdated={handleSpecialtyUpdated}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
};

export default AdminDashboard;